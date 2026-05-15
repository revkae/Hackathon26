/**
 * KOBİ Kaptanı — Eval Runner
 *
 * Usage:  npm run evals
 * Prereq: .env.local with NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
 *         SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY (or GCP_PROJECT_ID)
 *
 * Auth-context note:
 *   The agents use `@/lib/supabase/server` which calls Next.js `cookies()`.
 *   Outside the Next.js runtime this throws "cookies() was called outside a request scope".
 *   This runner patches the module registry BEFORE importing agents to inject a
 *   service-role Supabase client that impersonates the demo user (ayse@seramik.com).
 *   If the patch fails for any agent, that agent's cases are marked as ERROR and
 *   a stub results.json is still produced so the dashboard widget works.
 *
 * NOTE: Do NOT run during implementation — costs Gemini quota (~10 min runtime).
 */

// ─── Step 0: Mock next/headers BEFORE any agent imports ───────────────────────
// tsx/Node can't call the real Next.js `cookies()` outside a request context.
// We install a fake that returns an empty cookie store — agents will get no
// user from cookie-based auth, so we also patch createClient to return a
// service-role client bound to the demo user ID resolved below.
import { createRequire } from 'node:module';

const _require = createRequire(import.meta.url);

// Polyfill `next/headers` with a no-op cookies() implementation.
const fakeHeaders = {
  cookies: () => ({
    getAll: () => [],
    get: (_name: string) => undefined,
    set: () => {},
    delete: () => {},
  }),
  headers: () => new Map(),
};

// Inject into require cache under both possible resolution keys.
// tsx uses CJS interop, so this affects dynamic imports routed through require.
_require.cache['next/headers'] = {
  id: 'next/headers',
  filename: 'next/headers',
  loaded: true,
  exports: fakeHeaders,
  children: [],
  paths: [],
  parent: null,
} as unknown as NodeJS.Module;

// ─── Step 1: Env + Supabase admin client ──────────────────────────────────────
import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const DEMO_EMAIL = 'ayse@seramik.com';
const DEMO_PASSWORD = 'AyseDemo2026!';

