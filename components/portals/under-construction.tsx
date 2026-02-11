"use client";

import React from "react";
import { Construction, ArrowLeft } from "lucide-react";
import Link from "next/link";

// ============================================================
// UNDER CONSTRUCTION — Safety fallback component
// Shown when a feature flag is disabled or a portal errors out.
// This is a NEW component. Does NOT modify any existing code.
// ============================================================

interface UnderConstructionProps {
    title?: string;
    message?: string;
}

export function UnderConstruction({
    title = "Under Construction",
    message = "This feature is currently being built. Check back soon!",
}: UnderConstructionProps) {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-950">
            <div className="text-center max-w-md">
                <div className="w-16 h-16 rounded-2xl bg-amber-600/20 flex items-center justify-center mx-auto mb-6">
                    <Construction className="w-8 h-8 text-amber-400" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>
                <p className="text-gray-400 mb-6">{message}</p>
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 font-medium hover:bg-white/10 transition-colors text-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </Link>
            </div>
        </div>
    );
}
