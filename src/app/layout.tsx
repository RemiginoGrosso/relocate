import type { Metadata } from 'next';
import { Public_Sans } from 'next/font/google';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Header } from '@/components/shared/Header';
import { AnalyticsProvider } from '@/components/shared/AnalyticsProvider';
import { JsonLd } from '@/components/seo/JsonLd';
import './globals.css';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://relocateindex.com';

const publicSans = Public_Sans({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-public-sans',
});

export const metadata: Metadata = {
  title: {
    template: '%s — Relocate Index',
    default: 'Relocate Index — Find your ideal country',
  },
  description:
    'Set your priorities. See your ranking. Built on public institutional data.',
  metadataBase: new URL(BASE_URL),
  openGraph: {
    type: 'website',
    siteName: 'Relocate Index',
  },
  twitter: {
    card: 'summary_large_image',
  },
  icons: {
    apple: '/apple-touch-icon.png',
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
        <JsonLd data={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Relocate Index',
          url: BASE_URL,
          description: 'Rank 60 countries across 10 data-driven dimensions for relocation.',
        }} />
        <JsonLd data={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Relocate Index',
          url: BASE_URL,
          logo: `${BASE_URL}/icon.png`,
          email: 'info@relocateindex.com',
        }} />
        <TooltipProvider>
          <AnalyticsProvider />
          <Header />
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
