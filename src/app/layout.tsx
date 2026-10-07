import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { getLocale, getTheme } from "@/lib/session";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin", "vietnamese"] });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"] });

// Every page depends on the signed-in user and locale cookie, so the app is
// rendered per request rather than prerendered into a static shell.
export const instant = false;

export const metadata: Metadata = {
  title: "Marketing Ecom",
  description: "Marketing Ecom, Trung tâm Vận hành 2, UpBase",
  robots: { index: false, follow: false },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [locale, theme] = await Promise.all([getLocale(), getTheme()]);
  return (
    <html lang={locale} data-theme={theme ?? undefined} className={`${inter.variable} ${jetbrains.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
