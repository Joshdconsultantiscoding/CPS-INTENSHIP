"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface TermsModalProps {
    userId: string;
    onAccepted: () => void;
}

export function TermsModal({ userId, onAccepted }: TermsModalProps) {
    const [accepted, setAccepted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasReadToBottom, setHasReadToBottom] = useState(false);
    const contentRef = React.useRef<HTMLDivElement>(null);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        // Check if scrolled to bottom (with small buffer)
        if (scrollHeight - scrollTop - clientHeight < 50) {
            setHasReadToBottom(true);
        }
    };

    const handleAccept = async () => {
        if (!accepted || !hasReadToBottom) return;
        if (!userId) {
            toast.error("User ID not found. Please refresh the page.");
            return;
        }

        setIsSubmitting(true);
        try {
            const supabase = createClient();
            console.log("Saving terms for user:", userId);

            const { error: dbError } = await supabase
                .from("terms_acceptances")
                .upsert({ user_id: userId, version: "1.0", accepted_at: new Date().toISOString() });

            if (dbError) {
                console.error("Supabase Terms Error Details:", {
                    message: dbError.message,
                    code: dbError.code,
                    details: dbError.details,
                    hint: dbError.hint
                });
                throw new Error(dbError.message || "Failed to save to database");
            }

            toast.success("Terms accepted. Welcome!");
            onAccepted();
        } catch (error: any) {
            console.error("Catch block error:", error);
            toast.error(`Failed to save acceptance: ${error.message || "Unknown error"}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={true}>
            <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col gap-0 p-0 overflow-hidden" onPointerDownOutside={(e) => e.preventDefault()}>
                <div className="p-6 pb-4">
                    <DialogHeader>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="bg-primary/10 p-2 rounded-full">
                                <ShieldCheck className="w-6 h-6 text-primary" />
                            </div>
                            <DialogTitle className="text-2xl">Terms of Service</DialogTitle>
                        </div>
                        <DialogDescription>
                            Please review and accept our terms and conditions to continue using the InternHub platform.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div
                    className="flex-1 px-6 py-4 border-y bg-muted/30 overflow-y-auto"
                    onScroll={handleScroll}
                    ref={contentRef}
                >
                    <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                        <section>
                            <h3 className="font-semibold text-foreground mb-2">1. Usage Policy</h3>
                            <p>By using InternHub, you agree to submit accurate daily reports, complete assigned tasks by their deadlines, and maintain professional communication with your team leads and administrators.</p>
                        </section>

                        <section>
                            <h3 className="font-semibold text-foreground mb-2">2. Confidentiality</h3>
                            <p>All project data, client information, and internal communications are strictly confidential. Sharing any platform data outside of the organization is strictly prohibited.</p>
                        </section>

                        <section>
                            <h3 className="font-semibold text-foreground mb-2">3. Performance Tracking</h3>
                            <p>You acknowledge that your activity, task completion rates, and report quality will be tracked and used to calculate your performance scores and rewards.</p>
                        </section>

                        <section>
                            <h3 className="font-semibold text-foreground mb-2">4. AI Assistant Usage</h3>
                            <p>The AI Assistant is provided for guidance and learning purposes. While highly capable, it is not a substitute for official management instructions.</p>
                        </section>

                        <section>
                            <h3 className="font-semibold text-foreground mb-2">5. Data Privacy</h3>
                            <p>Your profile data and activity logs are stored securely. We use this data solely for managing the internship program and improving platform experience.</p>
                        </section>

                        <div className="h-4" /> {/* Spacer at bottom */}
                    </div>
                </div>

                <div className="p-6 space-y-4 bg-background">
                    <div className="flex items-start space-x-3">
                        <Checkbox
                            id="terms"
                            checked={accepted}
                            onCheckedChange={(checked) => setAccepted(checked === true)}
                            disabled={!hasReadToBottom}
                            className="mt-1"
                        />
                        <div className="grid gap-1.5 leading-none">
                            <Label
                                htmlFor="terms"
                                className={`text-sm font-medium leading-none cursor-pointer ${!hasReadToBottom ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                I have read and agree to the terms and conditions
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                {!hasReadToBottom
                                    ? "Please scroll to the end of the terms to enable acceptance."
                                    : "By ticking this, you commit to professional standards within the program."}
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="flex sm:justify-end gap-2 pt-2">
                        <Button
                            className="w-full sm:w-auto px-8"
                            disabled={!accepted || isSubmitting || !hasReadToBottom}
                            onClick={handleAccept}
                        >
                            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Accept and Continue
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
