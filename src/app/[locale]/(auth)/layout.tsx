import { useTranslations } from 'next-intl';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthShell>{children}</AuthShell>;
}

function AuthShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations('auth');
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-emerald-900/40 to-background">
        <div className="text-4xl">⚓</div>
        <div>
          <h1 className="text-5xl font-bold leading-tight">KOBİ<br/>Kaptanı</h1>
          <p className="mt-6 text-muted-foreground text-lg italic">&ldquo;{t('tagline')}&rdquo;</p>
        </div>
        <div className="text-sm text-muted-foreground">© 2026 KOBİ Kaptanı</div>
      </aside>
      <main className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
