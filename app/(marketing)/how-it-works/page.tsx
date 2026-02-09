"use client";

import { SectionHeading, TimelineStep, CTASection } from "@/components/marketing";

const steps = [
    {
        step: 1,
        title: "Sign Up & Get Started",
        description: "Create your free account in under 60 seconds. No credit card required. Choose your role as an intern, mentor, or admin.",
    },
    {
        step: 2,
        title: "Join Your Team",
        description: "Get invited to your organization or browse available internship programs. Connect with mentors and peers.",
    },
    {
        step: 3,
        title: "Learn & Complete Tasks",
        description: "Access structured courses, receive task assignments, and build real-world skills. Track your progress in real-time.",
    },
    {
        step: 4,
        title: "Earn Rewards & Recognition",
        description: "Collect points for completed work, earn badges for achievements, and climb the leaderboard. Your efforts are recognized.",
    },
    {
        step: 5,
        title: "Get Hired",
        description: "Build a verified profile with skills, certifications, and performance data. Get discovered by hiring companies on our marketplace.",
    },
];

export default function HowItWorksPage() {
    return (
        <>
            {/* Hero */}
            <section className="py-32 relative overflow-hidden bg-white dark:bg-slate-950">
                <div className="absolute inset-x-0 -top-px h-px bg-linear-to-r from-transparent via-sky-500/20 to-transparent" />
                <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
                    <SectionHeading
                        badge="The Journey"
                        title="Your Path to Global Success"
                        subtitle="A structured, AI-guided roadmap from your first sign-up to landing your dream role at a top organization."
                    />
                </div>
            </section>

            {/* Timeline */}
            <section className="pb-32 bg-white dark:bg-slate-950">
                <div className="mx-auto max-w-4xl px-6 sm:px-8 lg:px-12">
                    <div className="relative">
                        {/* Vertical Line (Desktop) */}
                        <div className="hidden md:block absolute left-8 top-10 bottom-10 w-1 bg-linear-to-b from-sky-500/50 via-blue-500/50 to-emerald-500/50 rounded-full" />

                        <div className="space-y-12">
                            {steps.map((step, i) => (
                                <TimelineStep
                                    key={step.step}
                                    step={step.step}
                                    title={step.title}
                                    description={step.description}
                                    isLast={i === steps.length - 1}
                                    delay={i * 0.1}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <CTASection
                title="Ready to Start Your Journey?"
                subtitle="Join thousands of interns who've launched their careers with CPS Intern."
                primaryLabel="Create Free Account"
            />
        </>
    );
}
