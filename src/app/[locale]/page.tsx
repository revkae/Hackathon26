import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Box,
  Container,
  Group,
  Stack,
  SimpleGrid,
  Title,
  Text,
  Button,
  Badge,
  Card,
  Paper,
  ThemeIcon,
  Anchor,
} from '@mantine/core';
import {
  IconAnchor,
  IconSearch,
  IconSpeakerphone,
  IconCoin,
  IconMessageCircle,
  IconChartBar,
  IconArrowRight,
  IconSparkles,
} from '@tabler/icons-react';
import { createClient } from '@/lib/supabase/server';
import { LanguageToggle } from '@/components/LanguageToggle';
import { ColorSchemeToggle } from '@/components/ColorSchemeToggle';
import { StatusIcon } from '@/components/StatusIcon';
import { AgentChip } from '@/components/AgentChip';

export const dynamic = 'force-dynamic';

type AgentCopy = { name: string; desc: string };
type StepCopy = { title: string; desc: string };

interface Copy {
  navLogin: string;
  navStart: string;
  eyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  ctaPrimary: string;
  ctaSecondary: string;
  agentsTitle: string;
  agentsIntro: string;
  agents: Record<'seo' | 'marketing' | 'pricing' | 'reviews' | 'cashflow', AgentCopy>;
  howTitle: string;
  howIntro: string;
  steps: StepCopy[];
  ctaTitle: string;
  ctaText: string;
  ctaButton: string;
  footerTagline: string;
  mockTitle: string;
  mockBriefLabel: string;
  mockBrief: string[];
  mockTiles: { label: string; value: string }[];
}

