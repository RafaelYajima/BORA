import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "BORA 2.0 — Seus eventos, seu grupos",
  description: "Organize grupos, crie eventos e combine presenças em um só lugar.",
};

const temaInicial = `
  try {
    if (localStorage.getItem('bora2-tema') === 'escuro') {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <Script id="tema-inicial" strategy="beforeInteractive">
          {temaInicial}
        </Script>
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
