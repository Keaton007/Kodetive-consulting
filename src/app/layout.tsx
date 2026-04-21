import type { Metadata } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { CursorProvider } from "@/components/interactions/CursorProvider";
import { ScrollProvider } from "@/components/interactions/ScrollProvider";
import { PageTransition } from "@/components/interactions/PageTransition";
import { Nav } from "@/components/nav/Nav";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz", "SOFT"],
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
  title: "Keaton Jones — Software Engineer",
  description: "Software engineer building production frontends with taste. Selected work, case studies, and contact.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} ${jetBrainsMono.variable}`}>
      <body>
        <a href="#main" className="skip-link">Skip to content</a>
        <CursorProvider>
          <ScrollProvider>
            <Nav />
            <main id="main">
              <PageTransition>{children}</PageTransition>
            </main>
          </ScrollProvider>
        </CursorProvider>
      </body>
    </html>
  );
}
