import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SessionProvider from "@/components/SessionProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "ECS — Elite Community Scrims | COD Mobile BR",
  description: "The home of competitive COD Mobile Battle Royale scrims across Africa.",
  openGraph: {
    title: "ECS — Elite Community Scrims",
    description: "Competitive COD Mobile BR scrims for the African community.",
    siteName: "Elite Community Scrims",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col" style={{ background: "#0d0d0d", color: "#f0f0f0" }}>
        <SessionProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}
