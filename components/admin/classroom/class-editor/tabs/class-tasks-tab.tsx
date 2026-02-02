"use client";

import { CheckSquare, Plus, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function ClassTasksTab() {
    return (
        <div className="p-6 space-y-8">
            <div>
                <h3 className="text-lg font-medium">Class Tasks & Activities</h3>
                <p className="text-sm text-muted-foreground">
                    Assign shared goals and track group progress for this cohort.
                </p>
            </div>

            <Alert className="bg-primary/5 border-primary/20">
                <Info className="h-4 w-4 text-primary" />
                <AlertTitle className="text-primary">Feature Ready in Phase 12</AlertTitle>
                <AlertDescription className="text-xs text-muted-foreground">
                    This module will allow you to post class-specific "Sprint Tasks" that interns can collaborate on.
                    It will integrate with the core Task system but scoped specifically to this cohort.
                </AlertDescription>
            </Alert>

            <div className="flex flex-col items-center justify-center p-20 border border-dashed rounded-xl bg-muted/5">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-6">
                    <CheckSquare className="h-8 w-8 text-muted-foreground" />
                </div>
                <h4 className="text-lg font-semibold mb-2">Build a Collaborative Roadmap</h4>
                <p className="text-sm text-muted-foreground text-center max-w-sm mb-8">
                    Once enabled, you will be able to create tasks, set deadlines, and assign teams within this specific class.
                </p>
                <Button disabled size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    New Activity
                </Button>
            </div>
        </div>
    );
}
