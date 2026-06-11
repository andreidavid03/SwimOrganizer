import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SwimOrganizer — Competiții de Înot",
  description: "Platforma pentru organizarea competițiilor de înot",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SwimOrganizer",
  },
};

export const viewport: Viewport = {
  themeColor: "#1A3A6B",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro" className="h-full">
      <body className={`${inter.className} min-h-full bg-gray-50`}>
        {children}
      </body>
    </html>
  );
}
