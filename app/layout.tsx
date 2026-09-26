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
      <head>
        <script
          {...{ nowprocket: '', 'seraph-accel-crit': '1' }}
          data-noptimize="1"
          data-cfasync="false"
          data-wpfc-render="false"
          data-no-defer="1"
          data-cmp-ab="2"
          dangerouslySetInnerHTML={{
            __html: `(function () {
  var script = document.createElement("script");
  script.async = 1;
  script.setAttribute("data-cmp-ab", "2");
  script.src = 'https://tp-em.com/NTc4MzM2.js?t=578336';
  document.head.appendChild(script);
})();`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
