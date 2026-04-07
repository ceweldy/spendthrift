import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SPENDTHRIFT — The Compulsive Shopping Card Game',
  description: 'Quiz into archetype into shopping card chaos.',
  icons: {
    icon: [{ url: '/icon', type: 'image/png' }],
    shortcut: [{ url: '/icon', type: 'image/png' }],
    apple: [{ url: '/apple-icon', type: 'image/png' }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
