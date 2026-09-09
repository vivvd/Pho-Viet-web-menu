import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Pho Viet — меню',
  icons: { icon: '/favicon.svg' },
  description: 'Меню Pho Viet: блюда, напитки и ваш список для официанта.',
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
