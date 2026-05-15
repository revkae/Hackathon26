'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Home, MessageSquare, Package, MessageCircle, BarChart3, Activity, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { key: 'today', href: 'dashboard', icon: Home },
  { key: 'chat', href: 'dashboard/chat', icon: MessageSquare },
  { key: 'products', href: 'dashboard/products', icon: Package },
  { key: 'reviews', href: 'dashboard/reviews', icon: MessageCircle },
  { key: 'cashflow', href: 'dashboard/cashflow', icon: BarChart3 },
  { key: 'trace', href: 'dashboard/trace', icon: Activity },
];

export function Sidebar({ locale }: { locale: string }) {
  const pathname = usePathname();
  const t = useTranslations('nav');

  return (
    <aside className="w-56 bg-card border-r flex flex-col">
      <div className="p-6 flex items-center gap-2">
        <span className="text-2xl">⚓</span>
        <span className="font-bold">KOBİ Kaptanı</span>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {items.map(({ key, href, icon: Icon }) => {
          const fullHref = `/${locale}/${href}`;
          const active = pathname === fullHref || (href === 'dashboard' && pathname === `/${locale}/dashboard`);
          return (
            <Link
              key={key} href={fullHref}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                active ? 'bg-emerald-500/10 text-emerald-500' : 'hover:bg-muted'
              )}
            >
              <Icon className="size-4" />
              {t(key)}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t">
        <Link
          href={`/${locale}/dashboard/settings`}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-muted"
        >
          <Settings className="size-4" />
          {t('settings')}
        </Link>
      </div>
    </aside>
  );
}
