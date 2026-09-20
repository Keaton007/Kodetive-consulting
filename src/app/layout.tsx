import type { Metadata } from "next";
import { Bodoni_Moda, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ScrollProvider } from "@/components/interactions/ScrollProvider";
import { PageTransition } from "@/components/interactions/PageTransition";
import { Nav } from "@/components/nav/Nav";

const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  variable: "--font-bodoni",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Keaton Jones, Software Engineer",
  description: "Software engineer building production frontends with taste. Selected work, case studies, and contact.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bodoni.variable} ${inter.variable} ${jetBrainsMono.variable}`}>
      <body>
        <a href="#main" className="skip-link">Skip to content</a>
        <ScrollProvider>
          <Nav />
          <main id="main">
            <PageTransition>{children}</PageTransition>
          </main>
        </ScrollProvider>
      </body>
    </html>
  );
}
