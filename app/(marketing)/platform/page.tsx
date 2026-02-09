"use client";

import { motion } from "framer-motion";
import {
    Users,
    UserCheck,
    Shield,
    Building2,
    Bot,
    ArrowRight,
    Zap,
    Globe,
    Lock,
    Layers,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { SectionHeading, CTASection } from "@/components/marketing";

const ecosystem = [
    {
        icon: Users,
        label: "Interns",
        description: "Learn, grow, and build your career",
        color: "from-sky-500 to-sky-600",
        image: "/role-intern.png",
    },
    {
        icon: UserCheck,
        label: "Mentors",
        description: "Guide and develop future talent",
        color: "from-blue-500 to-cyan-600",
        image: "/role-mentor.png",
    },
    {
        icon: Shield,
        label: "Admins",
        description: "Manage programs at scale",
        color: "from-emerald-500 to-green-600",
        image: "/role-admin.png",
    },
    {
        icon: Building2,
        label: "Companies",
        description: "Hire pre-vetted talent",
        color: "from-amber-500 to-orange-600",
        image: "/role-company.png",
    },
    {
        icon: Bot,
        label: "AI Engine",
        description: "Automate and optimize",
        color: "from-pink-500 to-rose-600",
        image: "/role-ai.png",
    },
];

const capabilities = [
    {
        icon: Layers,
        title: "Unified Dashboard",
        description: "One platform for tasks, learning, communication, and analytics. No more switching between tools.",
    },
    {
        icon: Bot,
        title: "AI-First Design",
        description: "Every feature is enhanced by AI — from smart task suggestions to automated performance insights.",
    },
    {
        icon: Zap,
        title: "Real-Time Everything",
        description: "Live updates, instant notifications, and real-time collaboration keep everyone in sync.",
    },
    {
        icon: Globe,
        title: "Access Anywhere",
        description: "Full functionality on any device. Work from the office, home, or on the go.",
    },
    {
        icon: Lock,
        title: "Enterprise Security",
        description: "Bank-grade encryption, role-based access, and compliance-ready infrastructure.",
    },
    {
        icon: Users,
        title: "Built for Teams",
        description: "From small startups to large enterprises, scale your internship program effortlessly.",
    },
];

export default function PlatformPage() {
    return (
        <>
            {/* Hero */}
            <section className="py-24 relative overflow-hidden">
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-sky-500/5 via-transparent to-amber-500/5" />
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <SectionHeading
                        badge="Platform"
                        title="The Complete Workforce Operating System"
                        subtitle="CPS Intern connects everyone in your internship ecosystem — interns, mentors, admins, companies, and AI — in one intelligent platform."
                    />
                </div>
            </section>

            {/* Ecosystem Diagram */}
            <section className="py-12 pb-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="relative p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50 overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-sky-500/10 via-transparent to-transparent" />

                        {/* Central Hub */}
                        <div className="relative flex flex-col items-center">
                            <motion.div
                                initial={{ scale: 0 }}
                                whileInView={{ scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.2, type: "spring" }}
                                className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-violet-900 to-indigo-950 text-white shadow-2xl shadow-indigo-900/50 mb-8"
                            >
                                <div className="relative h-16 w-16">
                                    <Image
                                        src="/logo.png"
                                        alt="CPS Intern Logo"
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                            </motion.div>

                            {/* Nodes */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 w-full max-w-4xl">
                                {ecosystem.map((node, i) => (
                                    <motion.div
                                        key={node.label}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: 0.3 + i * 0.1 }}
                                        className="flex flex-col items-center text-center p-4"
                                    >
                                        {node.image ? (
                                            <div className="relative h-28 w-28 mb-4 hover:scale-105 transition-transform duration-300">
                                                <Image
                                                    src={node.image}
                                                    alt={node.label}
                                                    fill
                                                    className="object-contain drop-shadow-xl"
                                                />
                                            </div>
                                        ) : (
                                            <div className={`flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br ${node.color} text-white shadow-lg mb-4 hover:scale-105 transition-transform duration-300`}>
                                                <node.icon className="h-10 w-10" />
                                            </div>
                                        )}
                                        <span className="font-semibold text-foreground mb-1 text-lg">{node.label}</span>
                                        <span className="text-sm text-muted-foreground">{node.description}</span>
                                    </motion.div>
                                ))}
                            </div>

                            <p className="mt-8 text-center text-muted-foreground max-w-lg">
                                All connected through a single, intelligent platform that automates workflows, tracks progress, and delivers insights.
                            </p>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Capabilities */}
            <section className="py-24 bg-muted/30">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <SectionHeading
                        badge="Capabilities"
                        title="Built for the Modern Workforce"
                        subtitle="Enterprise-grade features designed for speed, scale, and simplicity."
                    />

                    <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                        {capabilities.map((cap, i) => (
                            <motion.div
                                key={cap.title}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="p-6 rounded-2xl bg-gradient-to-br from-background to-muted/30 border border-border/50"
                            >
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 mb-4">
                                    <cap.icon className="h-6 w-6" />
                                </div>
                                <h3 className="text-lg font-semibold text-foreground mb-2">{cap.title}</h3>
                                <p className="text-sm text-muted-foreground">{cap.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Integration Preview */}
            <section className="py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <span className="inline-block mb-4 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-400 bg-sky-500/10 rounded-full">
                                Coming Soon
                            </span>
                            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                                Integrations & API
                            </h2>
                            <p className="text-lg text-muted-foreground mb-6">
                                Connect CPS Intern with your existing tools. We're building integrations with Slack, Microsoft Teams, Google Workspace, and more. Plus, a powerful API for custom workflows.
                            </p>
                            <Button asChild variant="outline">
                                <Link href="/contact">
                                    Join Waitlist
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-sky-500/20 to-amber-500/20 rounded-3xl blur-2xl" />
                            <div className="relative grid grid-cols-3 gap-4 p-8">
                                {["Slack", "Teams", "Google", "Zoom", "Notion", "GitHub"].map((tool, i) => (
                                    <motion.div
                                        key={tool}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.1 }}
                                        className="aspect-square rounded-2xl bg-gradient-to-br from-muted to-muted/50 border border-border/50 flex items-center justify-center"
                                    >
                                        <span className="text-sm font-medium text-muted-foreground">{tool}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <CTASection
                title="Experience the Platform"
                subtitle="See why teams choose CPS Intern for their internship programs."
            />
        </>
    );
}
