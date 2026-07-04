import type { Metadata } from 'next';
import { Public_Sans } from 'next/font/google';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Header } from '@/components/shared/Header';
import { AnalyticsProvider } from '@/components/shared/AnalyticsProvider';
import './globals.css';

const publicSans = Public_Sans({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-public-sans',
});

export const metadata: Metadata = {
  title: 'Relocator — Find your ideal country',
  description:
    'Set your priorities. See your ranking. Built on public institutional data.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://relocateindex.com'),
  openGraph: {
    title: 'Relocator — Find your ideal country',
    description:
      'Rank 59 countries across 10 data-driven dimensions. Set your priorities. See your ranking.',
    type: 'website',
    siteName: 'Relocator',
    url: '/',
  },
  alternates: {
    canonical: '/',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${publicSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-[family-name:var(--font-public-sans)]">
        <TooltipProvider>
          <AnalyticsProvider />
          <Header />
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
