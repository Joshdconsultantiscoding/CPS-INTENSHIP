"use client";

import { useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    MapPin,
    Mail,
    Phone,
    Globe,
    Download,
    Pencil,
    MessageSquare,
    UserPlus,
    ExternalLink,
    Briefcase,
    GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/types/profile";
import Link from "next/link";

interface ProfileHeaderProps {
    profile: Profile;
    isOwner: boolean;
    isAdmin?: boolean;
    onEdit?: () => void;
    onDownloadCV?: () => void;
}

export function ProfileHeader({
    profile,
    isOwner,
    isAdmin = false,
    onEdit,
    onDownloadCV,
}: ProfileHeaderProps) {
    const initials = profile.full_name
        ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase()
        : profile.email[0].toUpperCase();

    return (
        <div className="relative">
            {/* Cover Image */}
            <div
                className={cn(
                    "h-48 md:h-64 bg-gradient-to-br from-primary/30 via-primary/20 to-background rounded-t-xl overflow-hidden",
                    profile.cover_url && "bg-cover bg-center"
                )}
                style={profile.cover_url ? { backgroundImage: `url(${profile.cover_url})` } : undefined}
            >
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            </div>

            {/* Profile Info */}
            <div className="relative px-6 pb-6">
                {/* Avatar */}
                <div className="absolute -top-16 md:-top-20 left-6">
                    <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-background shadow-2xl ring-4 ring-primary/10">
                        <AvatarImage src={profile.avatar_url || ""} />
                        <AvatarFallback className="text-4xl md:text-5xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
                            {initials}
                        </AvatarFallback>
                    </Avatar>

                    {/* Open to Work Badge */}
                    {profile.open_to_work && (
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                            <Badge className="bg-green-500 text-white px-3 py-1 text-xs font-semibold shadow-lg">
                                <GraduationCap className="h-3 w-3 mr-1" />
                                Open to Learn
                            </Badge>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 pt-4 flex-wrap">
                    {isOwner ? (
                        <Button onClick={onEdit} variant="outline" className="gap-2">
                            <Pencil className="h-4 w-4" />
                            Edit Profile
                        </Button>
                    ) : (
                        <>
                            <Link href={`/dashboard/messages?user=${profile.id}`}>
                                <Button variant="outline" className="gap-2">
                                    <MessageSquare className="h-4 w-4" />
                                    Message
                                </Button>
                            </Link>
                            <Button className="gap-2 bg-primary">
                                <UserPlus className="h-4 w-4" />
                                Connect
                            </Button>
                        </>
                    )}
                    <Button onClick={onDownloadCV} variant="secondary" className="gap-2">
                        <Download className="h-4 w-4" />
                        Download CV
                    </Button>
                </div>

                {/* Profile Details */}
                <div className="mt-8 md:mt-12">
                    {/* Name & Headline */}
                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                            {profile.full_name || "Anonymous User"}
                        </h1>
                        <Badge
                            variant="outline"
                            className={cn(
                                "w-fit capitalize",
                                profile.role === "admin" && "border-amber-500 text-amber-500",
                                profile.role === "intern" && "border-blue-500 text-blue-500"
                            )}
                        >
                            {profile.role}
                        </Badge>
                    </div>

                    {/* Headline */}
                    {profile.headline && (
                        <p className="text-lg text-muted-foreground mt-1">
                            {profile.headline}
                        </p>
                    )}

                    {/* Location & Contact */}
                    <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
                        {profile.location && (
                            <span className="flex items-center gap-1.5">
                                <MapPin className="h-4 w-4" />
                                {profile.location}
                            </span>
                        )}
                        {profile.email && (
                            <span className="flex items-center gap-1.5">
                                <Mail className="h-4 w-4" />
                                {profile.email}
                            </span>
                        )}
                        {profile.phone && (
                            <span className="flex items-center gap-1.5">
                                <Phone className="h-4 w-4" />
                                {profile.phone}
                            </span>
                        )}
                        {profile.website && (
                            <a
                                href={profile.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-primary hover:underline"
                            >
                                <Globe className="h-4 w-4" />
                                Website
                                <ExternalLink className="h-3 w-3" />
                            </a>
                        )}
                    </div>

                    {/* Stats Row */}
                    <div className="flex items-center gap-6 mt-6 p-4 bg-muted/50 rounded-lg">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-primary">{profile.total_points || 0}</p>
                            <p className="text-xs text-muted-foreground">Points</p>
                        </div>
                        <div className="h-8 w-px bg-border" />
                        <div className="text-center">
                            <p className="text-sm text-muted-foreground">
                                Member since {new Date(profile.joined_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                            </p>
                        </div>
                        {profile.department && (
                            <>
                                <div className="h-8 w-px bg-border" />
                                <div className="flex items-center gap-2">
                                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">{profile.department}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
