"use client";

import { useEffect, useState } from "react";
import { Changelog } from "@/lib/changelog/changelog-types";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ChevronRight, Zap, Bug, Rocket } from "lucide-react";
import { useRouter } from "next/navigation";

interface WhatsNewModalProps {
    changelog: Changelog | null;
    onClose: (version: string) => void;
}

export function WhatsNewModal({ changelog, onClose }: WhatsNewModalProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (changelog) {
            setOpen(true);
        }
    }, [changelog]);

    if (!changelog) return null;

    const handleClose = () => {
        setOpen(false);
        onClose(changelog.version);
    };

    const handleViewAll = () => {
        setOpen(false);
        onClose(changelog.version);
        router.push("/dashboard/updates");
    };

    return (
        <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden gap-0 border-none shadow-2xl">
                {/* Header Decoration */}
                <div className="h-32 bg-gradient-to-br from-primary via-primary/80 to-primary/40 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20 pointer-events-none">
                        <div className="absolute top-0 left-0 w-24 h-24 bg-white/20 rounded-full -translate-x-12 -translate-y-12" />
                        <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-16 translate-y-16" />
                    </div>
                    <div className="bg-white/20 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/20">
                        <Rocket className="h-10 w-10 text-white" />
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    <DialogHeader>
                        <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                                {changelog.version}
                            </Badge>
                            {changelog.is_major && (
                                <Badge variant="default" className="bg-amber-500 hover:bg-amber-600">
                                    Major Update
                                </Badge>
                            )}
                        </div>
                        <DialogTitle className="text-2xl font-bold">
                            Welcome to CPS Intern {changelog.version}
                        </DialogTitle>
                        <DialogDescription className="text-base text-balance line-clamp-2">
                            {changelog.title} — {changelog.description}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {changelog.features?.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center">
                                    <Zap className="h-3 w-3 mr-1.5 text-primary" /> Highlight Features
                                </h4>
                                <ul className="space-y-1.5">
                                    {changelog.features.slice(0, 3).map((f, i) => (
                                        <li key={i} className="flex items-start text-sm group">
                                            <ChevronRight className="h-4 w-4 mr-2 text-primary/40 mt-0.5 shrink-0 group-hover:text-primary transition-colors" />
                                            <span className="line-clamp-1">{f}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {changelog.fixes?.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center">
                                    <Bug className="h-3 w-3 mr-1.5 text-chart-1" /> Key Fixes
                                </h4>
                                <ul className="space-y-1.5">
                                    {changelog.fixes.slice(0, 2).map((f, i) => (
                                        <li key={i} className="flex items-start text-sm text-muted-foreground">
                                            <span className="mr-2 opacity-50">•</span>
                                            <span className="line-clamp-1 italic">{f}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="pt-2 sm:justify-between gap-3">
                        <Button variant="ghost" onClick={handleViewAll} className="flex-1 sm:flex-none">
                            Full Release Notes
                        </Button>
                        <Button onClick={handleClose} className="flex-1 sm:flex-none font-semibold px-8 shadow-lg shadow-primary/20">
                            Got it!
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
