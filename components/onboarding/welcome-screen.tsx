"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { PartyPopper, ArrowRight, Sparkles, Building2 } from "lucide-react";
import { usePortalSettings } from "@/hooks/use-portal-settings";

interface WelcomeScreenProps {
    userName: string;
    onNext: () => void;
    isReturningUser?: boolean;
}

export function WelcomeScreen({ userName, onNext, isReturningUser = false }: WelcomeScreenProps) {
    const { settings } = usePortalSettings();
    const [isVisible, setIsVisible] = useState(true);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 1.1 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-background p-4 overflow-hidden"
                >
                    {/* Background Decorations */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px]"
                        />
                        <motion.div
                            animate={{ rotate: -360 }}
                            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                            className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[100px]"
                        />
                    </div>

                    <div className="relative z-10 max-w-2xl w-full text-center space-y-8">
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="flex justify-center"
                        >
                            <div className="bg-primary/10 p-4 rounded-3xl relative">
                                {settings.company_logo_url ? (
                                    <img
                                        src={settings.company_logo_url}
                                        alt={settings.company_name}
                                        className="w-16 h-16 object-cover rounded-2xl"
                                    />
                                ) : (
                                    <Building2 className="w-12 h-12 text-primary" />
                                )}
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 p-1.5 rounded-full shadow-lg"
                                >
                                    <Sparkles className="w-4 h-4" />
                                </motion.div>
                            </div>
                        </motion.div>

                        <div className="space-y-4">
                            <motion.h1
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="text-4xl md:text-5xl font-bold tracking-tight"
                            >
                                {isReturningUser ? "Welcome back to " : "Welcome to "}
                                <span className="text-primary">{settings.company_name || "InternHub"}</span>, <br />
                                <span className="bg-clip-text text-transparent bg-linear-to-r from-primary to-blue-600">
                                    {userName}
                                </span>!
                            </motion.h1>

                            <motion.p
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.6 }}
                                className="text-lg text-muted-foreground max-w-md mx-auto"
                            >
                                {isReturningUser
                                    ? "Consistency is key to excellence! We're proud of your progress—let's keep the momentum going today."
                                    : "We're excited to have you join our team. Let's get your portal set up and ready for success."}
                            </motion.p>
                        </div>

                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            className="pt-4"
                        >
                            <Button
                                size="lg"
                                className="h-14 px-10 text-lg rounded-2xl group transition-all hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]"
                                onClick={onNext}
                            >
                                {isReturningUser ? "Go to Dashboard" : "Begin Onboarding"}
                                <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                            </Button>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.2 }}
                            className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
                        >
                            <PartyPopper className="w-4 h-4 text-primary" />
                            <span>{isReturningUser ? "Keep up the great work!" : "It only takes 2 minutes"}</span>
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
