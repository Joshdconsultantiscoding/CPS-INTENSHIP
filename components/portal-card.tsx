"use client";

import { type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { setIntent, type PortalIntent } from "@/lib/intent";

// ============================================================
// PORTAL CARD — Reusable role selection card component
// This is a NEW file. Does NOT modify any existing code.
// ============================================================

interface PortalCardProps {
    title: string;
    description: string;
    icon: LucideIcon;
    intent: PortalIntent;
    /** Where to redirect after storing intent */
    href?: string;
    /** If true, this card links directly (no intent storage) */
    viewOnly?: boolean;
    /** Gradient colors for the icon background */
    gradient?: string;
    /** Accent color for hover border */
    accentColor?: string;
}

export function PortalCard({
    title,
    description,
    icon: Icon,
    intent,
    href,
    viewOnly = false,
    gradient = "from-indigo-500 to-purple-600",
    accentColor = "rgba(99, 102, 241, 0.4)",
}: PortalCardProps) {
    const router = useRouter();

    const handleClick = async () => {
        if (viewOnly && href) {
            // View-only cards go directly to their page
            router.push(href);
            return;
        }

        // Store intent in localStorage
        setIntent(intent);

        // Also set intent cookie via API for server-side access
        try {
            await fetch(`/api/set-intent?intent=${intent}`, { method: "POST" });
        } catch {
            // Non-critical — intent will still be in localStorage
        }

        // Redirect to Clerk sign-up with intent as query param
        const targetHref = href || `/auth/sign-up?intent=${intent}`;
        router.push(targetHref);
    };

    return (
        <button
            onClick={handleClick}
            className="portal-card group relative flex flex-col items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 text-left backdrop-blur-xl transition-all duration-300 hover:scale-[1.03] hover:bg-white/10 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 focus:ring-offset-transparent"
            style={{
                ["--accent-color" as string]: accentColor,
            }}
        >
            {/* Gradient glow effect on hover */}
            <div
                className="absolute inset-0 -z-10 rounded-2xl opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-30"
                style={{
                    background: `radial-gradient(ellipse at center, var(--accent-color), transparent 70%)`,
                }}
            />

            {/* Icon container */}
            <div
                className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-lg transition-transform duration-300 group-hover:scale-110`}
            >
                <Icon className="h-7 w-7 text-white" />
            </div>

            {/* Text */}
            <div>
                <h3 className="text-lg font-semibold text-white transition-colors duration-200 group-hover:text-white">
                    {title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-400 transition-colors duration-200 group-hover:text-gray-300">
                    {description}
                </p>
            </div>

            {/* Arrow indicator */}
            <div className="mt-auto flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-all duration-200 group-hover:translate-x-1 group-hover:text-white">
                {viewOnly ? "Explore" : "Get Started"}
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="transition-transform duration-200 group-hover:translate-x-0.5"
                >
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                </svg>
            </div>

            {/* View-only badge */}
            {viewOnly && (
                <span className="absolute right-4 top-4 rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-gray-400">
                    View Only
                </span>
            )}
        </button>
    );
}
