"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface PricingSliderProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    unit?: string;
    onChange: (value: number) => void;
    icon?: React.ReactNode;
}

export function PricingSlider({
    label,
    value,
    min,
    max,
    step = 1,
    unit = "",
    onChange,
    icon,
}: PricingSliderProps) {
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center text-sm font-medium">
                <div className="flex items-center gap-2 text-foreground">
                    {icon && <span className="text-sky-500">{icon}</span>}
                    {label}
                </div>
                <div className="flex items-baseline gap-1 bg-muted/50 px-3 py-1 rounded-full border border-border/50">
                    <AnimatePresence mode="wait">
                        <motion.span
                            key={value}
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className="text-lg font-bold text-sky-600"
                        >
                            {value === max ? `${value}+` : value}
                        </motion.span>
                    </AnimatePresence>
                    <span className="text-xs text-muted-foreground uppercase">{unit}</span>
                </div>
            </div>
            <SliderPrimitive.Root
                className="relative flex items-center select-none touch-none w-full h-5"
                value={[value]}
                max={max}
                min={min}
                step={step}
                onValueChange={(vals) => onChange(vals[0])}
            >
                <SliderPrimitive.Track className="bg-muted relative grow rounded-full h-[6px]">
                    <SliderPrimitive.Range className="absolute bg-linear-to-r from-sky-500 to-sky-600 rounded-full h-full" />
                </SliderPrimitive.Track>
                <SliderPrimitive.Thumb
                    className="block w-5 h-5 bg-white border-2 border-sky-500 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-transform focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                    aria-label={label}
                />
            </SliderPrimitive.Root>
            <div className="flex justify-between text-[10px] text-muted-foreground px-1 uppercase tracking-wider">
                <span>{min} {unit}</span>
                <span>{max}+ {unit}</span>
            </div>
        </div>
    );
}
