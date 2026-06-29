'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { href: '/ranking', label: 'Ranking' },
  { href: '/methodology', label: 'Methodology' },
];

export function Header() {
  const pathname = usePathname();

  if (pathname === '/' || pathname === '/onboarding') return null;

  return (
    <header className="border-b border-zinc-200 px-4 py-3">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <Link href="/" className="text-sm font-medium text-zinc-900">
          Relocator
        </Link>
        <nav className="flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm transition-colors ${
                pathname.startsWith(link.href)
                  ? 'font-medium text-teal-700'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
