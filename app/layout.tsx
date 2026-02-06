import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "@/components/ui/sonner";
import { LoadingProvider } from "@/hooks/use-loading";
import { LoadingOverlay } from "@/components/ui/loading-overlay";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });
const geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "InternHub - Internship Management Platform",
    template: "%s | InternHub",
  },
  description:
    "A comprehensive internship management platform for tracking tasks, daily reports, performance analytics, and team communication.",
  icons: {
    icon: "/assets/favicon/logo.png",
    apple: "/assets/favicon/logo.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#1e1b4b" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={`${geist.className} antialiased`}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <LoadingProvider>
              {children}
              <LoadingOverlay />
              <Toaster richColors position="top-right" />
              <Analytics />
            </LoadingProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
