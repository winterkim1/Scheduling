import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ResponsiveToaster } from "@/components/layout/responsive-toaster";
import { AppShell } from "@/components/layout/app-shell";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "MeetFlow — 스마트 회의 일정 관리",
  description:
    "최소한의 커뮤니케이션으로 회의 일정을 확정하고, 투명성과 신뢰를 높입니다.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <AppShell>{children}</AppShell>
        <ResponsiveToaster />
      </body>
    </html>
  );
}