if (!SUPABASE_URL || !SUPABASE_ANON || !SUPABASE_SERVICE) {
  console.error('Missing required env vars. Ensure .env.local has NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const adminClient = createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ─── Step 2: Fetch demo user + products ───────────────────────────────────────
async function getDemoUserId(): Promise<string> {
  const { data, error } = await adminClient.auth.admin.listUsers();
  if (error) throw new Error(`Failed to list users: ${error.message}`);
  const user = data.users.find(u => u.email === DEMO_EMAIL);
  if (!user) throw new Error(`Demo user ${DEMO_EMAIL} not found — run the seed script first`);
  return user.id;
}

async function getProductIds(userId: string): Promise<string[]> {
  const { data, error } = await adminClient
    .from('products')
    .select('id')
    .eq('profile_id', userId)
    .order('created_at');
  if (error) throw new Error(`Failed to fetch products: ${error.message}`);
  return (data ?? []).map(p => p.id as string);
}

// ─── Step 3: Patch @/lib/supabase/server to return a service-role client ─────
// This is invoked after we know the demo user ID.
// We patch the compiled module path that tsx resolves @/lib/supabase/server to.
function patchSupabaseServerClient(userId: string) {
  // The resolved absolute path for @/lib/supabase/server
  const serverClientPath = path.join(process.cwd(), 'src/lib/supabase/server.ts');

  const mockedClient = createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Override getUser to return the demo user
  const originalGetUser = mockedClient.auth.getUser.bind(mockedClient.auth);
  mockedClient.auth.getUser = async () => {
    return {
      data: {
        user: {
          id: userId,
          email: DEMO_EMAIL,
          aud: 'authenticated',
          role: 'authenticated',
          created_at: new Date().toISOString(),
          app_metadata: {},
          user_metadata: {},
        } as any,
      },
      error: null,
    };
  };

  const mockModule = {
    id: serverClientPath,
    filename: serverClientPath,
    loaded: true,
    exports: { createClient: async () => mockedClient },
    children: [],
    paths: [],
    parent: null,
  };

  // Register under multiple possible keys tsx might use
  _require.cache[serverClientPath] = mockModule as unknown as NodeJS.Module;
  _require.cache['@/lib/supabase/server'] = mockModule as unknown as NodeJS.Module;

  return mockedClient;
}

// ─── Step 4: Types ────────────────────────────────────────────────────────────
interface EvalCase {
  id: string;
  input: Record<string, any>;
  groundTruth?: any;
  rubric: any;
}

interface EvalResult {
  caseId: string;
  passed: boolean;
  score: number;
  output: any;
  reasoning: string;
  durationMs: number;
}

// ─── Step 5: Scoring ──────────────────────────────────────────────────────────
function evaluateOutput(
  agent: string,
  testCase: EvalCase,
  output: any,
): { passed: boolean; score: number; reasoning: string } {
  if (agent === 'seo') {
    const gt = testCase.groundTruth;
    if (!output?.newTitle) return { passed: false, score: 0, reasoning: 'No newTitle in output' };
    const lengthOk = output.newTitle.length <= gt.maxTitleLength;
    const matchedKws = (gt.keywords as string[]).filter(kw =>
      output.newTitle.toLowerCase().includes(kw.toLowerCase()),
    );
    const kwScore = Math.min(0.5, (matchedKws.length / Math.max(1, gt.keywords.length)) * 0.5);
    const score = (lengthOk ? 0.5 : 0) + kwScore;
    return {
      passed: score >= 0.5,
      score,
      reasoning: `length:${lengthOk}(${output.newTitle.length}/${gt.maxTitleLength}), kw:${matchedKws.length}/${gt.keywords.length}`,
    };
  }

  if (agent === 'marketing') {
    const r = testCase.rubric;
    if (!output?.caption) return { passed: false, score: 0, reasoning: 'No caption in output' };
    const checks = [
      output.caption.length >= r.captionLengthMin,
      output.caption.length <= r.captionLengthMax,
      Array.isArray(output.hashtags) &&
        output.hashtags.length >= r.hashtagsMin &&
        output.hashtags.length <= r.hashtagsMax,
      Array.isArray(output.imagePrompts) &&
        output.imagePrompts.length >= r.imagePromptsMin &&
        output.imagePrompts.length <= r.imagePromptsMax,
    ];
    const score = checks.filter(Boolean).length / checks.length;
    return {
      passed: score >= 0.75,
      score,
      reasoning: `checks:[${checks.map(c => (c ? 'ok' : 'fail')).join(',')}] caption:${output.caption.length}ch`,
    };
  }

  if (agent === 'pricing') {
    const gt = testCase.groundTruth;
    if (output?.suggestedPrice == null) return { passed: false, score: 0, reasoning: 'No suggestedPrice in output' };
    const inRange =
      output.suggestedPrice >= gt.minSuggestedPrice &&
      output.suggestedPrice <= gt.maxSuggestedPrice;
    const riskOk = (gt.acceptableRiskLevels as string[]).includes(output.riskLevel);
    const score = (inRange ? 0.7 : 0) + (riskOk ? 0.3 : 0);
    return {
      passed: score >= 0.7,
      score,
      reasoning: `price:${output.suggestedPrice}(range:${gt.minSuggestedPrice}-${gt.maxSuggestedPrice}):${inRange}, risk:${output.riskLevel}:${riskOk}`,
    };
  }

  if (agent === 'reviews') {
    const gt = testCase.groundTruth;
    if (!output?.sentiment) return { passed: false, score: 0, reasoning: 'No sentiment in output' };
    const totalOk = output.totalReviews >= gt.minTotalReviews;
    const sentimentSum =
      (output.sentiment.positive ?? 0) +
      (output.sentiment.neutral ?? 0) +
      (output.sentiment.negative ?? 0);
    const sumOk =
      !gt.sentimentMustSumToTotal || sentimentSum === output.totalReviews;
    const score = (totalOk ? 0.5 : 0) + (sumOk ? 0.5 : 0);
    return {
      passed: score >= 0.5,
      score,
      reasoning: `total:${output.totalReviews}(min:${gt.minTotalReviews}):${totalOk}, sum:${sentimentSum}/${output.totalReviews}:${sumOk}`,
    };
  }

  if (agent === 'cashflow') {
    const gt = testCase.groundTruth;
    if (!output?.projection) return { passed: false, score: 0, reasoning: 'No projection in output' };
    const lengthOk = output.projection.length === gt.projectionLength;
    const riskOk = (gt.validRiskScores as string[]).includes(output.riskScore);
    const commentaryOk =
      typeof output.commentary === 'string' &&
      output.commentary.length >= gt.minCommentaryLength;
    const score = (lengthOk ? 0.4 : 0) + (riskOk ? 0.3 : 0) + (commentaryOk ? 0.3 : 0);
    return {
      passed: score >= 0.7,
      score,
      reasoning: `proj:${output.projection.length}(want:${gt.projectionLength}):${lengthOk}, risk:${output.riskScore}:${riskOk}, commentary:${output.commentary?.length}ch:${commentaryOk}`,
    };
  }

  return { passed: false, score: 0, reasoning: `Unknown agent: ${agent}` };
}

// ─── Step 6: Agent runner ─────────────────────────────────────────────────────
type AgentName = 'seo' | 'marketing' | 'pricing' | 'reviews' | 'cashflow';

async function loadAgent(name: AgentName): Promise<(input: any) => Promise<any>> {
  // Dynamic imports happen after the module cache patches above.
  // tsx resolves @/ paths via tsconfig, but the require.cache patch may not
  // affect ESM dynamic imports — so we import with full relative paths.
  switch (name) {
    case 'seo': {
      const mod = await import('../src/agents/seo');
      return (input) => mod.seoAgent(input);
    }
    case 'marketing': {
      const mod = await import('../src/agents/marketing');
      return (input) => mod.marketingAgent(input);
    }
    case 'pricing': {
      const mod = await import('../src/agents/pricing');
      return (input) => mod.pricingAgent(input);
    }
    case 'reviews': {
      const mod = await import('../src/agents/reviews');
      return (input) => mod.reviewsAgent(input);
    }
    case 'cashflow': {
      const mod = await import('../src/agents/cashflow');
      return (input) => mod.cashFlowAgent(input);
    }
  }
}

async function runEvalsForAgent(
  agentName: AgentName,
  productIds: string[],
): Promise<EvalResult[]> {
  const filePath = path.join(process.cwd(), 'tests/evals', `${agentName}-eval.json`);
  const file = JSON.parse(await fs.readFile(filePath, 'utf-8')) as { cases: EvalCase[] };
  const cases = file.cases;
  const results: EvalResult[] = [];

  let agentFn: ((input: any) => Promise<any>) | null = null;
  try {
    agentFn = await loadAgent(agentName);
  } catch (loadErr) {
    const msg = loadErr instanceof Error ? loadErr.message : String(loadErr);
    console.warn(`  [WARN] Could not load ${agentName} agent: ${msg}`);
    // Return all cases as errored
    return cases.map(c => ({
      caseId: c.id,
      passed: false,
      score: 0,
      output: null,
      reasoning: `Agent load failed: ${msg}`,
      durationMs: 0,
    }));
  }

  for (const c of cases) {
    const start = Date.now();
    try {
      const resolvedInput = { ...c.input };

      // Resolve productIndex → productId for product-based agents
      if (typeof resolvedInput.productIndex === 'number') {
        const idx = resolvedInput.productIndex as number;
        if (idx >= productIds.length) {
          throw new Error(
            `productIndex ${idx} out of range (only ${productIds.length} products seeded)`,
          );
        }
        resolvedInput.productId = productIds[idx];
        delete resolvedInput.productIndex;
      }

      const output = await agentFn(resolvedInput);
      const duration = Date.now() - start;
      const { passed, score, reasoning } = evaluateOutput(agentName, c, output);
      results.push({ caseId: c.id, passed, score, output, reasoning, durationMs: duration });
      console.log(
        `  ${passed ? 'PASS' : 'FAIL'} [${agentName}] ${c.id}: ${(score * 100).toFixed(0)}% (${duration}ms) — ${reasoning}`,
      );
    } catch (err) {
      const duration = Date.now() - start;
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`  ERROR [${agentName}] ${c.id}: ${msg}`);
      results.push({
        caseId: c.id,
        passed: false,
        score: 0,
        output: null,
        reasoning: `Error: ${msg}`,
        durationMs: duration,
      });
    }
  }

  return results;
}

// ─── Step 7: Main ─────────────────────────────────────────────────────────────
async function main() {
  console.log('=== KOBİ Kaptanı Eval Runner ===\n');

  // Resolve demo user
  console.log(`Resolving demo user (${DEMO_EMAIL})...`);
  let userId: string;
  try {
    userId = await getDemoUserId();
    console.log(`  User ID: ${userId}`);
  } catch (err) {
    console.error('FATAL: Could not resolve demo user:', err);
    process.exit(1);
  }

  // Fetch product IDs
  console.log('\nFetching product IDs (service role)...');
  let productIds: string[];
  try {
    productIds = await getProductIds(userId);
    console.log(`  Found ${productIds.length} products`);
    if (productIds.length < 10) {
      console.warn(
        `  WARNING: Only ${productIds.length} products found — some eval cases reference productIndex up to 9. Run the seed script first.`,
      );
    }
  } catch (err) {
    console.error('FATAL: Could not fetch products:', err);
    process.exit(1);
  }

  // Patch supabase server client BEFORE importing any agents
  patchSupabaseServerClient(userId);
  console.log('\nSupabase server client patched for eval context.\n');

  // Run evals for each agent
  const agents: AgentName[] = ['seo', 'marketing', 'pricing', 'reviews', 'cashflow'];
  const allResults: Record<string, EvalResult[]> = {};

  for (const agent of agents) {
    console.log(`\n=== ${agent.toUpperCase()} agent (10 cases) ===`);
    allResults[agent] = await runEvalsForAgent(agent, productIds);
  }

  // Summary
  console.log('\n\n=== SUMMARY ===');
  let totalPass = 0;
  let totalCases = 0;
  let totalScore = 0;

  for (const [agent, results] of Object.entries(allResults)) {
    const pass = results.filter(r => r.passed).length;
    const avg = results.reduce((s, r) => s + r.score, 0) / results.length;
    console.log(
      `  ${agent.padEnd(10)}: ${pass}/${results.length} passed | avg score ${(avg * 100).toFixed(1)}%`,
    );
    totalPass += pass;
    totalCases += results.length;
    totalScore += results.reduce((s, r) => s + r.score, 0);
  }

  const overallAvg = totalScore / totalCases;
  console.log(
    `\n  OVERALL  : ${totalPass}/${totalCases} passed (${((totalPass / totalCases) * 100).toFixed(1)}%) | avg score ${(overallAvg * 100).toFixed(1)}%`,
  );

  // Write results.json
  const outPath = path.join(process.cwd(), 'tests/evals/results.json');
  const resultsData = {
    runAt: new Date().toISOString(),
    summary: {
      totalPass,
      totalCases,
      overallAvg,
      passRate: totalPass / totalCases,
    },
    allResults,
  };
  await fs.writeFile(outPath, JSON.stringify(resultsData, null, 2));
  console.log(`\nResults written to ${outPath}`);
}

main().catch(err => {
  console.error('FATAL:', err);
  process.exit(1);
});