const COPY: Record<string, Copy> = {
  tr: {
    navLogin: 'Giriş',
    navStart: 'Ücretsiz Başla',
    eyebrow: 'Gemini AI Hackathon 2026',
    heroTitle: 'Beş asistan, bir kaptan, sıfır endişe.',
    heroSubtitle:
      'Çok kanallı satış yapan işletmeniz için altı yapay zeka uzmanı. SEO’dan nakit akışına kadar her şeyi izler, birbirleriyle konuşur ve size tek panelden net aksiyonlar sunar.',
    ctaPrimary: 'Ücretsiz Başla',
    ctaSecondary: 'Nasıl çalışır?',
    agentsTitle: 'Tanışın: Beş Uzman Ajan',
    agentsIntro:
      'Her ajan tek bir işin ustası. Hepsini, doğru uzmanı doğru anda görevlendiren bir Kaptan yönetir.',
    agents: {
      seo: { name: 'SEO Ajanı', desc: 'Ürün başlıklarını ve açıklamalarını arama motorlarında üst sıralar için optimize eder.' },
      marketing: { name: 'Pazarlama Ajanı', desc: 'Instagram açıklaması, görsel fikirleri ve hazır hashtag setleri üretir.' },
      pricing: { name: 'Fiyat Ajanı', desc: 'Rakip pazaryeri fiyatlarını izler, kâr marjınızı koruyan fiyatı önerir.' },
      reviews: { name: 'Yorum Ajanı', desc: 'Müşteri yorumlarını analiz eder, dilden bağımsız özet ve yanıt taslakları çıkarır.' },
      cashflow: { name: 'Nakit Akışı Ajanı', desc: '30/60/90 günlük nakit projeksiyonu yapar, senaryoları canlı simüle eder.' },
    },
    howTitle: 'Nasıl Çalışır?',
    howIntro: 'Üç adımda, teknik bilgi gerekmeden.',
    steps: [
      { title: 'Sorun', desc: 'Doğal dille yazın: “Vazo X için lansman hazırla”. Form yok, menü yok.' },
      { title: 'Ajanlar Konuşur', desc: 'Kaptan doğru uzmanları seçer; uzmanlar gerektiğinde birbirine danışır (Agent-to-Agent).' },
      { title: 'Aksiyon Alın', desc: 'Birleşik, uygulanabilir öneri tek panelde önünüze gelir — tek tıkla hayata geçirin.' },
    ],
    ctaTitle: 'İşletmenizi yapay zeka ekibine devredin.',
    ctaText: 'Kurulum yok, kredi kartı yok. Bir dakikada içeride olun.',
    ctaButton: 'Hemen Ücretsiz Başla',
    footerTagline: 'Beş asistan, bir kaptan, sıfır endişe.',
    mockTitle: 'KOBİ Kaptanı — Bugün',
    mockBriefLabel: 'GÜNÜN BRIEF’İ',
    mockBrief: [
      '3 yorum negatif eğilimde',
      'Rakipler son 7 günde %12 zam yaptı',
      'Bu ay nakit pozisyon güvenli',
    ],
    mockTiles: [
      { label: 'Bugün Sipariş', value: '48' },
      { label: 'Bekleyen Yorum', value: '12' },
      { label: 'Açık Aksiyon', value: '3' },
    ],
  },
  en: {
    navLogin: 'Sign in',
    navStart: 'Start free',
    eyebrow: 'Gemini AI Hackathon 2026',
    heroTitle: 'Five assistants, one captain, zero worries.',
    heroSubtitle:
      'Six AI specialists for your multi-channel business. From SEO to cash flow, they watch everything, talk to each other, and hand you clear actions from a single panel.',
    ctaPrimary: 'Start free',
    ctaSecondary: 'How it works',
    agentsTitle: 'Meet your five specialist agents',
    agentsIntro:
      'Each agent masters one job. A Captain orchestrates them all, dispatching the right specialist at the right moment.',
    agents: {
      seo: { name: 'SEO Agent', desc: 'Optimizes product titles and descriptions to rank higher in search engines.' },
      marketing: { name: 'Marketing Agent', desc: 'Generates Instagram captions, image ideas and ready-to-use hashtag sets.' },
      pricing: { name: 'Pricing Agent', desc: 'Tracks competitor marketplace prices and suggests a price that protects your margin.' },
      reviews: { name: 'Reviews Agent', desc: 'Analyzes customer reviews and drafts language-agnostic summaries and replies.' },
      cashflow: { name: 'Cash Flow Agent', desc: 'Projects cash 30/60/90 days ahead and simulates scenarios live.' },
    },
    howTitle: 'How it works',
    howIntro: 'Three steps, no technical knowledge required.',
    steps: [
      { title: 'Ask', desc: 'Write in plain language: “Prepare a launch for Vase X”. No forms, no menus.' },
      { title: 'Agents collaborate', desc: 'The Captain picks the right specialists; they consult each other when needed (Agent-to-Agent).' },
      { title: 'Take action', desc: 'A unified, actionable recommendation lands in one panel — apply it with a single click.' },
    ],
    ctaTitle: 'Hand your business to an AI team.',
    ctaText: 'No setup, no credit card. You’re in within a minute.',
    ctaButton: 'Start free now',
    footerTagline: 'Five assistants, one captain, zero worries.',
    mockTitle: 'KOBİ Kaptanı — Today',
    mockBriefLabel: 'TODAY’S BRIEF',
    mockBrief: [
      '3 reviews trending negative',
      'Competitors raised prices ~12% in 7 days',
      'Cash position is safe this month',
    ],
    mockTiles: [
      { label: "Today's Orders", value: '48' },
      { label: 'Pending Reviews', value: '12' },
      { label: 'Open Actions', value: '3' },
    ],
  },
};

const AGENT_META = [
  { key: 'seo', color: 'blue', Icon: IconSearch },
  { key: 'marketing', color: 'pink', Icon: IconSpeakerphone },
  { key: 'pricing', color: 'orange', Icon: IconCoin },
  { key: 'reviews', color: 'grape', Icon: IconMessageCircle },
  { key: 'cashflow', color: 'yellow', Icon: IconChartBar },
] as const;

