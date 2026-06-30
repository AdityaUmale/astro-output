import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Astrology Tools",
  description: "Internal Swiss Ephemeris calculation utilities"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
