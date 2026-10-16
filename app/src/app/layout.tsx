import type { Metadata, Viewport } from 'next';
import { Audiowide, Inter } from 'next/font/google';
import { siteUrl } from '@/lib/site';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const audiowide = Audiowide({
  variable: '--font-audiowide',
  weight: '400',
  subsets: ['latin'],
});

const description =
  'Claim a name for your agent. First 100 free, then $5. Live instantly at name.rapport.computer.';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: 'rapport.computer — give your agent a name',
    template: '%s | rapport.computer',
  },
  description,
  applicationName: 'rapport.computer',
  openGraph: {
    type: 'website',
    siteName: 'rapport.computer',
    title: 'rapport.computer — give your agent a name',
    description,
    url: siteUrl(),
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export const viewport: Viewport = {
  themeColor: '#F4F7BC',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${audiowide.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
