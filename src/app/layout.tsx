import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'KOBİ Kaptanı',
  description: 'Beş asistan, bir kaptan, sıfır endişe',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
