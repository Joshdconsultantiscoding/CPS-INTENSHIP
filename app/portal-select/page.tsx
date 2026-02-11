"use client";

import Link from "next/link";
import {
    ShieldCheck,
    GraduationCap,
    Building2,
    Search,
    Store,
    Sparkles,
    Users,
} from "lucide-react";
import { PortalCard } from "@/components/portal-card";

// ============================================================
// PORTAL SELECT — Pre-login role/portal selection page
// This is a NEW route. Does NOT modify any existing routes.
// NO authentication logic here — just metadata (intent).
// ============================================================

export default function PortalSelectPage() {
    return (
        <div className="relative min-h-screen overflow-hidden bg-[#0a0a1a]">
            {/* Animated background gradients */}
            <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute -left-1/4 -top-1/4 h-[600px] w-[600px] rounded-full bg-indigo-600/20 blur-[120px]" />
                <div className="absolute -bottom-1/4 -right-1/4 h-[500px] w-[500px] rounded-full bg-purple-600/15 blur-[120px]" />
                <div className="absolute left-1/2 top-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/10 blur-[100px]" />
            </div>

            {/* Top nav */}
            <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
                        <Users className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xl font-bold text-white">InternHub</span>
                </div>
                <Link
                    href="/auth/sign-in"
                    className="text-sm font-medium text-gray-400 transition-colors hover:text-white"
                >
                    Direct Sign In →
                </Link>
            </header>

            {/* Main content */}
            <main className="relative z-10 mx-auto max-w-5xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
                {/* Hero */}
                <div className="mb-14 text-center">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-1.5 text-sm font-medium text-indigo-300">
                        <Sparkles className="h-3.5 w-3.5" />
                        Choose Your Portal
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                        How will you use{" "}
                        <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                            InternHub
                        </span>
                        ?
                    </h1>
                    <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-400">
                        Select your role to get a personalized experience. You can always
                        change this later.
                    </p>
                </div>

                {/* Portal cards grid */}
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    <PortalCard
                        title="Admin"
                        description="Manage interns, create courses, track performance, and oversee your organization."
                        icon={ShieldCheck}
                        intent="admin"
                        gradient="from-indigo-500 to-blue-600"
                        accentColor="rgba(99, 102, 241, 0.5)"
                    />
                    <PortalCard
                        title="Mentor"
                        description="Guide interns, review submissions, provide feedback, and shape careers."
                        icon={GraduationCap}
                        intent="mentor"
                        gradient="from-emerald-500 to-teal-600"
                        accentColor="rgba(16, 185, 129, 0.5)"
                    />
                    <PortalCard
                        title="Company"
                        description="Post opportunities, manage intern programs, and find top talent."
                        icon={Building2}
                        intent="company"
                        gradient="from-amber-500 to-orange-600"
                        accentColor="rgba(245, 158, 11, 0.5)"
                    />
                    <PortalCard
                        title="Recruiter"
                        description="Discover interns, review profiles, and connect talent with opportunities."
                        icon={Search}
                        intent="recruiter"
                        gradient="from-rose-500 to-pink-600"
                        accentColor="rgba(244, 63, 94, 0.5)"
                    />
                    <PortalCard
                        title="Marketplace"
                        description="Browse intern profiles, projects, and available talent in the public marketplace."
                        icon={Store}
                        intent="marketplace"
                        href="/marketplace"
                        viewOnly
                        gradient="from-violet-500 to-purple-600"
                        accentColor="rgba(139, 92, 246, 0.5)"
                    />
                    <PortalCard
                        title="AI Tools"
                        description="Explore AI-powered tools for resume building, interview prep, and career insights."
                        icon={Sparkles}
                        intent="ai"
                        href="/ai"
                        viewOnly
                        gradient="from-cyan-500 to-blue-600"
                        accentColor="rgba(6, 182, 212, 0.5)"
                    />
                </div>

                {/* Bottom link */}
                <div className="mt-12 text-center">
                    <p className="text-sm text-gray-500">
                        Already have an account?{" "}
                        <Link
                            href="/auth/sign-in"
                            className="font-medium text-indigo-400 transition-colors hover:text-indigo-300"
                        >
                            Sign in here
                        </Link>
                    </p>
                </div>
            </main>
        </div>
    );
}
