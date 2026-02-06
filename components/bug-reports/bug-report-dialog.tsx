"use client";

import { useState, useRef } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Loader2,
    ImagePlus,
    X,
    CheckCircle2,
    Send,
    HelpCircle,
    Mail
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { submitBugReport } from "@/actions/bug-reports";
import { motion, AnimatePresence } from "framer-motion";

interface BugReportDialogProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
}

export function BugReportDialog({ isOpen, onClose, userId }: BugReportDialogProps) {
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [screenshots, setScreenshots] = useState<string[]>([]);
    const [uploadingScreen, setUploadingScreen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        if (screenshots.length + files.length > 3) {
            toast.error("You can only upload up to 3 screenshots");
            return;
        }

        setUploadingScreen(true);
        const supabase = createClient();

        try {
            const newUrls = [...screenshots];
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const ext = file.name.split('.').pop();
                const path = `bug-reports/${userId}/${Date.now()}-${i}.${ext}`;

                const { data, error } = await supabase.storage
                    .from("portal-assets")
                    .upload(path, file);

                if (error) throw error;

                const { data: { publicUrl } } = supabase.storage
                    .from("portal-assets")
                    .getPublicUrl(path);

                newUrls.push(publicUrl);
            }
            setScreenshots(newUrls);
            toast.success("Screenshots uploaded");
        } catch (error: any) {
            toast.error("Failed to upload: " + error.message);
        } finally {
            setUploadingScreen(false);
        }
    };

    const removeScreenshot = (index: number) => {
        setScreenshots(screenshots.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (description.length < 10) {
            toast.error("Please describe the issue with at least 10 characters");
            return;
        }

        setIsSubmitting(true);
        try {
            await submitBugReport({
                description,
                screenshot_urls: screenshots
            });
            setIsSuccess(true);
        } catch (error: any) {
            toast.error("Failed to send report: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetAndClose = () => {
        setIsSuccess(false);
        setDescription("");
        setScreenshots([]);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(val) => !val && resetAndClose()}>
            <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none bg-zinc-900 text-white">
                <AnimatePresence mode="wait">
                    {!isSuccess ? (
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="p-6 space-y-6"
                        >
                            <DialogHeader>
                                <DialogTitle className="text-xl font-bold">Send feedback</DialogTitle>
                                <DialogDescription className="text-zinc-400 text-sm">
                                    For other issues like build errors, glitches, or technical issues, you can get help from the
                                    {" "}<span
                                        className="text-emerald-500 font-medium cursor-pointer hover:underline"
                                        onClick={() => toast.info("Help Centre is coming soon! Stay tuned.")}
                                    >
                                        Help Centre
                                    </span>, or
                                    {" "}<span
                                        className="text-emerald-500 font-medium cursor-pointer hover:underline"
                                        onClick={() => {
                                            const msg = encodeURIComponent("I encountered something important to share from the page. My Query is....");
                                            window.open(`https://wa.me/2349158311526?text=${msg}`, '_blank');
                                        }}
                                    >
                                        contact us
                                    </span>.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4">
                                <div className="relative">
                                    <Textarea
                                        placeholder="Describe the technical issue or suggestion..."
                                        className="min-h-[140px] bg-zinc-800 border-none focus-visible:ring-1 focus-visible:ring-emerald-500 text-white placeholder:text-zinc-500 resize-none rounded-xl p-4"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                    <p className="absolute bottom-3 left-4 text-[10px] text-zinc-500">
                                        Describe with at least 10 characters
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-zinc-300 text-sm font-medium">Screenshots or recordings (optional)</Label>
                                    <p className="text-zinc-500 text-xs">Choose up to 3 files</p>

                                    <div className="flex gap-3">
                                        <AnimatePresence>
                                            {screenshots.map((url, idx) => (
                                                <motion.div
                                                    key={url}
                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="relative w-20 h-20 rounded-lg overflow-hidden border border-zinc-700 bg-zinc-800 group"
                                                >
                                                    <img src={url} alt="Screenshot" className="w-full h-full object-cover" />
                                                    <button
                                                        onClick={() => removeScreenshot(idx)}
                                                        className="absolute top-1 right-1 p-1 bg-black/60 rounded-full hover:bg-black transition-colors"
                                                        title="Remove screenshot"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>

                                        {screenshots.length < 3 && (
                                            <button
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={uploadingScreen}
                                                className="w-20 h-20 rounded-xl border-2 border-dashed border-zinc-700 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all flex flex-col items-center justify-center gap-1 group disabled:opacity-50"
                                            >
                                                {uploadingScreen ? (
                                                    <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                                                ) : (
                                                    <>
                                                        <ImagePlus className="h-6 w-6 text-zinc-400 group-hover:text-emerald-500" />
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        multiple
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        title="Upload screenshots"
                                    />
                                </div>
                            </div>

                            <div className="pt-2">
                                <p className="text-[11px] text-zinc-500 leading-relaxed mb-6">
                                    By sending, you allow InternHub to review related technical info to help address your feedback.
                                    {" "}<span
                                        className="text-emerald-500 cursor-pointer hover:underline"
                                        onClick={() => toast.info("InternHub is in the building phase and will soon be ready!")}
                                    >
                                        Learn more
                                    </span>
                                </p>

                                <div className="flex items-center justify-end gap-3">
                                    <Button
                                        variant="ghost"
                                        onClick={onClose}
                                        className="text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-400 font-semibold"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting || description.trim().length === 0}
                                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-semibold px-8 rounded-full disabled:bg-zinc-800/50 disabled:text-zinc-600 h-10"
                                    >
                                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-10 text-center space-y-6"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", damping: 12 }}
                                className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto"
                            >
                                <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                            </motion.div>

                            <div className="space-y-3">
                                <h3 className="text-xl font-bold">Feedback Sent!</h3>
                                <p className="text-zinc-400 text-sm leading-relaxed px-4">
                                    The Management has received your report, we are doing our best to make sure the site is working and up to date. It would be reviewed and if a fix is needed, it would be applied to the site's next version.
                                </p>
                            </div>

                            <Button
                                onClick={resetAndClose}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl h-12 font-bold transition-all active:scale-[0.98]"
                            >
                                Done
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
}
