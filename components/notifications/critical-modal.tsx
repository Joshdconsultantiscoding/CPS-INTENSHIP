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
        setIsAcknowledging(true);
        try {
            await onAcknowledge(notification.id);
        } finally {
            setIsAcknowledging(false);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-9999 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            // Cannot be closed by clicking outside
            >
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ type: "spring", damping: 20 }}
                    className="relative w-full max-w-lg mx-4 overflow-hidden rounded-2xl bg-linear-to-br from-red-600 to-red-800 p-1 shadow-2xl"
                >
                    <div className="rounded-xl bg-white dark:bg-gray-900 p-6">
                        {/* Pulsing alert icon header */}
                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="relative mb-4">
                                <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-25" />
                                <div className="relative h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                    <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
                                </div>
                            </div>

                            <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
                                ⚠️ CRITICAL ALERT
                            </h2>

                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                {notification.title}
                            </h3>
                        </div>

                        {/* Message body */}
                        <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
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
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 text-lg shadow-lg"
                            >
                                {isAcknowledging ? (
                                    <>
                                        <span className="animate-spin mr-2">⏳</span>
                                        Acknowledging...
                                    </>
                                ) : (
                                    <>
                                        ✓ I ACKNOWLEDGE THIS ALERT
                                    </>
                                )}
                            </Button>

                            {notification.link && (
                                <p className="text-center text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
                                    <ExternalLink className="h-3 w-3" />
                                    You will be redirected after acknowledging
                                </p>
                            )}
                        </div>

                        {/* Warning footer */}
                        <p className="mt-4 text-center text-xs text-red-500 dark:text-red-400 font-medium">
                            This notification cannot be dismissed without acknowledgment
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
