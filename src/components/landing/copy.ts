export type AgentKey = 'seo' | 'marketing' | 'pricing' | 'reviews' | 'cashflow';

export interface AgentCopy {
  name: string;
  desc: string;
}

export interface StepCopy {
  title: string;
  desc: string;
}

export interface StatCopy {
  value: string;
  label: string;
}

export interface PricingTierCopy {
  tier: string;
  price: string;
  unit: string;
  blurb: string;
  features: string[];
  cta: string;
  featured?: boolean;
}

export interface LandingCopy {
  nav: {
    solutions: string;
    pricing: string;
    docs: string;
    community: string;
    signIn: string;
    getStarted: string;
  };
  hero: {
    badgeTag: string;
    badgeText: string;
    titleLead: string;       // serif italic gradient word
    titleRest: string;       // sans uppercase
    subtitle: string;
    chatPlaceholder: string;
    chatModes: string[];
    chatRotating: string[];
    primaryCta: string;
    ghostCta: string;
  };
  logoStrip: {
    label: string;
    items: string[];
  };
  agents: {
    eyebrow: string;
    title: string;
    titleEm: string;
    subtitle: string;
    items: Record<AgentKey, AgentCopy>;
  };
  how: {
    eyebrow: string;
    title: string;
    titleEm: string;
    subtitle: string;
    steps: StepCopy[];
  };
  stats: {
    eyebrow: string;
    title: string;
    titleEm: string;
    items: StatCopy[];
  };
  pricing: {
    eyebrow: string;
    title: string;
    titleEm: string;
    subtitle: string;
    tiers: PricingTierCopy[];
    featuredFlag: string;
  };
  cta: {
    title: string;
    titleEm: string;
    text: string;
    primary: string;
    ghost: string;
  };
  footer: {
    tagline: string;
    groups: { heading: string; links: string[] }[];
    legal: string;
  };
}

