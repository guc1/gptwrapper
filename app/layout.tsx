import { Toaster } from 'sonner';
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { cookies } from 'next/headers';
import { NextIntlClientProvider } from 'next-intl';

import './globals.css';
import { SessionProvider } from 'next-auth/react';
import { LoginSignupDialog } from '@/components/ui/login-signup-dialog';
import { UpgradeDialog } from '@/components/ui/upgrade-dialog';

export const metadata: Metadata = {
  metadataBase: new URL('https://chat.vercel.ai'),
  title: 'Next.js Chatbot Template',
  description: 'Next.js chatbot template using the AI SDK.',
};

export const viewport = {
  maximumScale: 1, // Disable auto-zoom on mobile Safari
};

const geist = Geist({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-geist',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-geist-mono',
});

const LIGHT_THEME_COLOR = 'hsl(0 0% 100%)';
const DARK_THEME_COLOR = 'hsl(240deg 10% 3.92%)';
const ORANGE_THEME_COLOR = 'hsl(30 40% 98%)';
const THEME_COLOR_SCRIPT = `\
(function() {
  var html = document.documentElement;
  var meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  function updateThemeColor() {
    var classes = html.classList;
    if (classes.contains('dark')) {
      meta.setAttribute('content', '${DARK_THEME_COLOR}');
    } else if (classes.contains('orange')) {
      meta.setAttribute('content', '${ORANGE_THEME_COLOR}');
    } else {
      meta.setAttribute('content', '${LIGHT_THEME_COLOR}');
    }
  }
  var observer = new MutationObserver(updateThemeColor);
  observer.observe(html, { attributes: true, attributeFilter: ['class'] });
  updateThemeColor();
})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const localeCookie = (await cookies()).get('NEXT_LOCALE');
  const locale = localeCookie?.value ?? 'en';
  const messages = (await import(`../locales/${locale}.json`)).default;
  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${geist.variable} ${geistMono.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: THEME_COLOR_SCRIPT,
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="orange"
          enableSystem
          disableTransitionOnChange
          themes={["light", "dark", "orange"]}
        >
          <Toaster position="top-center" />
          <SessionProvider>
            <NextIntlClientProvider locale={locale} messages={messages}>
              {children}
              <LoginSignupDialog />
              <UpgradeDialog />
            </NextIntlClientProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
