'use client';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';

const localesList = [{ code: 'tr', label: '🇹🇷 Türkçe' }, { code: 'en', label: '🇬🇧 English' }];

export function LanguageToggle({ currentLocale }: { currentLocale: string }) {
  const router = useRouter();
  const pathname = usePathname();

  function switchLocale(newLocale: string) {
    const newPath = pathname.replace(/^\/(tr|en)/, `/${newLocale}`);
    router.push(newPath);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Globe className="size-4" />
          {currentLocale === 'tr' ? '🇹🇷 TR' : '🇬🇧 EN'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {localesList.map((l) => (
          <DropdownMenuItem key={l.code} onClick={() => switchLocale(l.code)}>
            {l.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
