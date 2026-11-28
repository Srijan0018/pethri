import type { Metadata } from "next";
import { Suspense } from "react";
import {
  Instrument_Serif,
  JetBrains_Mono,
  Noto_Sans_Kannada,
  Plus_Jakarta_Sans,
  Syne,
} from "next/font/google";
import "./globals.css";
import { PethriProvider } from "@/components/PethriProvider";
import { AppShell } from "@/components/AppShell";
import { SITE_URL } from "@/lib/site";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700", "800"],
});

const kannada = Noto_Sans_Kannada({
  subsets: ["kannada"],
  variable: "--font-kannada",
  weight: ["400", "500", "600", "700"],
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
  metadataBase: SITE_URL,
  title: {
    default: "Pethri.com — Karavali Hyperlocal News & Community",
    template: "%s | Pethri.com",
  },
  description:
    "Verified local news, Instagram-style community moments, and live broadcasting across Mangaluru, Udupi, Manipal, Kundapura, and Pethri.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Pethri.com",
    title: "Pethri.com — Karavali Hyperlocal News & Community",
    description:
      "Verified local news and community updates across Mangaluru, Udupi, Manipal, Kundapura, and Pethri.",
    url: "/",
    images: [{ url: "/images/pethri-logo.jpg", alt: "Pethri.com" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pethri.com — Karavali Hyperlocal News & Community",
    description:
      "Verified local news and community updates across the Karavali coast.",
    images: ["/images/pethri-logo.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${kannada.variable} ${syne.variable} ${instrument.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-[#111318]">
        <Suspense fallback={<div className="min-h-screen bg-[#FFFFFF]" />}>
          <PethriProvider>
            <AppShell>{children}</AppShell>
          </PethriProvider>
        </Suspense>
      </body>
    </html>
  );
}
