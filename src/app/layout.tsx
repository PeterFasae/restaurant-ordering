import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'The Larder — order online',
  description: 'Collection and delivery from The Larder, Peckham.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  );
}
