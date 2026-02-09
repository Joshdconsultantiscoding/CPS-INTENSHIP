"use client";

import { motion } from "framer-motion";
import { Target, Eye, Heart, Users } from "lucide-react";
import { SectionHeading, CTASection } from "@/components/marketing";

const values = [
    {
        icon: Target,
        title: "Mission",
        description: "To democratize access to quality internship experiences and empower the next generation of professionals with the skills, mentorship, and opportunities they need to succeed.",
    },
    {
        icon: Eye,
        title: "Vision",
        description: "A world where every aspiring professional has access to structured learning, real-world experience, and a clear path to meaningful employment — regardless of background.",
    },
    {
        icon: Heart,
        title: "Values",
        description: "Growth, transparency, and impact. We believe in continuous improvement, honest feedback, and measuring success by the careers we help launch.",
    },
];

const team = [
    { name: "Joshua A.", role: "Founder & CEO", initials: "JA" },
    { name: "CPS Team", role: "Development", initials: "CT" },
    { name: "AI Assistant", role: "Product Support", initials: "AI" },
];

export default function AboutPage() {
    return (
        <>
            {/* Hero */}
            <section className="py-24 relative overflow-hidden">
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-sky-500/5 via-transparent to-amber-500/5" />
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <SectionHeading
                        badge="About"
                        title="Building the Future of Work"
                        subtitle="CPS Intern started with a simple question: Why is it so hard for interns to get real experience and for companies to find prepared talent?"
                    />
                </div>
            </section>

            {/* Story */}
            <section className="pb-24">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="prose prose-gray dark:prose-invert max-w-none"
                    >
                        <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                            CPS Intern was born from the frustration of watching talented individuals struggle to find meaningful internship experiences, while companies complained about unprepared candidates.
                        </p>
                        <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                            We realized that the gap wasn't in talent or opportunity — it was in the system. Traditional internship programs lacked structure, accountability, and the tools to actually develop skills. So we built something different.
                        </p>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            Today, CPS Intern is an AI-powered workforce platform that connects interns, mentors, and companies in a seamless ecosystem designed for growth, performance, and hiring success.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Values */}
            <section className="py-24 bg-muted/30">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <SectionHeading
                        title="What Drives Us"
                        subtitle="Our guiding principles shape everything we build."
                    />

                    <div className="mt-16 grid gap-8 md:grid-cols-3">
                        {values.map((value, i) => (
                            <motion.div
                                key={value.title}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="text-center p-8 rounded-2xl bg-gradient-to-br from-background to-muted/30 border border-border/50"
                            >
                                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-amber-500 text-white shadow-lg mb-6">
                                    <value.icon className="h-7 w-7" />
                                </div>
                                <h3 className="text-xl font-semibold text-foreground mb-3">{value.title}</h3>
                                <p className="text-muted-foreground">{value.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Team */}
            <section className="py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <SectionHeading
                        badge="Team"
                        title="Meet the Team"
                        subtitle="The people behind CPS Intern."
                    />

                    <div className="mt-16 flex flex-wrap justify-center gap-8">
                        {team.map((member, i) => (
                            <motion.div
                                key={member.name}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="text-center"
                            >
                                <div className="flex h-24 w-24 mx-auto items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-amber-500 text-white text-2xl font-bold shadow-xl mb-4">
                                    {member.initials}
                                </div>
                                <h3 className="font-semibold text-foreground">{member.name}</h3>
                                <p className="text-sm text-muted-foreground">{member.role}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <CTASection
                title="Join Our Journey"
                subtitle="Be part of the movement to transform internship experiences worldwide."
            />
        </>
    );
}
