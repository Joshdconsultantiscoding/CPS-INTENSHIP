"use client";

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";

const FAQS = [
    {
        question: "What happens when I exceed my plan limits?",
        answer: "Initially, we'll notify you when you reach 80% and 100% of your limits. If you exceed them, we provide a grace period of 7 days before restriction, giving you time to upgrade or adjust usage.",
    },
    {
        question: "How do I upgrade or downgrade my plan?",
        answer: "You can change your plan anytime through the Admin Dashboard under 'Subscriptions'. Upgrades are effective immediately (pro-rated), while downgrades take effect at the end of the current billing cycle.",
    },
    {
        question: "Do you offer custom pricing for non-profits?",
        answer: "Yes! We support educational institutions and non-profit organizations with a dedicated discount. Contact our sales team with your organization's details to apply.",
    },
    {
        question: "Can I cancel my subscription anytime?",
        answer: "Absolutely. There are no lock-in contracts for our monthly plans. If you cancel, you'll retain access to your paid features until the end of your current billing period.",
    },
    {
        question: "What kind of support is included in each plan?",
        answer: "All plans include access to our documentation and community forums. Paid plans receive priority email support, while Growth and Enterprise tiers include dedicated account management and 24/7 support channels.",
    },
];

export function PricingFAQ() {
    return (
        <section className="py-24 max-w-3xl mx-auto px-4">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
                    Frequently Asked Questions
                </h2>
                <p className="mt-4 text-muted-foreground text-lg">
                    Everything you need to know about our pricing and plans.
                </p>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
            >
                <Accordion type="single" collapsible className="w-full">
                    {FAQS.map((faq, i) => (
                        <AccordionItem key={i} value={`faq-${i}`} className="border-b border-border/50 py-2">
                            <AccordionTrigger className="text-left font-semibold hover:text-sky-600 transition-colors">
                                {faq.question}
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground leading-relaxed">
                                {faq.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </motion.div>
        </section>
    );
}
