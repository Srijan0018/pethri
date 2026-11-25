import type { Metadata } from "next";
import {
  Instrument_Serif,
  JetBrains_Mono,
  Plus_Jakarta_Sans,
  Syne,
} from "next/font/google";
import "./globals.css";
import { PethriProvider } from "@/components/PethriProvider";
import { AppShell } from "@/components/AppShell";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700", "800"],
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["600", "700", "800"],
});

const instrument = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-instrument",
  weight: ["400"],
  style: ["normal", "italic"],
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Pethri.com — Hyperlocal Social News & Citizen Journalism Network",
  description:
    "Real-time happenings, verified dispatches, Pethri Moments, church festivals, agriculture updates, weddings, and civic stories across Pethri and Brahmavar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${syne.variable} ${instrument.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F7F9FC] text-[#0B1426]">
        <PethriProvider>
          <AppShell>{children}</AppShell>
        </PethriProvider>
      </body>
    </html>
  );
}
