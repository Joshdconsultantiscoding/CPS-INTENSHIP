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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    SectionHeading,
    FeatureCard,
    StatsCard,
    TestimonialCard,
    CTASection,
} from "@/components/marketing";

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

const testimonials = [
    {
        quote: "CPS Intern transformed how we manage our internship program. The AI assistant alone saved us 20 hours a week.",
        author: "Sarah Chen",
        role: "HR Director, TechFlow Inc.",
    },
    {
        quote: "As an intern, I finally have a platform that tracks my growth and helps me build a portfolio that gets noticed by recruiters.",
        author: "Michael Adeyemi",
        role: "Software Engineering Intern",
    },
    {
        quote: "The analytics dashboard gives us real-time visibility into intern performance. It's like having a superpower for talent management.",
        author: "David Park",
        role: "Head of Talent, StartupXYZ",
    },
];

export default function HomePage() {
    return (
        <>
            {/* Hero Section */}
            <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0 -z-10">
                    <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 via-transparent to-amber-500/5" />
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-br from-sky-500/20 via-amber-500/10 to-transparent rounded-full blur-3xl opacity-50" />
                    <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-gradient-to-tl from-sky-500/20 via-blue-500/10 to-transparent rounded-full blur-3xl opacity-50" />
                </div>

                {/* Floating Elements */}
                <div className="absolute inset-0 -z-10 overflow-hidden">
                    <motion.div
                        animate={{ y: [0, -20, 0] }}
                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-1/4 left-1/4 w-20 h-20 bg-gradient-to-br from-sky-500/30 to-amber-500/30 rounded-2xl blur-sm"
                    />
                    <motion.div
                        animate={{ y: [0, 20, 0] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                        className="absolute top-1/3 right-1/4 w-16 h-16 bg-gradient-to-br from-sky-500/30 to-blue-500/30 rounded-full blur-sm"
                    />
                    <motion.div
                        animate={{ y: [0, -15, 0] }}
                        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                        className="absolute bottom-1/4 left-1/3 w-24 h-24 bg-gradient-to-br from-pink-500/20 to-rose-500/20 rounded-3xl blur-sm"
                    />
                </div>

                <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <span className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-sky-600 dark:text-sky-400 bg-sky-500/10 rounded-full mb-6">
                            <Sparkles className="h-4 w-4" />
                            AI-Powered Workforce Platform
                        </span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.1 }}
                        className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground max-w-5xl mx-auto"
                    >
                        Build Skills.{" "}
                        <span className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 bg-clip-text text-transparent">
                            Track Growth.
                        </span>{" "}
                        Get Hired.
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto"
                    >
                        CPS Intern is the AI-powered workforce platform where interns learn, teams collaborate, mentors guide, and companies hire top talent — all in one place.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <Button asChild size="lg" className="h-12 px-8 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-lg shadow-amber-500/25 text-base">
                            <Link href="/auth/sign-up">
                                Get Started Free
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                        <Button asChild size="lg" variant="outline" className="h-12 px-8 text-base">
                            <Link href="/features">
                                Explore Features
                            </Link>
                        </Button>
                    </motion.div>

                    {/* Trust Badges */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="mt-16 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-muted-foreground"
                    >
                        <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-amber-500" />
                            <span>Lightning Fast</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-emerald-500" />
                            <span>Enterprise Security</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-blue-500" />
                            <span>Global Access</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Bot className="h-4 w-4 text-sky-500" />
                            <span>AI-Powered</span>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 border-y border-border/40 bg-muted/30">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col items-center justify-center mb-10 text-center">
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-500 text-xs font-medium uppercase tracking-wider mb-2">
                            Projected Milestones
                        </span>
                        <p className="text-muted-foreground text-sm max-w-xl">
                            We envision hitting these targets in a few months as we scale our impact.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {stats.map((stat, i) => (
                            <StatsCard key={stat.label} value={stat.value} label={stat.label} delay={i * 0.1} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Platform Overview */}
            <section className="py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <SectionHeading
                        badge="Platform"
                        title="One Platform, Infinite Possibilities"
                        subtitle="Connect interns, mentors, companies, and AI in a seamlessly integrated ecosystem designed for modern workforce development."
                    />

                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="mt-16 relative"
                    >
                        {/* Ecosystem Diagram */}
                        <div className="relative p-8 rounded-3xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50 overflow-hidden">
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-sky-500/5 via-transparent to-transparent" />
                            <div className="relative grid grid-cols-2 md:grid-cols-5 gap-6 text-center">
                                {[
                                    { icon: Users, label: "Interns", color: "from-sky-500 to-sky-600", image: "/role-intern.png" },
                                    { icon: UserCheck, label: "Mentors", color: "from-blue-500 to-cyan-600", image: "/role-mentor.png" },
                                    { icon: Shield, label: "Admins", color: "from-emerald-500 to-green-600", image: "/role-admin.png" },
                                    { icon: Building2, label: "Companies", color: "from-amber-500 to-orange-600", image: "/role-company.png" },
                                    { icon: Bot, label: "AI", color: "from-pink-500 to-rose-600", image: "/role-ai.png" },
                                ].map((item, i) => (
                                    <motion.div
                                        key={item.label}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.1 }}
                                        className="flex flex-col items-center"
                                    >
                                        {item.image ? (
                                            <div className="relative h-24 w-24 mb-3 hover:scale-105 transition-transform duration-300 mx-auto">
                                                <Image
                                                    src={item.image}
                                                    alt={item.label}
                                                    fill
                                                    className="object-contain drop-shadow-lg"
                                                />
                                            </div>
                                        ) : (
                                            <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color} text-white shadow-lg mb-3 mx-auto hover:scale-105 transition-transform duration-300`}>
                                                <item.icon className="h-8 w-8" />
                                            </div>
                                        )}
                                        <span className="font-medium text-foreground">{item.label}</span>
                                    </motion.div>
                                ))}
                            </div>
                            <p className="mt-8 text-center text-muted-foreground">
                                Everyone connected. Everything automated. Everywhere accessible.
                            </p>
                        </div>
                    </motion.div>
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

            {/* Testimonials */}
            <section className="py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <SectionHeading
                        badge="Testimonials"
                        title="Loved by Teams Worldwide"
                        subtitle="See what our users are saying about CPS Intern."
                    />

                    <div className="mt-16 grid gap-8 md:grid-cols-3">
                        {testimonials.map((testimonial, i) => (
                            <TestimonialCard
                                key={testimonial.author}
                                quote={testimonial.quote}
                                author={testimonial.author}
                                role={testimonial.role}
                                delay={i * 0.1}
                            />
                        ))}
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
