import type { Metadata } from "next";
import { Host_Grotesk } from "next/font/google";
// Geist Pixel is not on Google Fonts — it ships in Vercel's `geist` package.
// Variants: Square | Grid | Circle | Triangle | Line. Swap the import to
// change the pixel treatment across the whole app.
import { GeistPixelSquare } from "geist/font/pixel";
import "./globals.css";

const hostGrotesk = Host_Grotesk({
  variable: "--font-host-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GateKeep",
  description:
    "One employee out. Every access path closed. Discover, revoke and verify employee access across every connected system.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${hostGrotesk.variable} ${GeistPixelSquare.variable} h-full`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
