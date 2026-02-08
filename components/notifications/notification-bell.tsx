"use client";

import React, { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/components/ui/popover";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { useNotifications } from "./notification-engine";
import { NotificationPanel } from "./notification-panel";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/components/ui/use-mobile";

export function NotificationBell() {
    const { unreadCount } = useNotifications();
    const [open, setOpen] = useState(false);
    const isMobile = useIsMobile();

    const NotificationTrigger = (
        <Button
            variant="ghost"
            size="icon"
            className="relative rounded-full h-9 w-9 bg-primary/5 hover:bg-primary/10 border border-primary/10"
        >
            <Bell className={cn(
                "h-[1.1rem] w-[1.1rem] transition-all",
                unreadCount > 0 ? "text-primary animate-pulse" : "text-muted-foreground"
            )} />

            <AnimatePresence>
                {unreadCount > 0 && (
                    <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center border-2 border-background shadow-sm"
                    >
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                )}
            </AnimatePresence>
        </Button>
    );

    if (isMobile) {
        return (
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    {NotificationTrigger}
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:w-[400px] p-0 flex flex-col h-full z-100">
                    <div className="sr-only">
                        <SheetTitle>Notifications</SheetTitle>
                    </div>
                    <NotificationPanel onClose={() => setOpen(false)} className="h-full border-none shadow-none" hideHeaderCloseButton={true} isMobile={true} />
                </SheetContent>
            </Sheet>
        );
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                {NotificationTrigger}
            </PopoverTrigger>
            <PopoverContent
                className="w-80 md:w-[420px] p-0 mr-4 mt-2 shadow-2xl border-primary/10 max-h-[85vh] flex flex-col"
                align="end"
                sideOffset={8}
            >
                <NotificationPanel onClose={() => setOpen(false)} isMobile={false} />
            </PopoverContent>
        </Popover>
    );
}
