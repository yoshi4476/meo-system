import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "MEO Mastermind AI",
  description: "GoogleマップMEO対策・自動運用ツール",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
        <footer className="fixed bottom-0 right-0 p-1 text-[10px] text-white/20 pointer-events-none z-50 font-mono">
          {process.env.NEXT_PUBLIC_DEPLOY_TIME?.substring(0, 16).replace('T', ' ')} :: {process.env.NEXT_PUBLIC_GIT_COMMIT}
        </footer>
      </body>
    </html>
  );
}
