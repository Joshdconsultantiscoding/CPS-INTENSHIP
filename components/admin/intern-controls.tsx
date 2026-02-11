"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
    AlertTriangle,
    Ban,
    ShieldOff,
    Trash2,
    RotateCcw,
    Loader2,
} from "lucide-react";
import {
    suspendUserAction,
    unsuspendUserAction,
    blockRoutesAction,
    deleteUserAction,
    restoreUserAction,
} from "@/actions/admin-controls";
import { toast } from "sonner";

interface InternControlsProps {
    userId: string;
    userName: string;
    currentStatus?: string;
    currentBlockedRoutes?: string[];
    onActionComplete?: () => void;
}

// ── Suspend Dialog ─────────────────────────────────────────────
export function SuspendDialog({
    open,
    onOpenChange,
    userId,
    userName,
    onActionComplete,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userId: string;
    userName: string;
    onActionComplete?: () => void;
}) {
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSuspend = async () => {
        if (!reason.trim()) {
            toast.error("Please provide a reason for suspension");
            return;
        }
        setLoading(true);
        const result = await suspendUserAction(userId, reason);
        setLoading(false);
        if (result.success) {
            toast.success(`${userName} has been suspended`);
            onOpenChange(false);
            setReason("");
            onActionComplete?.();
        } else {
            toast.error(result.error || "Failed to suspend user");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-amber-600">
                        <Ban className="h-5 w-5" />
                        Suspend User
                    </DialogTitle>
                    <DialogDescription>
                        Suspending <strong>{userName}</strong> will prevent them from accessing the platform.
                        They can be unsuspended at any time.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="suspend-reason">Reason for suspension *</Label>
                        <Textarea
                            id="suspend-reason"
                            placeholder="e.g., Violation of terms, Inactive for extended period..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={3}
                        />
                    </div>
                    <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-3 text-sm text-amber-800 dark:text-amber-200 flex gap-2">
                        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>The user will see a suspension notice when they try to access the platform.</span>
                    </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleSuspend} disabled={loading || !reason.trim()}>
                        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Suspend User
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ── Block Routes Dialog ────────────────────────────────────────
const BLOCKABLE_ROUTES = [
    { path: "/dashboard/messages", label: "Messages" },
    { path: "/dashboard/community", label: "Community" },
    { path: "/dashboard/rewards", label: "Rewards" },
    { path: "/dashboard/referrals", label: "Referrals" },
    { path: "/dashboard/assistant", label: "AI Assistant" },
    { path: "/dashboard/classroom", label: "Classroom" },
];

export function BlockRoutesDialog({
    open,
    onOpenChange,
    userId,
    userName,
    currentBlockedRoutes = [],
    onActionComplete,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userId: string;
    userName: string;
    currentBlockedRoutes?: string[];
    onActionComplete?: () => void;
}) {
    const [selectedRoutes, setSelectedRoutes] = useState<string[]>(currentBlockedRoutes);
    const [loading, setLoading] = useState(false);

    const toggleRoute = (route: string) => {
        setSelectedRoutes((prev) =>
            prev.includes(route) ? prev.filter((r) => r !== route) : [...prev, route]
        );
    };

    const handleBlock = async () => {
        setLoading(true);
        const result = await blockRoutesAction(userId, selectedRoutes);
        setLoading(false);
        if (result.success) {
            const msg = selectedRoutes.length > 0
                ? `${userName} has been blocked from ${selectedRoutes.length} route(s)`
                : `All route blocks removed for ${userName}`;
            toast.success(msg);
            onOpenChange(false);
            onActionComplete?.();
        } else {
            toast.error(result.error || "Failed to update blocked routes");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-orange-600">
                        <ShieldOff className="h-5 w-5" />
                        Block Routes
                    </DialogTitle>
                    <DialogDescription>
                        Select which sections <strong>{userName}</strong> should be blocked from accessing.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                    {BLOCKABLE_ROUTES.map((route) => (
                        <div
                            key={route.path}
                            className="flex items-center space-x-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50"
                            onClick={() => toggleRoute(route.path)}
                        >
                            <Checkbox
                                checked={selectedRoutes.includes(route.path)}
                                onCheckedChange={() => toggleRoute(route.path)}
                            />
                            <div className="flex-1">
                                <span className="text-sm font-medium">{route.label}</span>
                                <span className="text-xs text-muted-foreground ml-2">{route.path}</span>
                            </div>
                        </div>
                    ))}
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleBlock} disabled={loading}>
                        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Save ({selectedRoutes.length} blocked)
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ── Delete Dialog ──────────────────────────────────────────────
export function DeleteUserDialog({
    open,
    onOpenChange,
    userId,
    userName,
    onActionComplete,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userId: string;
    userName: string;
    onActionComplete?: () => void;
}) {
    const [reason, setReason] = useState("");
    const [confirmText, setConfirmText] = useState("");
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        if (confirmText !== "DELETE") {
            toast.error('Type "DELETE" to confirm');
            return;
        }
        if (!reason.trim()) {
            toast.error("Please provide a reason");
            return;
        }
        setLoading(true);
        const result = await deleteUserAction(userId, reason);
        setLoading(false);
        if (result.success) {
            toast.success(`${userName} has been deactivated`);
            onOpenChange(false);
            setReason("");
            setConfirmText("");
            onActionComplete?.();
        } else {
            toast.error(result.error || "Failed to delete user");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        <Trash2 className="h-5 w-5" />
                        Delete User Account
                    </DialogTitle>
                    <DialogDescription>
                        This will deactivate <strong>{userName}</strong>&apos;s account. Their data will be preserved
                        and can be restored later.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="delete-reason">Reason *</Label>
                        <Textarea
                            id="delete-reason"
                            placeholder="Reason for account deletion..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={2}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirm-delete">
                            Type <Badge variant="destructive" className="mx-1">DELETE</Badge> to confirm
                        </Label>
                        <input
                            id="confirm-delete"
                            type="text"
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            placeholder="DELETE"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                        />
                    </div>
                    <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-800 dark:text-red-200 flex gap-2">
                        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>This is a soft delete. The user&apos;s data is preserved and can be restored by an admin.</span>
                    </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={loading || confirmText !== "DELETE" || !reason.trim()}
                    >
                        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Delete Account
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ── Restore Dialog ─────────────────────────────────────────────
export function RestoreUserDialog({
    open,
    onOpenChange,
    userId,
    userName,
    onActionComplete,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    userId: string;
    userName: string;
    onActionComplete?: () => void;
}) {
    const [loading, setLoading] = useState(false);

    const handleRestore = async () => {
        setLoading(true);
        const result = await restoreUserAction(userId);
        setLoading(false);
        if (result.success) {
            toast.success(`${userName} has been restored`);
            onOpenChange(false);
            onActionComplete?.();
        } else {
            toast.error(result.error || "Failed to restore user");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-green-600">
                        <RotateCcw className="h-5 w-5" />
                        Restore User
                    </DialogTitle>
                    <DialogDescription>
                        Restore <strong>{userName}</strong>&apos;s account to active status? All restrictions
                        will be removed.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleRestore} disabled={loading} className="bg-green-600 hover:bg-green-700">
                        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Restore Account
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
