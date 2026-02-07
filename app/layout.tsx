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
  metadataBase: new URL("https://cps-internship.vercel.app"),
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "InternHub - Internship Management Platform",
    description: "A comprehensive internship management platform for tracking tasks, daily reports, performance analytics, and team communication.",
    url: "https://cps-internship.vercel.app",
    siteName: "InternHub",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 800,
        alt: "InternHub Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "InternHub - Internship Management Platform",
    description: "A comprehensive internship management platform for tracking tasks, daily reports, performance analytics, and team communication.",
    images: ["/logo.png"],
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
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.className} antialiased`}>
        <ClerkProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <LoadingProvider>
              {children}
              <LoadingOverlay />
              <Toaster richColors position="top-right" />
              <Analytics />
            </LoadingProvider>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
