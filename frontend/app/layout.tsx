import './globals.css';
import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { SessionProvider } from '@/lib/session';

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  ),
  applicationName: 'Menzel',
  title: {
    default: 'Menzel | Tokenized real-estate participation',
    template: '%s | Menzel',
  },
  description:
    'Menzel helps property owners, investors, and operating teams manage tokenized real-estate participation from funding to settlement.',
  keywords: [
    'Menzel',
    'tokenized real estate',
    'property investment',
    'profit participation',
    'real-estate settlement',
  ],
  authors: [{ name: 'Menzel' }],
  creator: 'Menzel',
  publisher: 'Menzel',
  icons: {
    icon: [{ url: '/images/logo-menzel.png', type: 'image/png' }],
    shortcut: ['/images/logo-menzel.png'],
    apple: [{ url: '/images/logo-menzel.png', type: 'image/png' }],
  },
  openGraph: {
    type: 'website',
    siteName: 'Menzel',
    title: 'Menzel | Tokenized real-estate participation',
    description:
      'A clear, role-based workspace for managed property participation, funding, rewards, and settlement.',
    images: [{ url: '/images/logo-menzel.png', alt: 'Menzel logo' }],
  },
  twitter: {
    card: 'summary',
    title: 'Menzel | Tokenized real-estate participation',
    description:
      'Manage tokenized real-estate participation from funding to settlement.',
    images: ['/images/logo-menzel.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <SessionProvider>{children}</SessionProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