const tr: LandingCopy = {
  nav: {
    solutions: 'Çözümler',
    pricing: 'Fiyatlandırma',
    docs: 'Dokümanlar',
    community: 'Nasıl çalışır',
    signIn: 'Giriş',
    getStarted: 'Ücretsiz Başla',
  },
  hero: {
    badgeTag: 'Yeni',
    badgeText: 'Gemini AI Hackathon 2026 — kazandık →',
    titleLead: 'Beş',
    titleRest: 'asistan, bir kaptan, sıfır endişe.',
    subtitle:
      'Çok kanallı satış yapan işletmeniz için altı yapay zeka uzmanı. SEO\'dan nakit akışına kadar her şeyi izler, birbirleriyle konuşur ve size tek panelden net aksiyonlar sunar.',
    chatPlaceholder: 'Kaptan\'a sorun: "Vazo X için lansman hazırla"',
    chatModes: ['Kaptan Modu', 'SEO Ajanı', 'Pazarlama', 'Fiyat', 'Yorum', 'Nakit Akışı'],
    chatRotating: [
      'Vazo X için Instagram lansman planı çıkar',
      'Son 7 günde olumsuz yorum alan ürünleri listele',
      'Rakip fiyatlarımı analiz et, marjı koruyacak şekilde öner',
      '60 günlük nakit projeksiyonu göster',
      'Yeni gelen "Mavi Vazo"nun SEO başlığını yaz',
    ],
    primaryCta: 'Ücretsiz Başla',
    ghostCta: 'Nasıl çalışır?',
  },
  logoStrip: {
    label: 'Şu altyapı üzerine kuruldu',
    items: ['Gemini', 'Vercel', 'Supabase', 'Next.js', 'Mantine'],
  },
  agents: {
    eyebrow: 'Mürettebat',
    title: 'Beş uzman.',
    titleEm: 'Tek bir kaptan.',
    subtitle:
      'Her ajan tek bir işin ustası. Hepsini, doğru uzmanı doğru anda görevlendiren bir Kaptan yönetir.',
    items: {
      seo: {
        name: 'SEO Ajanı',
        desc: 'Ürün başlıklarını ve açıklamalarını arama motorlarında üst sıralar için optimize eder.',
      },
      marketing: {
        name: 'Pazarlama Ajanı',
        desc: 'Instagram açıklaması, görsel fikirleri ve hazır hashtag setleri üretir.',
      },
      pricing: {
        name: 'Fiyat Ajanı',
        desc: 'Rakip pazaryeri fiyatlarını izler, kâr marjınızı koruyan fiyatı önerir.',
      },
      reviews: {
        name: 'Yorum Ajanı',
        desc: 'Müşteri yorumlarını analiz eder, dilden bağımsız özet ve yanıt taslakları çıkarır.',
      },
      cashflow: {
        name: 'Nakit Akışı Ajanı',
        desc: '30/60/90 günlük nakit projeksiyonu yapar, senaryoları canlı simüle eder.',
      },
    },
  },
  how: {
    eyebrow: 'Akış',
    title: 'Üç adımda',
    titleEm: 'aksiyon.',
    subtitle: 'Teknik bilgi gerekmez. Form yok, menü yok — sadece konuşun.',
    steps: [
      {
        title: 'Sorun',
        desc: 'Doğal dille yazın: "Vazo X için lansman hazırla". Kaptan ne yapacağını anlar.',
      },
      {
        title: 'Ajanlar konuşur',
        desc: 'Kaptan doğru uzmanları seçer; uzmanlar gerektiğinde birbirine danışır (A2A).',
      },
      {
        title: 'Aksiyon alın',
        desc: 'Birleşik, uygulanabilir öneri tek panelde önünüze gelir — tek tıkla hayata geçirin.',
      },
    ],
  },
  stats: {
    eyebrow: 'Rakamlarla',
    title: 'Beş kişilik bir ekibin',
    titleEm: 'yapacağı iş.',
    items: [
      { value: '5', label: 'Uzman ajan — her biri bir disiplinin ustası' },
      { value: '1', label: 'Kaptan — hepsini orkestralayan beyin' },
      { value: '0', label: 'Kurulum, kredi kartı, eğitim — sıfır sürtünme' },
    ],
  },
  pricing: {
    eyebrow: 'Fiyatlandırma',
    title: 'Bir kafe sahibi de',
    titleEm: 'Captain kullanabilsin diye.',
    subtitle: 'Hackathon süresince herkese ücretsiz. Lansmanda mütevazı fiyatlarla devam ediyoruz.',
    featuredFlag: 'En popüler',
    tiers: [
      {
        tier: 'Tayfa',
        price: '₺0',
        unit: '/ay',
        blurb: 'Captain\'i tanımak için. Kredi kartı yok.',
        features: [
          'Günde 5 sorgu',
          '5 ajanın hepsine erişim',
          'Tek mağaza bağlama',
          'Topluluk desteği',
        ],
        cta: 'Ücretsiz Başla',
      },
      {
        tier: 'Mürettebat',
        price: '₺499',
        unit: '/ay',
        blurb: 'Aktif satıcılar için. Tüm ajanlar tam güç.',
        features: [
          'Sınırsız sorgu',
          'Çoklu mağaza (3\'e kadar)',
          'A2A iş akışları',
          'Rakip fiyat izleme — günlük',
          'E-posta + WhatsApp uyarıları',
        ],
        cta: 'Mürettebat\'a Geç',
        featured: true,
      },
      {
        tier: 'Kaptan',
        price: '₺1.499',
        unit: '/ay',
        blurb: 'Ölçek, ekip, API. İşletmeniz büyürken yanınızda.',
        features: [
          'Mürettebat\'taki her şey',
          'Sınırsız mağaza',
          'API erişimi',
          'Özel ajan eğitimi',
          'Öncelikli destek (4 saat SLA)',
          'Beyaz etiketli rapor',
        ],
        cta: 'Satışla Konuş',
      },
    ],
  },
  cta: {
    title: 'İşletmenizi bir',
    titleEm: 'AI ekibine devredin.',
    text: 'Kurulum yok, kredi kartı yok. Bir dakikada içeride olun.',
    primary: 'Hemen Ücretsiz Başla',
    ghost: 'Demo izle',
  },
  footer: {
    tagline: 'Beş asistan, bir kaptan, sıfır endişe.',
    groups: [
      { heading: 'Ürün', links: ['Çözümler', 'Fiyatlandırma', 'Yol Haritası', 'Sürüm Notları'] },
      { heading: 'Kaynaklar', links: ['Dokümanlar', 'API', 'Topluluk', 'Destek'] },
      { heading: 'Şirket', links: ['Hakkımızda', 'Blog', 'Kariyer', 'İletişim'] },
      { heading: 'Yasal', links: ['Gizlilik', 'Kullanım Şartları', 'KVKK', 'Çerezler'] },
    ],
    legal: '© 2026 KOBİ Kaptanı. Gemini AI Hackathon 2026 için inşa edildi.',
  },
};

