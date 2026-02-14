"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Notification } from "@/lib/notifications/notification-types";

interface CriticalNotificationModalProps {
    notification: Notification | null;
    onAcknowledge: (id: string) => Promise<void>;
}

export function CriticalNotificationModal({ notification, onAcknowledge }: CriticalNotificationModalProps) {
    const [isAcknowledging, setIsAcknowledging] = React.useState(false);

    if (!notification) return null;

    const handleAcknowledge = async () => {
        if (isAcknowledging) return;

        console.log("[CriticalModal] Acknowledge CLICKED for:", notification.id);
        setIsAcknowledging(true);

        try {
            // Give it 100ms for UI to feel the "press" then trigger callback
            // which in turn triggers optimistic dismissal in engine
            await onAcknowledge(notification.id);
            console.log("[CriticalModal] Acknowledge callback finished SUCCESS");
        } catch (e) {
            console.error("[CriticalModal] Acknowledge callback ERROR:", e);
        } finally {
            // Safety: even if callback hangs, we might want to close if the engine cleared it
            // but normally the engine clearing it will cause this component to unmount.
            console.log("[CriticalModal] Acknowledge interaction COMPLETE");
            // Don't setIsAcknowledging(false) if we are about to redirect/unmount
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md"
                aria-modal="true"
                role="dialog"
            // Cannot be closed by clicking outside
            >
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ type: "spring", damping: 20 }}
                    className="relative w-full max-w-lg mx-4 overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 to-red-800 p-1 shadow-[0_0_50px_rgba(220,38,38,0.5)]"
                >
                    <div className="rounded-xl bg-white dark:bg-gray-900 p-6 overflow-hidden">
                        {/* Pulsing alert icon header */}
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="relative mb-4">
                                <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-25" />
                                <div className="relative h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                    <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
                                </div>
                            </div>

                            <h2 className="text-2xl font-bold font-heading text-red-600 dark:text-red-400 mb-2 tracking-tight">
                                ⚠️ CRITICAL ALERT
                            </h2>

                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white line-clamp-2">
                                {notification.title}
                            </h3>
                        </div>

                        {/* Message body */}
                        <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 max-h-[200px] overflow-y-auto">
                            <p className="text-gray-800 dark:text-gray-200 text-center leading-relaxed">
                                {notification.message}
                            </p>
                        </div>

                        {/* Acknowledge button - ONLY way to close */}
                        <div className="flex flex-col gap-3">
                            <Button
                                size="lg"
                                onClick={handleAcknowledge}
                                disabled={isAcknowledging}
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-6 text-xl shadow-xl transition-all active:scale-95 disabled:opacity-50"
                            >
                                {isAcknowledging ? (
                                    <>
                                        <span className="animate-spin mr-3 font-mono">⏳</span>
                                        PROCESSING...
                                    </>
                                ) : (
                                    <>
                                        ✓ I ACKNOWLEDGE THIS ALERT
                                    </>
                                )}
                            </Button>

                            {notification.link && (
                                <p className="text-center text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
                                    <ExternalLink className="h-4 w-4" />
                                    Redirecting to {notification.link === '/suspended' ? 'Appeal Center' : 'safe area'}
                                </p>
                            )}
                        </div>

                        {/* Warning footer */}
                        <p className="mt-6 text-center text-xs text-red-500 dark:text-red-400 font-bold uppercase tracking-wider opacity-80">
                            REQUIRED ACTION: MUST ACKNOWLEDGE TO PROCEED
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

