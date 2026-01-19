import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LoanFi - DeFi Loan Aggregator",
  description: "Compare DeFi loan rates across Aave, Compound, and more. Like Kayak for crypto loans.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} font-sans antialiased bg-gray-950 text-white`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
