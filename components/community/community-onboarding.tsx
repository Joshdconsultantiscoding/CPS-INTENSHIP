"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Sparkles,
    Target,
    AlertCircle,
    ShieldCheck,
    ChevronRight,
    ChevronLeft,
    Check,
    Loader2,
    MessageSquare,
    BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { getNiches, submitCommunityOnboarding, type Niche } from "@/app/actions/community";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const steps = [
    {
        id: "interests",
        title: "Your Interests",
        description: "What do you want to learn and achieve here?",
        icon: Sparkles,
        color: "text-emerald-600",
        bg: "bg-emerald-50"
    },
    {
        id: "goals",
        title: "Goals & Challenges",
        description: "Tell us about your targets and what holds you back.",
        icon: Target,
        color: "text-blue-600",
        bg: "bg-blue-50"
    },
    {
        id: "terms",
        title: "Community Rules",
        description: "Help us keep this space productive and safe.",
        icon: ShieldCheck,
        color: "text-amber-600",
        bg: "bg-amber-50"
    },
    {
        id: "join",
        title: "Choose Your Path",
        description: "Select the sub-community that fits your focus.",
        icon: MessageSquare,
        color: "text-purple-600",
        bg: "bg-purple-50"
    }
];

export function CommunityOnboarding() {
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState({
        interests: "",
        goals: "",
        painPoints: "",
        nicheId: "",
        agreed: false
    });
    const [niches, setNiches] = useState<Niche[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const loadNiches = async () => {
            const res = await getNiches();
            if (res.success) setNiches(res.niches);
            setLoading(false);
        };
        loadNiches();
    }, []);

    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit = async () => {
        if (!formData.nicheId || !formData.agreed) {
            toast.error("Please select a community and agree to the terms.");
            return;
        }

        setSubmitting(true);
        const res = await submitCommunityOnboarding({
            nicheId: formData.nicheId,
            interests: formData.interests,
            goals: formData.goals,
            painPoints: formData.painPoints
        });

        if (res.success) {
            toast.success("Welcome to the community!");
            router.push(`/dashboard/community/${formData.nicheId}`);
        } else {
            toast.error(res.error || "Failed to join");
            setSubmitting(false);
        }
    };

    const isStepValid = () => {
        if (currentStep === 0) return formData.interests.length > 10;
        if (currentStep === 1) return formData.goals.length > 5 && formData.painPoints.length > 5;
        if (currentStep === 2) return formData.agreed;
        if (currentStep === 3) return !!formData.nicheId;
        return false;
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 gap-4 bg-white/50 backdrop-blur-sm rounded-3xl border border-zinc-200">
                <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
                <p className="text-zinc-500 font-medium">Preparing your community entry...</p>
            </div>
        );
    }

    const StepIcon = steps[currentStep].icon;

    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)]">
                {/* Header Progress */}
                <div className="flex bg-zinc-50 border-b border-zinc-100">
                    {steps.map((step, idx) => (
                        <div
                            key={step.id}
                            className={`flex-1 h-2 transition-all duration-500 ${idx <= currentStep ? "bg-emerald-500" : "bg-zinc-200"}`}
                        />
                    ))}
                </div>

                <div className="p-8 md:p-12">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center gap-5 mb-8">
                                <div className={`p-4 rounded-2xl ${steps[currentStep].bg} ${steps[currentStep].color}`}>
                                    <StepIcon className="h-9 w-9" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">{steps[currentStep].title}</h2>
                                    <p className="text-zinc-500 text-lg">{steps[currentStep].description}</p>
                                </div>
                            </div>

                            {currentStep === 0 && (
                                <div className="space-y-4">
                                    <label className="text-sm font-semibold text-zinc-700">
                                        What are your primary interests or what do you want to learn?
                                    </label>
                                    <Textarea
                                        placeholder="e.g. I want to master Next.js, learn about automated marketing systems, and build high-performance products."
                                        className="bg-zinc-50 border-zinc-200 text-zinc-900 min-h-[160px] rounded-2xl focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-base p-4"
                                        value={formData.interests}
                                        onChange={e => setFormData({ ...formData, interests: e.target.value })}
                                    />
                                    <p className="text-xs text-zinc-400 font-medium">Min. 10 characters required to proceed.</p>
                                </div>
                            )}

                            {currentStep === 1 && (
                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
                                            <Target className="h-4 w-4 text-blue-600" />
                                            Professional Goals
                                        </label>
                                        <Input
                                            placeholder="What is your #1 goal for this internship?"
                                            className="bg-zinc-50 border-zinc-200 text-zinc-900 rounded-2xl h-12 focus:ring-blue-500/20 focus:border-blue-500"
                                            value={formData.goals}
                                            onChange={e => setFormData({ ...formData, goals: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4 text-red-600" />
                                            Current Pain Points
                                        </label>
                                        <Input
                                            placeholder="What's your biggest struggle right now?"
                                            className="bg-zinc-50 border-zinc-200 text-zinc-900 rounded-2xl h-12 focus:ring-red-500/20 focus:border-red-500"
                                            value={formData.painPoints}
                                            onChange={e => setFormData({ ...formData, painPoints: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}

                            {currentStep === 2 && (
                                <div className="space-y-6">
                                    <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6 space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar shadow-inner">
                                        <h4 className="font-bold text-zinc-800 flex items-center gap-2">
                                            <ShieldCheck className="h-5 w-5 text-amber-600" />
                                            Community Guidelines
                                        </h4>
                                        <ul className="space-y-4 text-zinc-600 text-sm leading-relaxed">
                                            <li className="flex gap-3">
                                                <div className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                                <span><strong>Respect is Key</strong>: Be supportive and professional. We empower each other to grow daily.</span>
                                            </li>
                                            <li className="flex gap-3">
                                                <div className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                                <span><strong>Growth First</strong>: Keep discussions focused on learning, building, and professional development.</span>
                                            </li>
                                            <li className="flex gap-3">
                                                <div className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                                <span><strong>No Noise</strong>: Zero tolerance for spam, self-promotion, or toxic behavior.</span>
                                            </li>
                                            <li className="flex gap-3">
                                                <div className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                                <span><strong>Open Source Mindset</strong>: Share what you've learned and never hesitate to ask quality questions.</span>
                                            </li>
                                        </ul>
                                    </div>
                                    <button
                                        onClick={() => setFormData({ ...formData, agreed: !formData.agreed })}
                                        className="flex items-center gap-4 group w-full p-2 rounded-xl transition-colors hover:bg-zinc-50"
                                    >
                                        <div className={`h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all ${formData.agreed ? "bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-500/20" : "bg-white border-zinc-300 group-hover:border-zinc-400"}`}>
                                            {formData.agreed && <Check className="h-4 w-4 text-white" />}
                                        </div>
                                        <span className="text-zinc-700 font-medium">I have read, understood and agree to follow these guidelines.</span>
                                    </button>
                                </div>
                            )}

                            {currentStep === 3 && (
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <label className="text-sm font-semibold text-zinc-700">
                                            Select your primary path to begin
                                        </label>
                                        <Select
                                            onValueChange={(v) => setFormData({ ...formData, nicheId: v })}
                                            value={formData.nicheId}
                                        >
                                            <SelectTrigger className="bg-zinc-50 border-zinc-200 text-zinc-900 rounded-2xl h-14 focus:ring-emerald-500/10 focus:border-emerald-500 text-lg">
                                                <SelectValue placeholder="Choose your community..." />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white border-zinc-200 rounded-xl">
                                                {niches.map(niche => (
                                                    <SelectItem key={niche.id} value={niche.id} className="h-12 text-zinc-700 focus:bg-emerald-50 focus:text-emerald-700">
                                                        {niche.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-sm text-zinc-500 italic">Don't worry, you can explore other communities later!</p>
                                    </div>

                                    <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm flex gap-4 items-center">
                                        <div className="bg-emerald-500 text-white p-1 rounded-full shadow-sm">
                                            <Check className="h-4 w-4" />
                                        </div>
                                        <span className="font-medium">Excellent! Your profile is ready. Click below to enter the community.</span>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Footer Actions */}
                    <div className="mt-12 flex items-center justify-between pt-8 border-t border-zinc-100">
                        <Button
                            variant="ghost"
                            onClick={prevStep}
                            disabled={currentStep === 0 || submitting}
                            className="text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl px-6"
                        >
                            <ChevronLeft className="mr-2 h-4 w-4" />
                            Return
                        </Button>

                        {currentStep === steps.length - 1 ? (
                            <Button
                                onClick={handleSubmit}
                                disabled={!isStepValid() || submitting}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 rounded-2xl h-12 shadow-xl shadow-emerald-600/20 active:scale-95 transition-all text-base font-bold"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Finalizing...
                                    </>
                                ) : (
                                    <>
                                        Start My Journey
                                        <ChevronRight className="ml-2 h-5 w-5" />
                                    </>
                                )}
                            </Button>
                        ) : (
                            <Button
                                onClick={nextStep}
                                disabled={!isStepValid()}
                                className="bg-zinc-900 hover:bg-black text-white px-10 rounded-2xl h-12 shadow-xl shadow-zinc-900/10 active:scale-95 transition-all text-base font-bold"
                            >
                                Continue
                                <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Support Message */}
            <div className="mt-10 text-center text-zinc-400 text-sm space-y-1">
                <p className="font-medium">Need assistance? Reach out to support@internships.com</p>
                <p>© 2026 Professional Intern Management Platform</p>
            </div>
        </div>
    );
}
