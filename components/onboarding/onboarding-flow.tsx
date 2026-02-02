"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
    CheckCircle2,
    Target,
    Lightbulb,
    Heart,
    Rocket,
    ArrowRight,
    ArrowLeft,
    Loader2
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface Step {
    id: number;
    title: string;
    description: string;
    icon: React.ElementType;
    questions: string[];
}

const steps: Step[] = [
    {
        id: 1,
        title: "Readiness",
        description: "Prepare your environment for maximum productivity.",
        icon: Target,
        questions: [
            "I have a stable internet connection for remote work.",
            "I have my development environment set up.",
            "I am ready to receive and tackle challenges."
        ]
    },
    {
        id: 2,
        title: "Seriousness",
        description: "Commit to quality and program standards.",
        icon: Rocket,
        questions: [
            "I will submit reports daily before the deadline.",
            "I understand that task quality affects my performance score.",
            "I will follow all company protocols and safety measures."
        ]
    },
    {
        id: 3,
        title: "Willingness",
        description: "Open your mind to learning and growth.",
        icon: Lightbulb,
        questions: [
            "I am open to constructive feedback from team leads.",
            "I will ask questions when I am stuck on a task.",
            "I am eager to learn new technologies and workflows."
        ]
    },
    {
        id: 4,
        title: "Dedication",
        description: "Your long-term goals within the program.",
        icon: Heart,
        questions: [
            "I aim to contribute meaningfully to my assigned projects.",
            "I will respect the time and effort of my colleagues.",
            "I am dedicated to finishing the program successfully."
        ]
    }
];

interface OnboardingFlowProps {
    userId: string;
    onComplete: () => void;
}

export function OnboardingFlow({ userId, onComplete }: OnboardingFlowProps) {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isFinishing, setIsFinishing] = useState(false);
    const currentStep = steps[currentStepIndex];
    const progress = ((currentStepIndex + 1) / steps.length) * 100;

    const handleNext = async () => {
        if (currentStepIndex < steps.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
            // Optional: Save progress to DB here
        } else {
            handleFinish();
        }
    };

    const handleBack = () => {
        if (currentStepIndex > 0) {
            setCurrentStepIndex(prev => prev - 1);
        }
    };

    const handleFinish = async () => {
        setIsFinishing(true);
        try {
            const supabase = createClient();
            const { error } = await supabase
                .from("onboarding_progress")
                .upsert({
                    user_id: userId,
                    is_completed: true,
                    completed_at: new Date().toISOString()
                });

            if (error) throw error;

            toast.success("Onboarding complete! Your dashboard is now ready.");
            onComplete();
        } catch (error: any) {
            toast.error("Failed to save progress. Please try again.");
        } finally {
            setIsFinishing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="w-full max-w-3xl overflow-hidden bg-background border rounded-3xl shadow-2xl"
            >
                {/* Header */}
                <div className="p-6 md:p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h2 className="text-sm font-medium text-primary uppercase tracking-wider">Step {currentStep.id} of 4</h2>
                            <div className="flex items-center gap-2">
                                <currentStep.icon className="w-6 h-6 text-primary" />
                                <h1 className="text-2xl font-bold">{currentStep.title}</h1>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-sm text-muted-foreground font-medium">{Math.round(progress)}% Complete</span>
                        </div>
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>

                {/* Content */}
                <div className="px-6 md:px-8 pb-12 pt-4">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep.id}
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-6 min-h-[300px]"
                        >
                            <p className="text-lg text-muted-foreground">
                                {currentStep.description}
                            </p>

                            <div className="grid gap-3">
                                {currentStep.questions.map((question, idx) => (
                                    <Card key={idx} className="border-primary/20 bg-primary/5">
                                        <CardContent className="p-4 flex items-center gap-3">
                                            <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                                            <span className="text-sm font-medium">{question}</span>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="p-6 md:p-8 border-t bg-muted/30 flex items-center justify-between">
                    <Button
                        variant="ghost"
                        onClick={handleBack}
                        disabled={currentStepIndex === 0 || isFinishing}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>

                    <Button
                        className="px-8 rounded-xl h-12"
                        onClick={handleNext}
                        disabled={isFinishing}
                    >
                        {isFinishing ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : currentStepIndex === steps.length - 1 ? (
                            "Finish Setup"
                        ) : (
                            <>
                                Next Step
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                        )}
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}
