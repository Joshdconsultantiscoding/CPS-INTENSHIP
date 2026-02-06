"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Sparkles,
    Code2,
    Megaphone,
    Video,
    Palette,
    Music,
    BookOpen,
    ChevronRight,
    Loader2
} from "lucide-react";
import { getNiches, joinNiche, type Niche } from "@/app/actions/community";
import { toast } from "sonner";
import { motion } from "framer-motion";

const iconMap: Record<string, any> = {
    Sparkles,
    Code2,
    Megaphone,
    Video,
    Palette,
    Music,
    BookOpen
};

interface NicheSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (niche: Niche) => void;
}

export function NicheSelector({ isOpen, onClose, onSelect }: NicheSelectorProps) {
    const [niches, setNiches] = useState<Niche[]>([]);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadNiches();
        }
    }, [isOpen]);

    const loadNiches = async () => {
        setLoading(true);
        const res = await getNiches();
        if (res.success) {
            setNiches(res.niches);
        } else {
            toast.error("Failed to load communities");
        }
        setLoading(false);
    };

    const handleJoin = async (niche: Niche) => {
        setJoining(niche.id);
        const res = await joinNiche(niche.id);
        if (res.success) {
            toast.success(`Joined ${niche.name}`);
            onSelect(niche);
            onClose();
        } else {
            toast.error(res.error || "Failed to join");
        }
        setJoining(null);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-zinc-950 border-zinc-800 text-white">
                <div className="p-6 pb-0">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
                            Choose Your Community
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400 pt-1">
                            Select a niche to connect with fellow interns sharing your interests.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3 text-zinc-500">
                            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                            <p className="text-sm font-medium">Discovering communities...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
                            {niches.map((niche, idx) => {
                                const Icon = iconMap[niche.icon || ""] || Sparkles;
                                return (
                                    <motion.button
                                        key={niche.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        onClick={() => handleJoin(niche)}
                                        disabled={joining !== null}
                                        className="group relative flex items-center gap-4 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:bg-zinc-800/80 hover:border-emerald-500/50 transition-all text-left disabled:opacity-50"
                                    >
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-zinc-800 group-hover:bg-emerald-500/10 transition-colors">
                                            <Icon className="h-6 w-6 text-zinc-400 group-hover:text-emerald-400 transition-colors" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-zinc-100 group-hover:text-white transition-colors">
                                                {niche.name}
                                            </h4>
                                            <p className="text-xs text-zinc-500 line-clamp-1 group-hover:text-zinc-400 transition-colors">
                                                {niche.description}
                                            </p>
                                        </div>
                                        <div className="shrink-0 flex items-center text-zinc-600 group-hover:text-emerald-500 transition-all transform group-hover:translate-x-1">
                                            {joining === niche.id ? (
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                            ) : (
                                                <ChevronRight className="h-5 w-5" />
                                            )}
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="p-4 bg-zinc-900/50 border-t border-zinc-800/50 flex justify-end">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                    >
                        Maybe Later
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
