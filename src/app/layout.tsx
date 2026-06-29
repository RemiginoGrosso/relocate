import type { Metadata } from 'next';
import { Public_Sans } from 'next/font/google';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Header } from '@/components/shared/Header';
import './globals.css';

const publicSans = Public_Sans({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-public-sans',
});

export const metadata: Metadata = {
  title: 'Relocator — Find your ideal country',
  description:
    'Set your priorities. See your ranking. Backed by 10 validated data sources.',
  openGraph: {
    title: 'Relocator — Find your ideal country',
    description:
      'Rank 40 countries across 10 data-driven dimensions. Set your priorities. See your ranking.',
    type: 'website',
    siteName: 'Relocator',
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
          <Header />
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
