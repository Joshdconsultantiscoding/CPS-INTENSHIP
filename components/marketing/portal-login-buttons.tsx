"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

// ============================================================
// PORTAL LOGIN BUTTONS — Drop-in replacement CTA buttons
// This is a NEW component. Does NOT modify MarketingHeader.tsx
// or home-page-client.tsx.
//
// Available for future use when portal_selection flag is ON.
// ============================================================

interface PortalLoginButtonsProps {
    /** Show compact (header) or full (hero) style */
    variant?: "header" | "hero";
    className?: string;
}

export function PortalLoginButtons({
    variant = "header",
    className = "",
}: PortalLoginButtonsProps) {
    if (variant === "hero") {
        return (
            <div className={`flex flex-col items-center justify-center gap-4 sm:flex-row ${className}`}>
                <Link
                    href="/portal-select"
                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-0.5"
                >
                    Get Started
                    <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                    href="/auth/sign-in"
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-50 hover:-translate-y-0.5 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                    Sign In to Dashboard
                </Link>
            </div>
        );
    }

    // Header variant
    return (
        <div className={`flex items-center gap-3 ${className}`}>
            <Link
                href="/auth/sign-in"
                className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
                Sign In
            </Link>
            <Link
                href="/portal-select"
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-indigo-500/20 transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/30"
            >
                Get Started
            </Link>
        </div>
    );
}
