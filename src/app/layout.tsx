import type { Metadata, Viewport } from "next";
import "@/styles/globals.css";
import { satoshi } from "@/styles/fonts";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import TopNavbar from "@/components/layout/Navbar/TopNavbar";
import Footer from "@/components/layout/Footer";
import HolyLoader from "holy-loader";
import Providers from "./providers";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Livolife",
  description: "Livolife — Surgicals B2B Wholesale.",
};

export const viewport: Viewport = {
  themeColor: "#152341",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${satoshi.className} ${cormorant.variable} ${dmSans.variable} flex flex-col min-h-screen`}>
        <HolyLoader color="#E8EFF8" />
        <Providers>
          {/* Navbar */}
          <TopNavbar />

          {/* Main Content - Grows to fill available space */}
          <main className="flex-1">
            {children}
          </main>

          {/* Footer - Always at bottom */}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
