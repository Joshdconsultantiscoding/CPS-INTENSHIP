"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { AvatarUpload } from "./avatar-upload";
import { CloudinaryUpload } from "./cloudinary-upload";
import { updateProfile } from "@/actions/profile";
import { toast } from "sonner";
import type { Profile } from "@/lib/types/profile";

type EditSection = "basic" | "about" | "photos" | null;

interface ProfileEditModalProps {
    profile: Profile;
    section: EditSection;
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
}

export function ProfileEditModal({
    profile,
    section,
    isOpen,
    onClose,
    onSave,
}: ProfileEditModalProps) {
    const [isLoading, setIsLoading] = useState(false);

    // Form states
    const [firstName, setFirstName] = useState(profile.first_name || "");
    const [lastName, setLastName] = useState(profile.last_name || "");
    const [headline, setHeadline] = useState(profile.headline || "");
    const [location, setLocation] = useState(profile.location || "");
    const [phone, setPhone] = useState(profile.phone || "");
    const [website, setWebsite] = useState(profile.website || "");
    const [openToWork, setOpenToWork] = useState(profile.open_to_work);
    const [about, setAbout] = useState(profile.about || "");
    const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || "");
    const [coverUrl, setCoverUrl] = useState(profile.cover_url || "");

    const handleSave = async () => {
        setIsLoading(true);
        let updates: Partial<Profile> = {};

        switch (section) {
            case "basic":
                updates = {
                    first_name: firstName,
                    last_name: lastName,
                    full_name: `${firstName} ${lastName}`.trim(),
                    headline,
                    location,
                    phone,
                    website,
                    open_to_work: openToWork,
                };
                break;
            case "about":
                updates = { about };
                break;
            case "photos":
                updates = { avatar_url: avatarUrl, cover_url: coverUrl };
                break;
        }

        const result = await updateProfile(profile.id, updates);

        if (result.success) {
            toast.success("Profile updated!");
            onSave();
            onClose();
        } else {
            toast.error(result.error || "Failed to update profile");
        }

        setIsLoading(false);
    };

    const getTitle = () => {
        switch (section) {
            case "basic":
                return "Edit Profile Info";
            case "about":
                return "Edit About";
            case "photos":
                return "Edit Photos";
            default:
                return "Edit Profile";
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={() => onClose()}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{getTitle()}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {section === "basic" && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">First Name</Label>
                                    <Input
                                        id="firstName"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        placeholder="John"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Last Name</Label>
                                    <Input
                                        id="lastName"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        placeholder="Doe"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="headline">Headline</Label>
                                <Input
                                    id="headline"
                                    value={headline}
                                    onChange={(e) => setHeadline(e.target.value)}
                                    placeholder="Software Engineering Intern at CPS"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="location">Location</Label>
                                <Input
                                    id="location"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    placeholder="Lagos, Nigeria"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone (optional)</Label>
                                <Input
                                    id="phone"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="+234 800 000 0000"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="website">Website (optional)</Label>
                                <Input
                                    id="website"
                                    value={website}
                                    onChange={(e) => setWebsite(e.target.value)}
                                    placeholder="https://yourwebsite.com"
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                                <div>
                                    <p className="font-medium">Open to Learn</p>
                                    <p className="text-sm text-muted-foreground">
                                        Show a badge that you're looking for learning opportunities
                                    </p>
                                </div>
                                <Switch
                                    checked={openToWork}
                                    onCheckedChange={setOpenToWork}
                                />
                            </div>
                        </>
                    )}

                    {section === "about" && (
                        <div className="space-y-2">
                            <Label htmlFor="about">About</Label>
                            <Textarea
                                id="about"
                                value={about}
                                onChange={(e) => setAbout(e.target.value)}
                                placeholder="Write a brief summary about yourself, your skills, and your goals..."
                                className="min-h-[200px] resize-none"
                            />
                            <p className="text-xs text-muted-foreground">
                                {about.length}/2000 characters
                            </p>
                        </div>
                    )}

                    {section === "photos" && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label>Profile Photo</Label>
                                <div className="flex justify-center">
                                    <AvatarUpload
                                        currentUrl={avatarUrl}
                                        onUploadComplete={setAvatarUrl}
                                        onError={(err) => toast.error(err)}
                                        fallback={profile.full_name?.[0] || "U"}
                                        size="xl"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Cover Image</Label>
                                <CloudinaryUpload
                                    currentUrl={coverUrl}
                                    onUploadComplete={setCoverUrl}
                                    onError={(err) => toast.error(err)}
                                    variant="cover"
                                    accept="image/*"
                                    folder="covers"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            "Save Changes"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
