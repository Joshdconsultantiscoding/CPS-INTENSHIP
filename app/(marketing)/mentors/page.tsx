"use client";

import { motion } from "framer-motion";
import { UserCheck, Clock, Bell, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/marketing";

const upcomingFeatures = [
    "One-on-one mentorship matching",
    "Video mentoring sessions",
    "Progress review workflows",
    "Mentor reputation system",
    "Feedback and coaching tools",
    "Session scheduling",
];

export default function MentorsPage() {
    return (
        <>
            {/* Hero */}
            <section className="py-24 relative overflow-hidden">
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5" />
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-2xl shadow-blue-500/30 mb-8"
                    >
                        <UserCheck className="h-10 w-10" />
                    </motion.div>
                    <SectionHeading
                        badge="Coming Soon"
                        title="Mentor Marketplace"
                        subtitle="Connect experienced professionals with aspiring interns. Guide the next generation of talent."
                    />
                </div>
            </section>

            {/* Features Preview */}
            <section className="pb-24">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="p-8 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <Clock className="h-5 w-5 text-blue-500" />
                            <span className="font-semibold text-foreground">Coming Q2 2026</span>
                        </div>
                        <h3 className="text-xl font-semibold text-foreground mb-4">What to Expect</h3>
                        <ul className="space-y-3 mb-8">
                            {upcomingFeatures.map((feature, i) => (
                                <motion.li
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex items-center gap-3 text-muted-foreground"
                                >
                                    <div className="h-2 w-2 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500" />
                                    {feature}
                                </motion.li>
                            ))}
                        </ul>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button asChild className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700">
                                <Link href="/contact">
                                    <Bell className="mr-2 h-4 w-4" />
                                    Join Waitlist
                                </Link>
                            </Button>
                            <Button asChild variant="outline">
                                <Link href="/">
                                    Back to Home
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </section>
        </>
    );
}
