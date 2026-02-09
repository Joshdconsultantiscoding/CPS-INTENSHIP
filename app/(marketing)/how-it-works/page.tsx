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
            <section className="py-24 relative overflow-hidden">
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-sky-500/5 via-transparent to-amber-500/5" />
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <SectionHeading
                        badge="How It Works"
                        title="From Sign Up to Hired"
                        subtitle="A clear path from your first day to your dream job. Here's how CPS Intern makes it happen."
                    />
                </div>
            </section>

            {/* Timeline */}
            <section className="pb-24">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                    <div className="space-y-0">
                        {steps.map((step, i) => (
                            <TimelineStep
                                key={step.step}
                                step={step.step}
                                title={step.title}
                                description={step.description}
                                isLast={i === steps.length - 1}
                                delay={i * 0.15}
                            />
                        ))}
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
