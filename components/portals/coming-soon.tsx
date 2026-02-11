"use client";

import React from "react";
import { Rocket, ArrowLeft, Bell } from "lucide-react";
import Link from "next/link";

// ============================================================
// COMING SOON — Shared reusable component for placeholder portals
// This is a NEW component. It does NOT modify any existing code.
// ============================================================

interface ComingSoonProps {
    portalName: string;
    description: string;
    icon?: React.ReactNode;
    gradientFrom?: string;
    gradientTo?: string;
}

export function ComingSoon({
    portalName,
    description,
    icon,
    gradientFrom = "from-indigo-600",
    gradientTo = "to-purple-600",
}: ComingSoonProps) {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                    className={`absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br ${gradientFrom} ${gradientTo} rounded-full opacity-10 blur-3xl animate-pulse`}
                />
                <div
                    className={`absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br ${gradientFrom} ${gradientTo} rounded-full opacity-10 blur-3xl animate-pulse`}
                    style={{ animationDelay: "1s" }}
                />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-white/[0.02] to-transparent rounded-full blur-2xl" />
            </div>

            <div className="relative z-10 max-w-lg w-full text-center">
                {/* Icon */}
                <div
                    className={`mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br ${gradientFrom} ${gradientTo} flex items-center justify-center mb-8 shadow-2xl shadow-indigo-500/20`}
                >
                    {icon || <Rocket className="w-10 h-10 text-white" />}
                </div>

                {/* Portal name */}
                <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
                    {portalName}
                </h1>

                {/* Coming Soon badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-sm text-gray-300 mb-6">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    Coming Soon
                </div>

                {/* Description */}
                <p className="text-gray-400 text-lg leading-relaxed mb-8">
                    {description}
                </p>

                {/* CTA */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r ${gradientFrom} ${gradientTo} text-white font-medium hover:opacity-90 transition-opacity shadow-lg`}
                        onClick={() => {
                            // Placeholder — future notification signup
                            alert("You'll be notified when this portal launches!");
                        }}
                    >
                        <Bell className="w-4 h-4" />
                        Notify Me
                    </button>
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 font-medium hover:bg-white/10 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Link>
                </div>

                {/* Footer note */}
                <p className="text-gray-600 text-sm mt-12">
                    This portal is currently under development.
                    <br />
                    Your data and access will remain safe.
                </p>
            </div>
        </div>
    );
}
