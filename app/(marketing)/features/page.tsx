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
            <section className="py-24 relative overflow-hidden">
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-sky-500/5 via-transparent to-amber-500/5" />
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <SectionHeading
                        badge="Features"
                        title="Powerful Features for Modern Teams"
                        subtitle="Everything you need to run a world-class internship program, powered by AI and built for scale."
                    />
                </div>
            </section>

            {/* Feature Sections */}
            <section className="pb-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="space-y-24">
                        {featureCategories.map((feature, i) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.1 }}
                                className={`grid gap-12 lg:grid-cols-2 items-center ${i % 2 === 1 ? "lg:flex-row-reverse" : ""}`}
                            >
                                <div className={i % 2 === 1 ? "lg:order-2" : ""}>
                                    <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.color} text-white shadow-lg mb-6`}>
                                        <feature.icon className="h-7 w-7" />
                                    </div>
                                    <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
                                        {feature.title}
                                    </h3>
                                    <p className="text-lg text-muted-foreground mb-6">
                                        {feature.description}
                                    </p>
                                    <ul className="space-y-3">
                                        {feature.details.map((detail, j) => (
                                            <motion.li
                                                key={j}
                                                initial={{ opacity: 0, x: -20 }}
                                                whileInView={{ opacity: 1, x: 0 }}
                                                viewport={{ once: true }}
                                                transition={{ delay: j * 0.1 }}
                                                className="flex items-center gap-3 text-muted-foreground"
                                            >
                                                <div className={`h-2 w-2 rounded-full bg-gradient-to-br ${feature.color}`} />
                                                {detail}
                                            </motion.li>
                                        ))}
                                    </ul>
                                </div>
                                <div className={i % 2 === 1 ? "lg:order-1" : ""}>
                                    <div className="relative">
                                        <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} rounded-3xl blur-2xl opacity-20`} />
                                        <div className="relative aspect-video rounded-2xl bg-gradient-to-br from-muted to-muted/50 border border-border/50 flex items-center justify-center">
                                            <feature.icon className="h-20 w-20 text-muted-foreground/30" />
                                        </div>
                                    </div>
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