const en: LandingCopy = {
  nav: {
    solutions: 'Solutions',
    pricing: 'Pricing',
    docs: 'Docs',
    community: 'How it works',
    signIn: 'Sign in',
    getStarted: 'Start free',
  },
  hero: {
    badgeTag: 'New',
    badgeText: 'Built for the Gemini AI Hackathon 2026 →',
    titleLead: 'Five',
    titleRest: 'assistants, one captain, zero worries.',
    subtitle:
      'Six AI specialists for your multi-channel business. From SEO to cash flow, they watch everything, talk to each other, and hand you clear actions from a single panel.',
    chatPlaceholder: 'Ask the Captain: "Prepare a launch for Vase X"',
    chatModes: ['Captain Mode', 'SEO Agent', 'Marketing', 'Pricing', 'Reviews', 'Cash Flow'],
    chatRotating: [
      'Prepare an Instagram launch for Vase X',
      'List products that got negative reviews this week',
      'Analyze competitor prices, protect my margin',
      'Show 60-day cash flow projection',
      'Write an SEO title for "Blue Vase"',
    ],
    primaryCta: 'Start free',
    ghostCta: 'How it works',
  },
  logoStrip: {
    label: 'Built on top of',
    items: ['Gemini', 'Vercel', 'Supabase', 'Next.js', 'Mantine'],
  },
  agents: {
    eyebrow: 'The crew',
    title: 'Five specialists.',
    titleEm: 'One captain.',
    subtitle:
      'Each agent masters one job. A Captain orchestrates them all, dispatching the right specialist at the right moment.',
    items: {
      seo: {
        name: 'SEO Agent',
        desc: 'Optimizes product titles and descriptions to rank higher in search engines.',
      },
      marketing: {
        name: 'Marketing Agent',
        desc: 'Generates Instagram captions, image ideas and ready-to-use hashtag sets.',
      },
      pricing: {
        name: 'Pricing Agent',
        desc: 'Tracks competitor marketplace prices and suggests a price that protects your margin.',
      },
      reviews: {
        name: 'Reviews Agent',
        desc: 'Analyzes customer reviews and drafts language-agnostic summaries and replies.',
      },
      cashflow: {
        name: 'Cash Flow Agent',
        desc: 'Projects cash 30/60/90 days ahead and simulates scenarios live.',
      },
    },
  },
  how: {
    eyebrow: 'The flow',
    title: 'Three steps',
    titleEm: 'to action.',
    subtitle: 'No technical knowledge needed. No forms, no menus — just talk.',
    steps: [
      {
        title: 'Ask',
        desc: 'Write in plain language: "Prepare a launch for Vase X". The Captain figures out the rest.',
      },
      {
        title: 'Agents collaborate',
        desc: 'The Captain picks the right specialists; they consult each other when needed (A2A).',
      },
      {
        title: 'Take action',
        desc: 'A unified, actionable recommendation lands in one panel — apply it with a single click.',
      },
    ],
  },
  stats: {
    eyebrow: 'In numbers',
    title: 'The work of a',
    titleEm: 'five-person team.',
    items: [
      { value: '5', label: 'Specialist agents — each a master of one discipline' },
      { value: '1', label: 'Captain — the brain that orchestrates them all' },
      { value: '0', label: 'Setup, credit cards, training — zero friction' },
    ],
  },
  pricing: {
    eyebrow: 'Pricing',
    title: 'So a corner-shop owner',
    titleEm: 'can use a Captain too.',
    subtitle: 'Free for everyone during the hackathon. Modest plans at launch — no enterprise nonsense.',
    featuredFlag: 'Most popular',
    tiers: [
      {
        tier: 'Crew',
        price: '$0',
        unit: '/mo',
        blurb: 'Get to know the Captain. No credit card.',
        features: [
          '5 queries / day',
          'Access to all 5 agents',
          'Connect 1 store',
          'Community support',
        ],
        cta: 'Start free',
      },
      {
        tier: 'Fleet',
        price: '$19',
        unit: '/mo',
        blurb: 'For active sellers. All agents at full power.',
        features: [
          'Unlimited queries',
          'Up to 3 stores',
          'A2A workflows',
          'Daily competitor price tracking',
          'Email + WhatsApp alerts',
        ],
        cta: 'Upgrade to Fleet',
        featured: true,
      },
      {
        tier: 'Captain',
        price: '$59',
        unit: '/mo',
        blurb: 'Scale, team, API. Grows with your business.',
        features: [
          'Everything in Fleet',
          'Unlimited stores',
          'API access',
          'Custom agent training',
          'Priority support (4h SLA)',
          'White-label reports',
        ],
        cta: 'Talk to sales',
      },
    ],
  },
  cta: {
    title: 'Hand your business',
    titleEm: 'to an AI team.',
    text: 'No setup, no credit card. You\'re in within a minute.',
    primary: 'Start free now',
    ghost: 'Watch demo',
  },
  footer: {
    tagline: 'Five assistants, one captain, zero worries.',
    groups: [
      { heading: 'Product', links: ['Solutions', 'Pricing', 'Roadmap', 'Changelog'] },
      { heading: 'Resources', links: ['Docs', 'API', 'Community', 'Support'] },
      { heading: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
      { heading: 'Legal', links: ['Privacy', 'Terms', 'GDPR', 'Cookies'] },
    ],
    legal: '© 2026 KOBİ Kaptanı. Built for the Gemini AI Hackathon 2026.',
  },
};

export const LANDING_COPY: Record<string, LandingCopy> = { tr, en };

export const AGENT_ORDER: AgentKey[] = ['seo', 'marketing', 'pricing', 'reviews', 'cashflow'];

export const AGENT_VARIANT: Record<AgentKey, 'emerald' | 'amber' | 'teal' | 'lime' | 'rose'> = {
  seo: 'teal',
  marketing: 'amber',
  pricing: 'emerald',
  reviews: 'rose',
  cashflow: 'lime',
};
