"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
    MessageSquare,
    CheckCircle2,
    GraduationCap,
    Award,
    Bot,
    Search,
    BarChart3,
    Bell,
    Users,
    Shield,
    UserCheck,
    Building2,
    ArrowRight,
    Sparkles,
    Zap,
    Globe,
    Rocket,
    Target,
    Heart,
    ShieldAlert,
    ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    SectionHeading,
    FeatureCard,
    StatsCard,
    CTASection,
} from "@/components/marketing";
import { cn } from "@/lib/utils";

const features = [
    {
        icon: Bot,
        title: "AI Smart Assistant",
        description: "Built-in AI helper that guides interns, answers questions, suggests tasks, and automates reporting.",
    },
    {
        icon: MessageSquare,
        title: "Real-Time Messaging",
        description: "WhatsApp-style team chat with presence tracking, calls, typing indicators, and file sharing.",
    },
    {
        icon: CheckCircle2,
        title: "Smart Task Manager",
        description: "Assign, track, and auto-score intern performance with deadlines, reminders, and analytics.",
    },
    {
        icon: GraduationCap,
        title: "Classroom & LMS",
        description: "Courses, quizzes, timed lessons, certificates, and progress tracking for structured learning.",
    },
    {
        icon: Award,
        title: "Rewards & Points",
        description: "Earn points for performance, complete challenges, and convert achievements to real rewards.",
    },
    {
        icon: Users,
        title: "Professional Profiles",
        description: "LinkedIn-style profiles with CV download, skills, endorsements, and shareable badges.",
    },
    {
        icon: Search,
        title: "Recruiter Search",
        description: "Companies browse interns like Fiverr/Upwork and hire top performers directly.",
    },
    {
        icon: BarChart3,
        title: "Analytics Dashboard",
        description: "Real-time charts showing productivity, attendance, growth metrics, and team insights.",
    },
    {
        icon: Bell,
        title: "Notifications Engine",
        description: "Instant alerts with sound, push notifications, and live updates across all devices.",
    },
    {
        icon: Shield,
        title: "Role Management",
        description: "Admins control permissions, roles, visibility, and access levels for entire teams.",
    },
    {
        icon: UserCheck,
        title: "Mentor System",
        description: "Mentors guide interns, review work, provide feedback, and track mentee progress.",
    },
    {
        icon: Building2,
        title: "Company Portal",
        description: "Brands manage staff, assign work, track performance, and recruit directly from the platform.",
    },
];

const stats = [
    { value: "10,000+", label: "Tasks Completed" },
    { value: "500+", label: "Interns Trained" },
    { value: "95%", label: "Completion Rate" },
    { value: "50+", label: "Partner Companies" },
];

const roadmapSteps = [
    {
        icon: Rocket,
        title: "Beta Launch 2025",
        description: "Early access for partner institutions and core feature validation.",
        status: "Completed",
    },
    {
        icon: Target,
        title: "Projected 2026 Expansion",
        description: "Public rollout targeting 10,000+ interns across West Africa.",
        status: "In Progress",
    },
    {
        icon: Zap,
        title: "AI Ecosystem V2",
        description: "Advanced skill-matching and automated recruiter placements.",
        status: "Upcoming",
    },
    {
        icon: GraduationCap,
        title: "Global Certification",
        description: "Partnering with international tech hubs for worldwide recognition.",
        status: "Future",
    },
];

const missionStatement = {
    title: "Truth in Talent",
    description: "We don't just build software; we build careers. Our platform is a commitment to authentic professional development, where every stat is an earned milestone and every user is a future industry leader.",
};

