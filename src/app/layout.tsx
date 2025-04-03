import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Modern Minesweeper | A Classic Game Reimagined",
  description: "A sleek, modern implementation of the classic Minesweeper game. Features touch support, dark mode, and responsive design. Built with Next.js and TypeScript.",
  keywords: ["minesweeper", "game", "puzzle", "nextjs", "typescript", "react"],
  authors: [{ name: "Saadiq Rodgers-King" }],
  creator: "Saadiq Rodgers-King",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://github.com/saadiq/minesweeper",
    title: "Modern Minesweeper | A Classic Game Reimagined",
    description: "A sleek, modern implementation of the classic Minesweeper game. Features touch support, dark mode, and responsive design.",
    siteName: "Modern Minesweeper",
  },
  twitter: {
    card: "summary_large_image",
    title: "Modern Minesweeper | A Classic Game Reimagined",
    description: "A sleek, modern implementation of the classic Minesweeper game. Features touch support, dark mode, and responsive design.",
    creator: "@saadiq",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