const MOCK_STATUS = ['warn', 'info', 'ok'] as const;

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Logged-in visitors skip the landing page.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect(`/${locale}/dashboard`);

  const c = COPY[locale] ?? COPY.tr;
  const loginHref = `/${locale}/login`;
  const signupHref = `/${locale}/signup`;

  return (
    <Box bg="var(--mantine-color-body)">
      {/* ---------- Navbar ---------- */}
      <Box
        component="header"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'var(--mantine-color-body)',
          borderBottom: '1px solid var(--mantine-color-default-border)',
        }}
      >
        <Container size="lg">
          <Group justify="space-between" h={64} wrap="nowrap">
            <Group gap={8} wrap="nowrap">
              <IconAnchor size={24} color="var(--mantine-color-shopifyGreen-6)" />
              <Text fw={700} fz="lg">KOBİ Kaptanı</Text>
            </Group>
            <Group gap="xs" wrap="nowrap">
              <LanguageToggle currentLocale={locale} />
              <ColorSchemeToggle />
              <Button component={Link} href={loginHref} variant="subtle" color="gray" visibleFrom="xs">
                {c.navLogin}
              </Button>
              <Button component={Link} href={signupHref}>
                {c.navStart}
              </Button>
            </Group>
          </Group>
        </Container>
      </Box>

      {/* ---------- Hero ---------- */}
      <Box component="section" py={{ base: 56, md: 96 }}>
        <Container size="lg">
          <SimpleGrid cols={{ base: 1, md: 2 }} spacing={48} verticalSpacing={48}>
            <Stack gap="lg" justify="center">
              <Badge
                variant="light"
                size="lg"
                radius="sm"
                leftSection={<IconSparkles size={14} />}
                w="fit-content"
              >
                {c.eyebrow}
              </Badge>
              <Title
                order={1}
                style={{ fontSize: 'clamp(2.2rem, 5vw, 3.4rem)', lineHeight: 1.15 }}
              >
                {c.heroTitle}
              </Title>
              <Text size="lg" c="dimmed" maw={520}>
                {c.heroSubtitle}
              </Text>
              <Group gap="sm" mt="xs">
                <Button
                  component={Link}
                  href={signupHref}
                  size="md"
                  rightSection={<IconArrowRight size={18} />}
                >
                  {c.ctaPrimary}
                </Button>
                <Button component={Link} href="#nasil-calisir" size="md" variant="default">
                  {c.ctaSecondary}
                </Button>
              </Group>
            </Stack>

            {/* App-window mock */}
            <Stack justify="center">
              <HeroMock c={c} />
            </Stack>
          </SimpleGrid>
        </Container>
      </Box>

      {/* ---------- Agents ---------- */}
      <Box component="section" py={{ base: 56, md: 88 }}>
        <Container size="lg">
          <Stack align="center" gap="xs" mb={48}>
            <Title order={2} ta="center" style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)' }}>
              {c.agentsTitle}
            </Title>
            <Text c="dimmed" ta="center" maw={560}>
              {c.agentsIntro}
            </Text>
          </Stack>
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
            {AGENT_META.map(({ key, color, Icon }) => {
              const agent = c.agents[key];
              return (
                <Card key={key} className="landing-feature-card" padding="lg">
                  <ThemeIcon size={48} radius="md" variant="light" color={color}>
                    <Icon size={26} />
                  </ThemeIcon>
                  <Text fw={600} fz="lg" mt="md">{agent.name}</Text>
                  <Text size="sm" c="dimmed" mt={6}>{agent.desc}</Text>
                </Card>
              );
            })}
          </SimpleGrid>
        </Container>
      </Box>

      {/* ---------- How it works ---------- */}
      <Box
        component="section"
        id="nasil-calisir"
        py={{ base: 56, md: 88 }}
        style={{ scrollMarginTop: 80, background: 'var(--mantine-color-default-hover)' }}
      >
        <Container size="lg">
          <Stack align="center" gap="xs" mb={48}>
            <Title order={2} ta="center" style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)' }}>
              {c.howTitle}
            </Title>
            <Text c="dimmed" ta="center" maw={560}>
              {c.howIntro}
            </Text>
          </Stack>
          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="xl">
            {c.steps.map((step, i) => (
              <Stack key={i} align="center" gap="sm" ta="center">
                <ThemeIcon size={56} radius="xl" variant="filled" color="shopifyGreen">
                  <Text fw={700} fz="xl" c="white">{i + 1}</Text>
                </ThemeIcon>
                <Text fw={600} fz="lg">{step.title}</Text>
                <Text size="sm" c="dimmed" maw={300}>{step.desc}</Text>
              </Stack>
            ))}
          </SimpleGrid>
        </Container>
      </Box>

      {/* ---------- Final CTA ---------- */}
      <Box component="section" py={{ base: 56, md: 88 }}>
        <Container size="lg">
          <Paper
            radius="md"
            p={{ base: 'xl', md: 48 }}
            style={{ background: 'var(--mantine-color-shopifyGreen-light)', borderColor: 'transparent' }}
          >
            <Stack align="center" gap="md" ta="center">
              <ThemeIcon size={52} radius="xl" variant="filled" color="shopifyGreen">
                <IconAnchor size={28} />
              </ThemeIcon>
              <Title order={2} style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)' }}>
                {c.ctaTitle}
              </Title>
              <Text c="dimmed" maw={460}>{c.ctaText}</Text>
              <Button
                component={Link}
                href={signupHref}
                size="lg"
                mt="xs"
                rightSection={<IconArrowRight size={18} />}
              >
                {c.ctaButton}
              </Button>
            </Stack>
          </Paper>
        </Container>
      </Box>

      {/* ---------- Footer ---------- */}
      <Box
        component="footer"
        py="xl"
        style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}
      >
        <Container size="lg">
          <Group justify="space-between" wrap="wrap" gap="md">
            <Group gap={8}>
              <IconAnchor size={20} color="var(--mantine-color-shopifyGreen-6)" />
              <Text fw={600}>KOBİ Kaptanı</Text>
              <Text size="sm" c="dimmed">— {c.footerTagline}</Text>
            </Group>
            <Group gap="lg">
              <Anchor component={Link} href={loginHref} size="sm" c="dimmed">
                {c.navLogin}
              </Anchor>
              <Anchor component={Link} href={signupHref} size="sm" c="dimmed">
                {c.navStart}
              </Anchor>
              <Text size="sm" c="dimmed">© 2026</Text>
            </Group>
          </Group>
        </Container>
      </Box>
    </Box>
  );
}

