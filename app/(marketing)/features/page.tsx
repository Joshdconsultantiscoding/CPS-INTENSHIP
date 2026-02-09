"use client";

import { motion } from "framer-motion";
import {
    Bot,
    MessageSquare,
    CheckCircle2,
    GraduationCap,
    Award,
    Users,
    Search,
    BarChart3,
    Bell,
    Shield,
    UserCheck,
    Building2,
} from "lucide-react";
import { SectionHeading, CTASection } from "@/components/marketing";
import { cn } from "@/lib/utils";

const featureCategories = [
    {
        icon: Bot,
        title: "AI Smart Assistant",
        description: "Your intelligent partner for productivity and growth",
        details: [
            "Natural language task creation and management",
            "Automated daily report generation",
            "Personalized learning recommendations",
            "Smart performance insights and suggestions",
            "24/7 availability for intern questions",
        ],
        color: "from-sky-500 to-sky-600",
    },
    {
        icon: MessageSquare,
        title: "Real-Time Communication",
        description: "Stay connected with your team, anywhere, anytime",
        details: [
            "WhatsApp-style instant messaging",
            "Online presence and typing indicators",
            "File sharing with preview support",
            "Voice and video call integration",
            "Channel-based team discussions",
        ],
        color: "from-blue-500 to-cyan-600",
    },
    {
        icon: CheckCircle2,
        title: "Smart Task Management",
        description: "Organize, track, and complete work efficiently",
        details: [
            "Drag-and-drop task boards",
            "Priority levels and deadlines",
            "Automated status tracking",
            "Time estimation and logging",
            "Performance scoring system",
        ],
        color: "from-emerald-500 to-green-600",
    },
    {
        icon: GraduationCap,
        title: "Learning Management System",
        description: "Structured education with measurable outcomes",
        details: [
            "Course creation with modules and lessons",
            "Timed quizzes and assessments",
            "Progress tracking dashboards",
            "Certificate generation on completion",
            "Adaptive learning paths",
        ],
        color: "from-amber-500 to-orange-600",
    },
    {
        icon: Award,
        title: "Rewards & Gamification",
        description: "Motivate performance through recognition",
        details: [
            "Points earned for task completion",
            "Achievement badges and milestones",
            "Leaderboard rankings",
            "Redeemable rewards system",
            "Team-based challenges",
        ],
        color: "from-pink-500 to-rose-600",
    },
    {
        icon: Users,
        title: "Professional Profiles",
        description: "Build your career identity",
        details: [
            "LinkedIn-style public profiles",
            "Skills and endorsements",
            "Work portfolio showcase",
            "Downloadable CV generation",
            "Verified badges and certifications",
        ],
        color: "from-blue-500 to-indigo-600",
    },
    {
        icon: Search,
        title: "Recruiter Marketplace",
        description: "Connect talent with opportunity",
        details: [
            "Searchable intern database",
            "Filter by skills and ratings",
            "Direct hiring requests",
            "Company verification",
            "Interview scheduling",
        ],
        color: "from-teal-500 to-emerald-600",
    },
    {
        icon: BarChart3,
        title: "Analytics & Reporting",
        description: "Data-driven decisions at every level",
        details: [
            "Real-time performance dashboards",
            "Attendance and activity tracking",
            "Team productivity metrics",
            "Custom report generation",
            "Export to PDF and Excel",
        ],
        color: "from-amber-500 to-amber-600",
    },
    {
        icon: Bell,
        title: "Smart Notifications",
        description: "Never miss what matters",
        details: [
            "Push notifications across devices",
            "Customizable alert preferences",
            "In-app notification center",
            "Email digest summaries",
            "Priority-based filtering",
        ],
        color: "from-red-500 to-orange-600",
    },
    {
        icon: Shield,
        title: "Role-Based Access Control",
        description: "Security with flexibility",
        details: [
            "Granular permission settings",
            "Custom role creation",
            "Team-based visibility",
            "Audit logging",
            "SSO integration ready",
        ],
        color: "from-slate-500 to-gray-600",
    },
    {
        icon: UserCheck,
        title: "Mentor System",
        description: "Guided growth at scale",
        details: [
            "Mentor-mentee matching",
            "Progress review workflows",
            "Feedback and coaching tools",
            "Session scheduling",
            "Outcome tracking",
        ],
        color: "from-cyan-500 to-blue-600",
    },
    {
        icon: Building2,
        title: "Company Portal",
        description: "Enterprise workforce management",
        details: [
            "Multi-team management",
            "Centralized analytics",
            "Custom branding options",
            "API integrations",
            "Dedicated support",
        ],
        color: "from-yellow-500 to-amber-600",
    },
];

