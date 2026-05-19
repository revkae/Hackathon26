import { describe, it, expect, vi } from 'vitest';
import { getAppMode } from '@/lib/app-mode';

function makeSupabase(opts: {
  user?: { id: string } | null;
  appMode?: string | null;
  error?: unknown;
}) {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: opts.user ?? null } }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue(
            opts.error
              ? { data: null, error: opts.error }
              : { data: { app_mode: opts.appMode ?? null }, error: null },
          ),
        }),
      }),
    }),
  } as unknown as Parameters<typeof getAppMode>[0];
}

describe('getAppMode', () => {
  it('returns mock when there is no user', async () => {
    const sb = makeSupabase({ user: null });
    expect(await getAppMode(sb)).toBe('mock');
  });

  it('returns the stored mode for a logged-in user', async () => {
    const sb = makeSupabase({ user: { id: 'u1' }, appMode: 'real' });
    expect(await getAppMode(sb)).toBe('real');
  });

  it('defaults to mock when the row returns null', async () => {
    const sb = makeSupabase({ user: { id: 'u1' }, appMode: null });
    expect(await getAppMode(sb)).toBe('mock');
  });
});
