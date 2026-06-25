import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from 'next/link';
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
  title: "Study Agent",
  description: "Study assistant and dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex min-h-screen flex-col bg-slate-950 text-slate-100">
        <nav className="border-b border-slate-800 bg-slate-900/70">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <Link href="/" className="text-lg font-semibold text-slate-50">Study Agent</Link>
              <span className="hidden text-sm text-slate-400 sm:inline"> — interactive learning assistant</span>
            </div>
            <div className="flex gap-3">
              <Link href="/" className="rounded-md px-3 py-2 text-sm text-slate-200 hover:bg-slate-800">Chat</Link>
              <Link href="/dashboard" className="rounded-md px-3 py-2 text-sm text-slate-200 hover:bg-slate-800">Dashboard</Link>
            </div>
          </div>
        </nav>

        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
