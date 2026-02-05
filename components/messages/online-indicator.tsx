"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface OnlineIndicatorProps {
    status: string;
    size?: "sm" | "md" | "lg";
}

export function OnlineIndicator({ status, size = "sm" }: OnlineIndicatorProps) {
    const sizeClass = size === "lg" ? "h-4 w-4" : size === "md" ? "h-3 w-3" : "h-2.5 w-2.5";
    const borderClass = size === "lg" ? "border-[3px]" : size === "md" ? "border-2" : "border-[1.5px]";

    if (status === "online") {
        return (
            <span
                className={cn(
                    "absolute bottom-0 right-0 rounded-full bg-green-500 border-background shadow-[0_0_0_1px] shadow-white dark:shadow-black animate-pulse",
                    sizeClass,
                    borderClass
                )}
            />
        );
    }
    if (status === "away") {
        return (
            <span
                className={cn(
                    "absolute bottom-0 right-0 rounded-full bg-yellow-500 border-background",
                    sizeClass,
                    borderClass
                )}
            />
        );
    }
    if (status === "offline") {
        return (
            <span
                className={cn(
                    "absolute bottom-0 right-0 rounded-full bg-slate-300 border-background",
                    sizeClass,
                    borderClass
                )}
            />
        );
    }
    return null;
}
