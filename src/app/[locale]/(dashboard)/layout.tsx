import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/DashboardShell';

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const { data: profile } = await supabase
    .from('profiles')
    .select('business_name, preferred_language')
    .eq('id', user.id)
    .single();

  return (
    <DashboardShell locale={locale} businessName={profile?.business_name ?? 'KOBİ Sahibi'}>
      {children}
    </DashboardShell>
  );
}
