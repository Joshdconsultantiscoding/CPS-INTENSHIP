"use client";

import React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Reward } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Loader2, Gift, Trophy, Star, Medal, Crown, Zap, Award, Target } from "lucide-react";
import { useAbly } from "@/providers/ably-provider";
import { createRewardAction, updateRewardAction } from "@/app/actions/rewards";

interface RewardDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    reward?: Reward;
}

const iconOptions = [
    { value: "gift", label: "Gift", icon: Gift },
    { value: "trophy", label: "Trophy", icon: Trophy },
    { value: "star", label: "Star", icon: Star },
    { value: "medal", label: "Medal", icon: Medal },
    { value: "crown", label: "Crown", icon: Crown },
    { value: "zap", label: "Zap", icon: Zap },
    { value: "award", label: "Award", icon: Award },
    { value: "target", label: "Target", icon: Target },
];

export function RewardDialog({ open, onOpenChange, reward }: RewardDialogProps) {
    const router = useRouter();
    const { client: ablyClient } = useAbly();
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState(reward?.name || "");
    const [description, setDescription] = useState(reward?.description || "");
    const [pointsRequired, setPointsRequired] = useState(reward?.points_required?.toString() || "100");
    const [icon, setIcon] = useState(reward?.icon || "gift");

    const isEditing = !!reward;

    // Sync state with reward prop when it changes
    React.useEffect(() => {
        if (reward) {
            setName(reward.name || "");
            setDescription(reward.description || "");
            setPointsRequired(reward.points_required?.toString() || "100");
            setIcon(reward.icon || "gift");
        } else {
            setName("");
            setDescription("");
            setPointsRequired("100");
            setIcon("gift");
        }
    }, [reward]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const rewardData = {
            name,
            description: description || null,
            points_required: parseInt(pointsRequired) || 100,
            icon,
            is_active: true,
        };

        let result;
        if (isEditing) {
            result = await updateRewardAction(reward.id, rewardData);
        } else {
            result = await createRewardAction(rewardData);
        }

        if (!result.success) {
            console.error(`Failed to ${isEditing ? "update" : "create"} reward:`, result.error);
            toast.error(`Failed to ${isEditing ? "update" : "create"} reward: ${result.error}`);
            setLoading(false);
            return;
        }

        const savedReward = result.data;

        // Publish via Ably for real-time sync
        if (ablyClient && savedReward) {
            try {
                const channel = ablyClient.channels.get("rewards:global");
                await channel.publish(isEditing ? "reward-updated" : "reward-created", { reward: savedReward });
            } catch (e) {
                console.warn("Ably publish failed:", e);
            }
        }

        toast.success(`Reward ${isEditing ? "updated" : "created"} successfully`);
        setLoading(false);
        onOpenChange(false);
        router.refresh();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit Reward" : "Add New Reward"}</DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Update reward details for interns to claim."
                            : "Create a new incentive for interns to earn with their points."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Reward Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Company T-Shirt"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="What is this reward?"
                                rows={3}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="points">Points Required</Label>
                                <Input
                                    id="points"
                                    type="number"
                                    min="1"
                                    value={pointsRequired}
                                    onChange={(e) => setPointsRequired(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="icon">Icon</Label>
                                <Select value={icon} onValueChange={setIcon}>
                                    <SelectTrigger id="icon">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {iconOptions.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                <div className="flex items-center gap-2">
                                                    <opt.icon className="h-4 w-4" />
                                                    <span>{opt.label}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEditing ? "Save Changes" : "Add Reward"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
