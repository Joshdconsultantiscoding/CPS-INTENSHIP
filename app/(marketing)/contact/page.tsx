"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/marketing";

const contactMethods = [
    {
        icon: Mail,
        label: "Email",
        value: "cospronos@gmail.com",
        href: "mailto:cospronos@gmail.com",
    },
    {
        icon: MessageCircle,
        label: "WhatsApp",
        value: "+234 915 831 1526",
        href: "https://wa.me/2349158311526",
    },
    {
        icon: MapPin,
        label: "Location",
        value: "Lagos, Nigeria",
        href: null,
    },
];

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        // Simulate form submission
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setSubmitted(true);
        setIsSubmitting(false);
    };

    return (
        <>
            {/* Hero */}
            <section className="py-24 relative overflow-hidden">
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-sky-500/5 via-transparent to-amber-500/5" />
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <SectionHeading
                        badge="Contact"
                        title="Get in Touch"
                        subtitle="Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible."
                    />
                </div>
            </section>

            {/* Contact Section */}
            <section className="pb-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12">
                        {/* Contact Info */}
                        <div>
                            <h2 className="text-2xl font-bold text-foreground mb-6">Contact Information</h2>
                            <p className="text-muted-foreground mb-8">
                                Reach out through any of these channels. We typically respond within 24 hours.
                            </p>

                            <div className="space-y-6">
                                {contactMethods.map((method, i) => (
                                    <motion.div
                                        key={method.label}
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.1 }}
                                        className="flex items-center gap-4"
                                    >
                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/20 to-amber-500/20 text-sky-600 dark:text-sky-400">
                                            <method.icon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground">{method.label}</div>
                                            {method.href ? (
                                                <a
                                                    href={method.href}
                                                    className="font-medium text-foreground hover:text-amber-600 transition-colors"
                                                    target={method.href.startsWith("http") ? "_blank" : undefined}
                                                    rel={method.href.startsWith("http") ? "noopener noreferrer" : undefined}
                                                >
                                                    {method.value}
                                                </a>
                                            ) : (
                                                <span className="font-medium text-foreground">{method.value}</span>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Social Links */}
                            <div className="mt-12">
                                <h3 className="font-semibold text-foreground mb-4">Follow Us</h3>
                                <div className="flex gap-3">
                                    {["Twitter", "LinkedIn", "GitHub"].map((social) => (
                                        <a
                                            key={social}
                                            href="#"
                                            className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                                        >
                                            {social.charAt(0)}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="p-8 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50"
                        >
                            {submitted ? (
                                <div className="text-center py-12">
                                    <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500 mb-4">
                                        <Send className="h-8 w-8" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-foreground mb-2">Message Sent!</h3>
                                    <p className="text-muted-foreground">
                                        Thanks for reaching out. We'll get back to you soon.
                                    </p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                                            Name
                                        </label>
                                        <input
                                            type="text"
                                            id="name"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-background border border-border/50 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors"
                                            placeholder="Your name"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            id="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-background border border-border/50 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors"
                                            placeholder="you@example.com"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-2">
                                            Subject
                                        </label>
                                        <input
                                            type="text"
                                            id="subject"
                                            required
                                            value={formData.subject}
                                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-background border border-border/50 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors"
                                            placeholder="How can we help?"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                                            Message
                                        </label>
                                        <textarea
                                            id="message"
                                            required
                                            rows={4}
                                            value={formData.message}
                                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-background border border-border/50 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors resize-none"
                                            placeholder="Tell us more..."
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg shadow-amber-500/25"
                                    >
                                        {isSubmitting ? "Sending..." : "Send Message"}
                                        <Send className="ml-2 h-4 w-4" />
                                    </Button>
                                </form>
                            )}
                        </motion.div>
                    </div>
                </div>
            </section>
        </>
    );
}
