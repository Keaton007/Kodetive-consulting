import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import dynamic from 'next/dynamic';
import ThemeToggle from '../components/ThemeToggle';
// import ChatBubble from '../components/ChatBubble';


const Nav = dynamic(() => import('../components/Nav'), {
  loading: () => <div>Loading...</div>
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kodetive Consulting",
  description: "Kodetive Consulting — full-stack development, projects, and capabilities.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={geistSans.variable}>
      <body>
        <ThemeToggle />
        <Nav />
        {children}
        {/* <ChatBubble /> */}
      </body>
    </html>
  );
}
