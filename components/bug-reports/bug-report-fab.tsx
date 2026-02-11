"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bug, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BugReportDialog } from "./bug-report-dialog";
import { motion, AnimatePresence } from "framer-motion";

export function BugReportFab({ userId, role }: { userId: string, role: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMessage, setCurrentMessage] = useState<string | null>(null);
    const [isVisible, setIsVisible] = useState(true);
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);

    // Long-press-to-dismiss handlers
    const handlePointerDown = useCallback(() => {
        longPressTimer.current = setTimeout(() => {
            setIsVisible(false);
        }, 800);
    }, []);

    const handlePointerUp = useCallback(() => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    }, []);

    const isAdmin = role === 'admin';

    const messages = [
        "Please share your experience? Do you think there are anything the admins or management should fix or add to make the site more user friendly?",
        "Do you encounter any issue using our site?, due to technical error, glitch or 404 bad page loading?",
        "Hope your satisfied if not share your issue using the site with us?",
        "Is your learning smooth, if its not and its a technical problem, page dormant, none clickable buttons? can you share them with us to help you fix?"
    ];

    // Listen for custom event or hash for sidebar triggers
    useEffect(() => {
        const handleOpen = () => {
            setIsVisible(true);
            setIsOpen(true);
        };

        const handleHashChange = () => {
            if (window.location.hash === '#feedback') {
                handleOpen();
                window.history.replaceState(null, '', window.location.pathname + window.location.search);
            }
        };

        // Standard hash check
        handleHashChange();
        window.addEventListener('hashchange', handleHashChange);

        // Custom event check (Robust instant trigger)
        window.addEventListener('open-bug-report', handleOpen);

        return () => {
            window.removeEventListener('hashchange', handleHashChange);
            window.removeEventListener('open-bug-report', handleOpen);
        };
    }, []);

    // auto-hide logic: only if dialog is CLOSED
    useEffect(() => {
        if (!isVisible || isOpen) return;

        const timer = setTimeout(() => {
            setIsVisible(false);
        }, 30000); // 30 seconds

        return () => clearTimeout(timer);
    }, [isVisible, isOpen]);

    // Engagement logic
    useEffect(() => {
        const check = () => {
            const now = new Date();
            const stored = localStorage.getItem('bug-report-engagement');
            let data = stored ? JSON.parse(stored) : { date: '', count: 0, lastShown: 0 };

            if (data.date !== now.toDateString()) {
                data = { date: now.toDateString(), count: 0, lastShown: 0 };
            }

            if (data.count < 3 && (now.getTime() - data.lastShown) > 3600000 * 4) {
                const msg = messages[data.count % messages.length];
                setCurrentMessage(msg);
                setIsVisible(true);

                data.count += 1;
                data.lastShown = now.getTime();
                localStorage.setItem('bug-report-engagement', JSON.stringify(data));

                setTimeout(() => setCurrentMessage(null), 30000);
            }
        };

        check();
        const intv = setInterval(check, 60000 * 5); // Check every 5 mins
        return () => clearInterval(intv);
    }, []);

    return (
        <div className="bug-report-system">
            {!isAdmin && (
                <div className="fixed bottom-20 md:bottom-6 right-6 z-60 flex flex-col items-end gap-3 pointer-events-none" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)', paddingRight: 'env(safe-area-inset-right, 0px)' }} role="complementary" aria-label="Feedback">
                    <AnimatePresence>
                        {(isVisible || isOpen) && currentMessage && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                                className="bg-emerald-600 text-white p-4 rounded-2xl rounded-br-none shadow-2xl max-w-[280px] text-sm font-medium leading-tight border border-emerald-400/30 pointer-events-auto relative mb-2"
                            >
                                {currentMessage}
                                <div className="absolute -bottom-2 right-0 w-4 h-4 bg-emerald-600 rotate-45 rounded-sm" />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {(isVisible || isOpen) && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="flex flex-col items-end gap-2 group"
                            >
                                <button
                                    onClick={() => setIsVisible(false)}
                                    className="p-1.5 bg-zinc-800/90 hover:bg-zinc-700 text-zinc-400 rounded-full opacity-0 group-hover:opacity-100 transition-all pointer-events-auto border border-white/10 shadow-lg flex items-center gap-2 px-3 mb-1"
                                    title="Dismiss Feedback Icon"
                                >
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Hide</span>
                                    <X className="h-3 w-3" />
                                </button>

                                <motion.div
                                    animate={currentMessage ? {
                                        scale: [1, 1.1, 1],
                                        rotate: [0, 10, -10, 0]
                                    } : {}}
                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                    className="pointer-events-auto"
                                >
                                    <Button
                                        variant="destructive"
                                        size="icon"
                                        className="h-14 w-14 rounded-full shadow-[0_0_20px_rgba(239,68,68,0.3)] bg-red-600 hover:bg-red-500 ring-4 ring-white/10 relative"
                                        onClick={() => setIsOpen(true)}
                                        onPointerDown={handlePointerDown}
                                        onPointerUp={handlePointerUp}
                                        onPointerLeave={handlePointerUp}
                                        title="Send Feedback (long-press to dismiss)"
                                        aria-label="Send feedback or report a bug"
                                    >
                                        <Bug className="h-7 w-7" />

                                        <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span>
                                        </span>
                                    </Button>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            <BugReportDialog
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                userId={userId}
            />
        </div>
    );
}