export default function HomePage() {
    return (
        <>
            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
                {/* Background Effects */}
                <div className="absolute inset-0 -z-10">
                    <div className="absolute inset-0 bg-slate-50 dark:bg-slate-950" />
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] from-sky-500/10 via-transparent to-transparent blur-3xl" />
                    <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-sky-500/5 rounded-full blur-[120px] animate-pulse" />
                    <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-blue-500/5 rounded-full blur-[100px] animate-pulse delay-700" />
                </div>

                <div className="relative mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 py-12 text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-white bg-slate-900 dark:bg-slate-800 rounded-full mb-8 shadow-2xl border border-white/10"
                    >
                        <Sparkles className="h-3.5 w-3.5 text-sky-400" />
                        Next-Gen Workforce OS
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.1, ease: [0, 0.5, 0.5, 1] }}
                        className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter text-foreground mb-8 leading-[0.85]"
                    >
                        Master Your<br />
                        <span className="text-sky-500 drop-shadow-sm">Growth.</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="mt-6 text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-medium"
                    >
                        CPS Intern is the AI-powered ecosystem where ambition meets opportunity. Build skills, collaborate globally, and launch your career.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-5"
                    >
                        <Button asChild size="lg" className="h-16 px-10 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-black text-xl hover:scale-105 active:scale-95 transition-all shadow-2xl">
                            <Link href="/auth/sign-up">
                                Get Started Free
                                <ArrowRight className="ml-2 h-6 w-6" />
                            </Link>
                        </Button>
                        <Button asChild size="lg" variant="outline" className="h-16 px-10 rounded-2xl border-2 font-black text-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-all">
                            <Link href="/features">Explore Platform</Link>
                        </Button>
                    </motion.div>

                    {/* Quick Stats Overlay */}
                    <div className="relative group">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1, duration: 1 }}
                            className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
                        >
                            {[
                                { label: "Uptime", val: "99.9%", status: "Live" },
                                { label: "Security", val: "AES-256", status: "Active" },
                                { label: "Impact", val: "10k+", status: "2026 Goal" },
                                { label: "Network", val: "500+", status: "Partnering" },
                            ].map((s, i) => (
                                <div key={i} className="p-5 bg-white/5 dark:bg-slate-900/50 backdrop-blur-2xl rounded-3xl border border-white/10 dark:border-slate-800/50 text-left hover:bg-white/10 transition-all shadow-2xl">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{s.label}</div>
                                        <div className={cn(
                                            "text-[8px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-tighter",
                                            s.status === "Live" || s.status === "Active" ? "bg-emerald-500/20 text-emerald-500" : "bg-sky-500/20 text-sky-50"
                                        )}>{s.status}</div>
                                    </div>
                                    <div className="text-2xl font-black text-foreground">{s.val}</div>
                                </div>
                            ))}
                        </motion.div>

                        {/* Transparency Disclaimer */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.5 }}
                            className="mt-8 flex items-center justify-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] opacity-60 group-hover:opacity-100 transition-opacity"
                        >
                            <ShieldAlert className="h-3 w-3 text-sky-500" />
                            <span>Transparent Roadmap • Projected 2026 Goals</span>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Platform Ecosystem Visualization */}
            <section className="py-32 relative overflow-hidden bg-white dark:bg-slate-950">
                <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
                    <SectionHeading
                        badge="Ecosystem"
                        title="Everything connected."
                        subtitle="Join a unified workspace designed to empower every stakeholder in the professional growth journey."
                    />

                    <div className="mt-24 relative min-h-[600px] flex flex-col items-center justify-center">
                        {/* Orbiting Elements (Desktop Only) */}
                        <div className="hidden md:block absolute inset-0">
                            {[
                                { label: "Interns", icon: Users, color: "bg-emerald-500", x: -250, y: -150, delay: 0.1 },
                                { label: "Admins", icon: Shield, color: "bg-rose-500", x: 250, y: -150, delay: 0.2 },
                                { label: "Mentors", icon: UserCheck, color: "bg-amber-500", x: -280, y: 120, delay: 0.3 },
                                { label: "Companies", icon: Building2, color: "bg-blue-500", x: 280, y: 120, delay: 0.4 },
                                { label: "AI OS", icon: Bot, color: "bg-sky-500", x: 0, y: -280, delay: 0.5 },
                            ].map((node, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    whileInView={{
                                        opacity: 1,
                                        scale: 1,
                                        x: node.x,
                                        y: node.y,
                                    }}
                                    viewport={{ once: true }}
                                    transition={{ type: "spring", damping: 15, delay: node.delay, duration: 0.8 }}
                                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4 group"
                                >
                                    <div className={cn("w-20 h-20 rounded-3xl flex items-center justify-center text-white shadow-xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6", node.color)}>
                                        <node.icon className="w-10 h-10" />
                                    </div>
                                    <span className="text-xl font-black tracking-tight text-foreground whitespace-nowrap">{node.label}</span>
                                </motion.div>
                            ))}
                        </div>

                        {/* Central Hub (Responsive) */}
                        <motion.div
                            initial={{ scale: 0 }}
                            whileInView={{ scale: 1 }}
                            viewport={{ once: true }}
                            className="relative z-10 w-40 h-40 md:w-56 md:h-56 rounded-full bg-linear-to-br from-sky-400 to-blue-600 flex items-center justify-center p-8 md:p-10 shadow-2xl shadow-sky-500/40 mb-12 md:mb-0"
                        >
                            <div className="relative w-full h-full flex items-center justify-center">
                                <Image
                                    src="/logo.png"
                                    alt="Logo"
                                    width={140}
                                    height={140}
                                    className="object-contain drop-shadow-2xl"
                                    priority
                                />
                            </div>
                            <div className="absolute inset-0 rounded-full animate-ping bg-sky-400 opacity-20" />
                        </motion.div>

                        {/* Grid Elements (Mobile Only) */}
                        <div className="grid grid-cols-2 gap-6 w-full md:hidden">
                            {[
                                { label: "Interns", icon: Users, color: "bg-emerald-500" },
                                { label: "Admins", icon: Shield, color: "bg-rose-500" },
                                { label: "Mentors", icon: UserCheck, color: "bg-amber-500" },
                                { label: "Companies", icon: Building2, color: "bg-blue-500" },
                                { label: "AI OS", icon: Bot, color: "bg-sky-500", full: true },
                            ].map((node, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className={cn(
                                        "flex flex-col items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800",
                                        node.full ? "col-span-2" : ""
                                    )}
                                >
                                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg", node.color)}>
                                        <node.icon className="w-8 h-8" />
                                    </div>
                                    <span className="text-lg font-black tracking-tight text-foreground">{node.label}</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-20 md:mt-32 text-center">
                        <p className="text-xl font-bold text-muted-foreground italic">
                            "A seamless bridge between today's talent and tomorrow's industry leaders."
                        </p>
                    </div>
                </div>
            </section>


            {/* Features Grid */}
            <section className="py-24 bg-muted/30">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <SectionHeading
                        badge="Features"
                        title="Everything You Need to Succeed"
                        subtitle="Powerful tools designed to transform internship programs into talent pipelines."
                    />

                    <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {features.map((feature, i) => (
                            <FeatureCard
                                key={feature.title}
                                icon={feature.icon}
                                title={feature.title}
                                description={feature.description}
                                delay={i * 0.05}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* Roadmap & Transparency */}
            <section className="py-32 bg-slate-50 dark:bg-slate-950">
                <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
                    <SectionHeading
                        badge="Our Journey"
                        title="Building the Future, In Public."
                        subtitle="Join us as we bridge the gap between education and industry through innovation."
                    />

                    <div className="mt-20 grid gap-8 md:grid-cols-2 items-center">
                        {/* Roadmap Timeline */}
                        <div className="space-y-6">
                            {roadmapSteps.map((step, i) => (
                                <motion.div
                                    key={step.title}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className="relative flex gap-6 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm group hover:shadow-xl hover:shadow-sky-500/5 transition-all"
                                >
                                    <div className={cn(
                                        "h-14 w-14 shrink-0 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 group-hover:rotate-3 shadow-md",
                                        step.status === "Completed" ? "bg-emerald-500 text-white" : "bg-sky-500 text-white"
                                    )}>
                                        <step.icon className="h-7 w-7" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-lg font-black text-foreground">{step.title}</h3>
                                            <span className={cn(
                                                "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                                                step.status === "Completed" ? "bg-emerald-500/10 text-emerald-500" : "bg-sky-500/10 text-sky-500"
                                            )}>{step.status}</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Vision Card */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            className="relative h-full p-10 md:p-14 bg-linear-to-br from-sky-400 to-blue-600 rounded-[3rem] text-white flex flex-col justify-center overflow-hidden shadow-2xl shadow-sky-500/20"
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <ShieldCheck className="h-64 w-64" />
                            </div>
                            <div className="relative z-10 space-y-8">
                                <div className="h-16 w-16 rounded-3xl bg-white/20 backdrop-blur-xl flex items-center justify-center">
                                    <Heart className="h-8 w-8 text-white" fill="white" />
                                </div>
                                <h3 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
                                    {missionStatement.title}
                                </h3>
                                <p className="text-xl md:text-2xl font-bold opacity-90 leading-relaxed text-sky-50">
                                    {missionStatement.description}
                                </p>
                                <div className="pt-6 border-t border-white/20">
                                    <p className="text-sm font-black uppercase tracking-[0.3em] opacity-70">Authentic Growth • 2026 Commitment</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <CTASection
                title="Start Your Journey Today"
                subtitle="Join thousands of interns and companies building the future of work."
                primaryLabel="Create Free Account"
                secondaryLabel="Talk to Sales"
                secondaryHref="/contact"
            />
        </>
    );
}
