import { createClient } from '@/lib/supabase/server';
import { DashboardCard } from '@/components/DashboardCard';
import { BriefCard } from '@/components/BriefCard';

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Hardcoded brief — Task 28 wires the real Captain agent
  const brief = [
    { status: 'ok' as const, text: '3 ürünün SEO başlığı zayıf — taslak hazır' },
    { status: 'warn' as const, text: 'Vazo X için 4 negatif yorum (kırılma şikayeti)' },
    { status: 'info' as const, text: 'Rakipler 2 üründe %12 fiyat artırdı' },
    { status: 'ok' as const, text: 'Bu ay nakit pozisyon: GÜVENLİ 🟢' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Günaydın 👋</h1>

      <BriefCard locale={locale} items={brief} />

      <div className="grid grid-cols-4 gap-4">
        <DashboardCard label="Bugün Sipariş" value={12} />
        <DashboardCard label="Bekleyen Yorum" value={7} />
        <DashboardCard label="Açık Aksiyon" value={8} />
        <DashboardCard label="Nakit Pozisyon" value="🟢 OK" />
      </div>
    </div>
  );
}
