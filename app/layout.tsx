import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SPENDTHRIFT — The Compulsive Shopping Card Game',
  description: 'Quiz into archetype into shopping card chaos.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
