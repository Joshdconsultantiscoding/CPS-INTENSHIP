import { getAuthUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AlertTriangle, Lock, ShieldAlert, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppealForm } from "@/components/appeals/appeal-form";
import { SignOutButton } from "@clerk/nextjs";

export default async function SuspendedPage() {
    const user = await getAuthUser();
    const supabase = await createClient();

    // Fetch user profile to get suspension reason
    const { data: profile } = await supabase
        .from("profiles")
        .select("suspended_reason, account_status")
        .eq("id", user.id)
        .single();

    // Look for existing appeal
    const { data: existingAppeal } = await supabase
        .from("appeals")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "pending")
        //.maybeSingle(); // or .limit(1).single()
        .single();

    // If somehow a non-suspended user gets here, redirect them out
    if (profile?.account_status !== "suspended") {
        redirect("/dashboard");
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-white dark:bg-slate-900 rounded-xl shadow-lg overflow-hidden border border-red-100 dark:border-red-900/30">
                {/* Header */}
                <div className="bg-red-600 p-6 text-center">
                    <div className="mx-auto bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
                        <Lock className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Account Suspended</h1>
                    <p className="text-red-100">
                        Your access to the platform has been restricted.
                    </p>
                </div>

                <div className="p-8 space-y-8">
                    {/* Reason Section */}
                    <div className="space-y-4">
                        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-100 dark:border-red-900/50">
                            <ShieldAlert className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-semibold text-red-900 dark:text-red-200 mb-1">Reason for Suspension</h3>
                                <p className="text-red-700 dark:text-red-400 text-sm">
                                    {profile?.suspended_reason || "Violation of platform terms of service."}
                                </p>
                            </div>
                        </div>

                        {/* Warning Section */}
                        <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-100 dark:border-orange-900/50">
                            <CalendarClock className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-semibold text-orange-900 dark:text-orange-200 mb-1">Permanent Deletion Warning</h3>
                                <p className="text-orange-700 dark:text-orange-400 text-sm">
                                    Your account is scheduled for permanent deletion in <strong>14 days</strong> if this suspension is not resolved.
                                    Once deleted, your email cannot be used to create a new account.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800 my-6"></div>

                    {/* Appeal Section */}
                    <div>
                        {/* If they already have a pending appeal, show status instead of form */}
                        {existingAppeal ? (
                            <div className="text-center py-6 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
                                <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">Appeal Under Review</h3>
                                <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">
                                    You have already submitted an appeal on {new Date(existingAppeal.created_at).toLocaleDateString()}.
                                    Our administrators are reviewing your case.
                                </p>
                            </div>
                        ) : (
                            <AppealForm />
                        )}
                    </div>

                    <div className="flex justify-center pt-4">
                        <SignOutButton>
                            <Button variant="outline" className="text-slate-500 hover:text-slate-700">
                                Sign Out
                            </Button>
                        </SignOutButton>
                    </div>
                </div>
            </div>
        </div>
    );
}