export default function FeaturesPage() {
    return (
        <>
            {/* Hero */}
            <section className="py-32 relative overflow-hidden bg-white dark:bg-slate-950">
                <div className="absolute inset-0 -z-10">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_20%_30%,var(--tw-gradient-stops))] from-sky-500/10 via-transparent to-transparent opacity-60" />
                </div>
                <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
                    <SectionHeading
                        badge="Capabilities"
                        title="Built for the Next Generation of Work"
                        subtitle="A comprehensive suite of AI-native tools designed to accelerate talent development and streamline organization management."
                    />
                </div>
            </section>

            {/* Feature Sections */}
            <section className="pb-32 bg-white dark:bg-slate-950">
                <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
                    <div className="space-y-40 md:space-y-64">
                        {featureCategories.map((feature, i) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.8, ease: [0, 0.5, 0.5, 1] }}
                                className={cn(
                                    "grid gap-16 lg:grid-cols-2 items-center",
                                    i % 2 === 1 ? "lg:flex-row-reverse" : ""
                                )}
                            >
                                <div className={cn("relative z-10", i % 2 === 1 ? "lg:order-2" : "")}>
                                    <div className={cn(
                                        "inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-linear-to-br text-white shadow-2xl mb-10 group-hover:scale-110 transition-transform duration-500",
                                        feature.color
                                    )}>
                                        <feature.icon className="h-8 w-8" />
                                    </div>
                                    <h3 className="text-4xl sm:text-5xl font-black text-foreground tracking-tighter mb-6 leading-none">
                                        {feature.title}
                                    </h3>
                                    <p className="text-xl text-muted-foreground mb-10 leading-relaxed font-medium">
                                        {feature.description}
                                    </p>
                                    <ul className="grid gap-4">
                                        {feature.details.map((detail, j) => (
                                            <motion.li
                                                key={j}
                                                initial={{ opacity: 0, x: -10 }}
                                                whileInView={{ opacity: 1, x: 0 }}
                                                viewport={{ once: true }}
                                                transition={{ delay: 0.2 + j * 0.05 }}
                                                className="flex items-center gap-4 text-muted-foreground font-semibold"
                                            >
                                                <div className={cn("h-2 w-2 rounded-full bg-linear-to-br shrink-0", feature.color)} />
                                                {detail}
                                            </motion.li>
                                        ))}
                                    </ul>
                                </div>
                                <div className={cn("relative", i % 2 === 1 ? "lg:order-1" : "")}>
                                    <motion.div
                                        whileHover={{ scale: 1.02, rotate: i % 2 === 0 ? 1 : -1 }}
                                        className="relative group transition-all duration-700"
                                    >
                                        <div className={cn("absolute inset-0 bg-linear-to-br opacity-20 rounded-5xl blur-3xl group-hover:opacity-30 transition-opacity", feature.color)} />
                                        <div className="relative aspect-video rounded-4xl bg-slate-100 dark:bg-slate-900 border-4 border-white dark:border-slate-800 shadow-2xl flex items-center justify-center overflow-hidden">
                                            <div className="absolute inset-0 bg-linear-to-br from-transparent to-black/5 dark:to-white/5" />
                                            <feature.icon className="h-24 w-24 text-slate-300 dark:text-slate-700 opacity-50 group-hover:scale-110 transition-transform duration-700" />
                                        </div>
                                    </motion.div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <CTASection
                title="Ready to Transform Your Program?"
                subtitle="Start using these powerful features today — completely free to get started."
            />
        </>
    );
}
