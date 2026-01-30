"use client";

import { useState } from "react";
import { verifyVaultCode } from "@/app/actions/vault";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, Loader2, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function AdminVaultGate() {
    const [code, setCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const result = await verifyVaultCode(code);

            if (result.success) {
                toast.success("Vault Unlocked", {
                    description: "Secure session established."
                });
                router.refresh();
            } else {
                toast.error("Access Denied", {
                    description: result.message || "Invalid code provided."
                });
            }
        } catch (error) {
            toast.error("System Error", {
                description: "Could not verify code. Please try again."
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
            <Card className="w-full max-w-md border-red-900/50 bg-slate-900 text-slate-100 shadow-2xl">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-900/20 ring-1 ring-red-900/50">
                        <Lock className="h-8 w-8 text-red-500" />
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight text-red-500">
                        Restricted Access
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                        Enter a One-Time Access Code to unlock the Admin Vault.
                        <br />
                        <span className="text-xs text-slate-500">
                            Identity Verified: agbojoshua2005@gmail.com
                        </span>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Input
                                type="text"
                                placeholder="ADMIN-XXXX-XXXX-XXXX-XXXX"
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                className="bg-slate-950 border-red-900/30 text-center font-mono text-lg tracking-widest text-white placeholder:text-slate-700"
                                disabled={isLoading}
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full bg-red-700 hover:bg-red-600 font-semibold"
                            disabled={isLoading || code.length < 10}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Verifying Cryptographic Key...
                                </>
                            ) : (
                                <>
                                    <ShieldAlert className="mr-2 h-4 w-4" />
                                    Authenticate
                                </>
                            )}
                        </Button>
                        <p className="text-center text-[10px] text-slate-600">
                            All access attempts are logged and monitored.
                            <br />
                            3 failed attempts will trigger a security lockdown.
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