function HeroMock({ c }: { c: Copy }) {
  return (
    <Paper radius="md" shadow="md" p={0} style={{ overflow: 'hidden' }}>
      {/* window chrome */}
      <Group
        gap={6}
        px="md"
        py="sm"
        style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}
      >
        <Box w={10} h={10} style={{ borderRadius: '50%', background: 'var(--mantine-color-red-5)' }} />
        <Box w={10} h={10} style={{ borderRadius: '50%', background: 'var(--mantine-color-yellow-5)' }} />
        <Box w={10} h={10} style={{ borderRadius: '50%', background: 'var(--mantine-color-shopifyGreen-5)' }} />
        <Text size="xs" c="dimmed" ml={8}>{c.mockTitle}</Text>
      </Group>

      <Stack p="md" gap="sm">
        {/* mini brief */}
        <Paper p="sm" radius="sm">
          <Text size="xs" fw={700} c="dimmed" mb={8}>{c.mockBriefLabel}</Text>
          <Stack gap={6}>
            {c.mockBrief.map((line, i) => (
              <Group key={i} gap={6} wrap="nowrap" align="flex-start">
                <div style={{ flexShrink: 0, marginTop: 1, lineHeight: 0 }}>
                  <StatusIcon status={MOCK_STATUS[i] ?? 'info'} size={14} />
                </div>
                <Text size="xs">{line}</Text>
              </Group>
            ))}
          </Stack>
        </Paper>

        {/* mini KPI tiles */}
        <SimpleGrid cols={3} spacing="xs">
          {c.mockTiles.map((tile) => (
            <Paper key={tile.label} p="xs" radius="sm">
              <Text size="9px" c="dimmed" lineClamp={1}>{tile.label}</Text>
              <Text fw={700} fz="lg">{tile.value}</Text>
            </Paper>
          ))}
        </SimpleGrid>

        {/* agent chips */}
        <Group gap={6}>
          <AgentChip agent="seo" />
          <AgentChip agent="marketing" />
          <AgentChip agent="pricing" />
          <AgentChip agent="cashflow" />
        </Group>
      </Stack>
    </Paper>
  );
}
