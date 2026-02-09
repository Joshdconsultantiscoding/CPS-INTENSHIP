"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users,
    UserCheck,
    Building2,
    Shield,
    GraduationCap,
    BarChart3,
    Award,
    FileText,
    CheckCircle2,
    ArrowRight,
    Briefcase,
    TrendingUp,
    Target,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { SectionHeading, CTASection } from "@/components/marketing";
import { cn } from "@/lib/utils";

const solutions = [
    {
        id: "interns",
        icon: Users,
        label: "For Interns",
        color: "from-sky-500 to-sky-600",
        headline: "Build Your Career Foundation",
        description: "CPS Intern gives you everything you need to learn, grow, and get hired.",
        benefits: [
            { icon: GraduationCap, title: "Structured Learning", description: "Access courses, quizzes, and real-world projects designed for skill development." },
            { icon: BarChart3, title: "Track Your Growth", description: "Visual dashboards show your progress, scores, and areas for improvement." },
            { icon: Award, title: "Earn Recognition", description: "Collect points, badges, and certificates that prove your capabilities." },
            { icon: FileText, title: "Build Your Portfolio", description: "Professional profiles with downloadable CVs to share with recruiters." },
            { icon: Briefcase, title: "Get Discovered", description: "Top performers get visibility to hiring companies on our marketplace." },
        ],
        cta: "Start Learning",
        image: "/role-intern.png",
    },
    {
        id: "mentors",
        icon: UserCheck,
        label: "For Mentors",
        color: "from-blue-500 to-cyan-600",
        headline: "Guide the Next Generation",
        description: "Powerful tools to coach, review, and develop interns at scale.",
        benefits: [
            { icon: Users, title: "Mentee Management", description: "Track all your assigned interns in one dashboard with progress updates." },
            { icon: CheckCircle2, title: "Review Workflows", description: "Structured feedback loops for task reviews and performance assessments." },
            { icon: Target, title: "Goal Setting", description: "Set learning objectives and track intern progress toward milestones." },
            { icon: TrendingUp, title: "Impact Tracking", description: "See how your mentorship contributes to intern success over time." },
            { icon: Award, title: "Mentor Recognition", description: "Build your reputation as a top mentor with verified reviews." },
        ],
        cta: "Become a Mentor",
        image: "/role-mentor.png",
    },
    {
        id: "companies",
        icon: Building2,
        label: "For Companies",
        color: "from-amber-500 to-orange-600",
        headline: "Hire Pre-Vetted Talent",
        description: "Access a marketplace of skilled, performance-verified interns ready to contribute.",
        benefits: [
            { icon: Users, title: "Talent Marketplace", description: "Browse intern profiles filtered by skills, ratings, and availability." },
            { icon: BarChart3, title: "Performance Data", description: "Make hiring decisions based on real performance metrics, not just resumes." },
            { icon: CheckCircle2, title: "Verified Skills", description: "Certifications and badges confirm intern capabilities." },
            { icon: Briefcase, title: "Direct Hiring", description: "Send offers and manage hiring directly through the platform." },
            { icon: Building2, title: "Company Branding", description: "Showcase your company to attract top intern talent." },
        ],
        cta: "Find Talent",
        image: "/role-company.png",
    },
    {
        id: "management",
        icon: Shield,
        label: "For Management",
        color: "from-emerald-500 to-green-600",
        headline: "Scale Your Program",
        description: "Enterprise tools to manage large internship programs with ease.",
        benefits: [
            { icon: Users, title: "Bulk Management", description: "Onboard, assign, and manage hundreds of interns efficiently." },
            { icon: BarChart3, title: "Program Analytics", description: "Real-time dashboards for program health, completion rates, and ROI." },
            { icon: Shield, title: "Access Control", description: "Role-based permissions ensure the right people see the right data." },
            { icon: Target, title: "Goal Alignment", description: "Track how intern work aligns with organizational objectives." },
            { icon: TrendingUp, title: "Outcome Reporting", description: "Generate reports for stakeholders on program success." },
        ],
        cta: "Request Demo",
        image: "/role-admin.png",
    },
];

export default function SolutionsPage() {
    const [activeTab, setActiveTab] = useState("interns");
    const activeSolution = solutions.find((s) => s.id === activeTab)!;

    return (
        <>
            {/* Hero */}
            <section className="py-24 relative overflow-hidden">
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-sky-500/5 via-transparent to-amber-500/5" />
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <SectionHeading
                        badge="Solutions"
                        title="Solutions for Every Role"
                        subtitle="Whether you're an intern, mentor, company, or program manager — CPS Intern has tools designed specifically for you."
                    />
                </div>
            </section>

            {/* Tabs */}
            <section className="pb-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Tab Buttons */}
                    <div className="flex flex-wrap justify-center gap-2 mb-12">
                        {solutions.map((solution) => (
                            <button
                                key={solution.id}
                                onClick={() => setActiveTab(solution.id)}
                                className={cn(
                                    "flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all",
                                    activeTab === solution.id
                                        ? `bg-gradient-to-r ${solution.color} text-white shadow-lg`
                                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                                )}
                            >
                                <solution.icon className="h-4 w-4" />
                                {solution.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="grid lg:grid-cols-2 gap-12 items-start">
                                {/* Left: Info */}
                                <div>
                                    {activeSolution.image ? (
                                        <div className="relative h-40 w-40 mb-6 hover:scale-105 transition-transform duration-300">
                                            <Image
                                                src={activeSolution.image}
                                                alt={activeSolution.label}
                                                fill
                                                className="object-contain drop-shadow-2xl"
                                            />
                                        </div>
                                    ) : (
                                        <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${activeSolution.color} text-white shadow-lg mb-6`}>
                                            <activeSolution.icon className="h-7 w-7" />
                                        </div>
                                    )}
                                    <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                                        {activeSolution.headline}
                                    </h2>
                                    <p className="text-lg text-muted-foreground mb-8">
                                        {activeSolution.description}
                                    </p>
                                    <Button asChild size="lg" className={`bg-gradient-to-r ${activeSolution.color} hover:opacity-90 shadow-lg`}>
                                        <Link href="/auth/sign-up">
                                            {activeSolution.cta}
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>

                                {/* Right: Benefits */}
                                <div className="space-y-4">
                                    {activeSolution.benefits.map((benefit, i) => (
                                        <motion.div
                                            key={benefit.title}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="flex gap-4 p-4 rounded-xl bg-gradient-to-br from-muted/50 to-transparent border border-border/50"
                                        >
                                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${activeSolution.color} text-white`}>
                                                <benefit.icon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-foreground mb-1">{benefit.title}</h3>
                                                <p className="text-sm text-muted-foreground">{benefit.description}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </section>

            {/* CTA */}
            <CTASection
                title="Find Your Solution"
                subtitle="Join thousands of users who've transformed their internship experience."
            />
        </>
    );
}
