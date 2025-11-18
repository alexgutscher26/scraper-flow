import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import { AppProviders } from '@/components/providers/AppProviders';
import { Toaster } from 'sonner';

// Use default system fonts to avoid build-time Google Fonts fetch

export const metadata: Metadata = {
  title: 'ScrapeFlow',
  description:
    'Next.js, TypeScript, React-Flow, Prisma, and React-Query to build a scalable SaaS platform for web scraping and automation.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      afterSignOutUrl={'/sign-in'}
      appearance={{
        elements: {
          formButtonPrimary: 'bg-primary hover:bg-primary/90 text-sm !shadow-none',
        },
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <body>
          <AppProviders>{children}</AppProviders>
          <Toaster richColors />
        </body>
      </html>
    </ClerkProvider>
  );
}
