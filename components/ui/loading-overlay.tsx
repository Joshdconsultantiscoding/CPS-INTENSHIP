"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useLoading } from "@/hooks/use-loading";

const quotes = [
    "Consistency is the bridge between goals and accomplishment.",
    "Discipline is choosing between what you want now and what you want most.",
    "Perfection is not attainable, but if we chase perfection we can catch excellence.",
    "Consistency transforms average into excellence. Every day counts.",
    "Discipline is the soul of an army; it makes small numbers formidable.",
    "Excellence is not a singular act, but a habit. You are what you repeatedly do.",
    "True perfection is a journey of relentless discipline and unwavering consistency.",
    "Without discipline, success is an accident. With consistency, it's inevitable.",
    "Commitment is doing what you said you would do, long after the mood has left you.",
    "Trust is the fruit of a relationship built on consistency and truth.",
    "Consistency is the currency of mastery. Spend it wisely every single day.",
    "Self-discipline is the only power which can conquer the most dangerous obstacles.",
    "Mastery is the result of a thousand small disciplines performed consistently.",
    "Perfection is the child of time and the offspring of relentless discipline.",
];

export function LoadingOverlay() {
    const { isLoading } = useLoading();
    const [quoteIndex, setQuoteIndex] = useState(0);

    useEffect(() => {
        if (!isLoading) return;

        const interval = setInterval(() => {
            setQuoteIndex((prev) => (prev + 1) % quotes.length);
        }, 3000);

        return () => clearInterval(interval);
    }, [isLoading]);

    return (
        <AnimatePresence>
            {isLoading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="fixed inset-0 z-100 flex flex-col items-center justify-center bg-white/90 dark:bg-zinc-950/80 backdrop-blur-xl"
                >
                    <div className="relative flex flex-col items-center max-w-md px-8 text-center space-y-12">
                        {/* Animated Logo Container */}
                        <motion.div
                            initial={{ scale: 0.8, y: 20, opacity: 0 }}
                            animate={{
                                scale: [0.95, 1.05, 0.95],
                                y: [0, -15, 0],
                                opacity: 1
                            }}
                            transition={{
                                opacity: { duration: 0.8 },
                                y: { repeat: Infinity, duration: 4, ease: "easeInOut" },
                                scale: { repeat: Infinity, duration: 4, ease: "easeInOut" }
                            }}
                            className="relative w-32 h-32 md:w-40 md:h-40"
                        >
                            <div className="absolute inset-0 bg-emerald-500/10 dark:bg-emerald-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
                            <Image
                                src="/logo.png"
                                alt="Logo"
                                fill
                                className="object-contain drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                                priority
                            />
                        </motion.div>

                        {/* Quotes Engine */}
                        <div className="h-20 flex items-center justify-center">
                            <AnimatePresence mode="wait">
                                <motion.p
                                    key={quoteIndex}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 1.05 }}
                                    transition={{ duration: 0.4, ease: "easeOut" }}
                                    className="text-lg md:text-xl font-medium text-zinc-800 dark:text-zinc-200 leading-relaxed italic"
                                >
                                    "{quotes[quoteIndex]}"
                                </motion.p>
                            </AnimatePresence>
                        </div>

                        {/* Loading Indicator */}
                        <div className="flex flex-col items-center space-y-4">
                            <div className="flex space-x-2">
                                {[0, 1, 2].map((i) => (
                                    <motion.div
                                        key={i}
                                        animate={{
                                            scale: [1, 1.5, 1],
                                            opacity: [0.3, 1, 0.3],
                                        }}
                                        transition={{
                                            repeat: Infinity,
                                            duration: 1.5,
                                            delay: i * 0.2,
                                        }}
                                        className="w-2 h-2 bg-emerald-500 rounded-full"
                                    />
                                ))}
                            </div>
                            <span className="text-xs uppercase tracking-[0.3em] font-bold text-emerald-500/80">
                                Syncing Excellence
                            </span>
                        </div>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute top-0 left-0 w-full h-1 overflow-hidden">
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: "100%" }}
                            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                            className="w-1/2 h-full bg-linear-to-r from-transparent via-emerald-500 to-transparent"
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
