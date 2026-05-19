import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/DashboardShell';
import { AppModeProvider } from '@/components/AppModeProvider';
import { getAppMode } from '@/lib/app-mode';

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

  const [profileResult, mode] = await Promise.all([
    supabase
      .from('profiles')
      .select('business_name, preferred_language')
      .eq('id', user.id)
      .single(),
    getAppMode(supabase),
  ]);

  return (
    <AppModeProvider initialMode={mode}>
      <DashboardShell
        locale={locale}
        businessName={profileResult.data?.business_name ?? 'KOBİ Sahibi'}
      >
        {children}
      </DashboardShell>
    </AppModeProvider>
  );
}
