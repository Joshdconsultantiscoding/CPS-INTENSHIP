"use client";

import { motion } from "framer-motion";
import { FileText, HelpCircle, BookOpen, Newspaper, ArrowRight } from "lucide-react";
import Link from "next/link";
import { SectionHeading, CTASection } from "@/components/marketing";

const resources = [
    {
        icon: Newspaper,
        title: "Blog",
        description: "Insights on internships, career development, and workforce trends.",
        href: "#",
        badge: "Coming Soon",
    },
    {
        icon: HelpCircle,
        title: "Help Center",
        description: "Find answers to common questions and get support.",
        href: "#",
        badge: "Coming Soon",
    },
    {
        icon: BookOpen,
        title: "Documentation",
        description: "Technical guides and API documentation for developers.",
        href: "#",
        badge: "Coming Soon",
    },
    {
        icon: FileText,
        title: "FAQ",
        description: "Quick answers to frequently asked questions.",
        href: "#",
        badge: null,
    },
];

const faqs = [
    {
        q: "What is CPS Intern?",
        a: "CPS Intern is an AI-powered workforce platform that connects interns, mentors, and companies. It provides tools for learning, task management, performance tracking, and hiring.",
    },
    {
        q: "Is CPS Intern free to use?",
        a: "Yes! We offer a free tier that includes core features for small teams. Upgrade to Pro or Enterprise for advanced features and larger teams.",
    },
    {
        q: "How do I get started as an intern?",
        a: "Sign up for a free account, complete your profile, and either join an organization or browse available programs. You'll start earning points and building your portfolio immediately.",
    },
    {
        q: "Can companies use CPS Intern for hiring?",
        a: "Absolutely. Companies can browse our talent marketplace, view verified performance data, and hire top-performing interns directly through the platform.",
    },
    {
        q: "Is my data secure?",
        a: "Yes. We use bank-grade encryption, role-based access controls, and follow industry best practices for data security and privacy.",
    },
];

export default function ResourcesPage() {
    return (
        <>
            {/* Hero */}
            <section className="py-24 relative overflow-hidden">
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-sky-500/5 via-transparent to-amber-500/5" />
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <SectionHeading
                        badge="Resources"
                        title="Learn & Get Help"
                        subtitle="Everything you need to succeed with CPS Intern."
                    />
                </div>
            </section>

            {/* Resource Cards */}
            <section className="pb-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        {resources.map((resource, i) => (
                            <motion.div
                                key={resource.title}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="group relative p-6 rounded-2xl bg-gradient-to-br from-background to-muted/30 border border-border/50 hover:border-amber-500/50 transition-all"
                            >
                                {resource.badge && (
                                    <span className="absolute top-4 right-4 px-2 py-1 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-full">
                                        {resource.badge}
                                    </span>
                                )}
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-sky-500/20 text-amber-600 dark:text-amber-400 mb-4">
                                    <resource.icon className="h-6 w-6" />
                                </div>
                                <h3 className="text-lg font-semibold text-foreground mb-2">{resource.title}</h3>
                                <p className="text-sm text-muted-foreground mb-4">{resource.description}</p>
                                <Link
                                    href={resource.href}
                                    className="inline-flex items-center text-sm font-medium text-amber-600 dark:text-amber-400 hover:underline"
                                >
                                    Learn more
                                    <ArrowRight className="ml-1 h-4 w-4" />
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-24 bg-muted/30">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                    <SectionHeading
                        title="Frequently Asked Questions"
                        subtitle="Quick answers to common questions."
                    />

                    <div className="mt-12 space-y-4">
                        {faqs.map((faq, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="p-6 rounded-xl bg-gradient-to-br from-background to-muted/30 border border-border/50"
                            >
                                <h3 className="font-semibold text-foreground mb-2">{faq.q}</h3>
                                <p className="text-muted-foreground text-sm">{faq.a}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <CTASection
                title="Still Have Questions?"
                subtitle="Our team is here to help. Reach out anytime."
                primaryLabel="Contact Us"
                primaryHref="/contact"
                secondaryLabel="Get Started"
                secondaryHref="/auth/sign-up"
            />
        </>
    );
}
