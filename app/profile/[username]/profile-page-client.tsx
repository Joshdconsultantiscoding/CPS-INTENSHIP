"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileAbout } from "@/components/profile/profile-about";
import { ProfileExperience } from "@/components/profile/profile-experience";
import { ProfileEducation } from "@/components/profile/profile-education";
import { ProfileSkills } from "@/components/profile/profile-skills";
import { ProfileProjects } from "@/components/profile/profile-projects";
import { ProfileRecommendations } from "@/components/profile/profile-recommendations";
import { ProfileEditModal } from "@/components/profile/profile-edit-modal";
import {
    ExperienceModal,
    EducationModal,
    SkillsModal,
    ProjectModal,
} from "@/components/profile/profile-section-modals";
import { AdminProfileActions } from "@/components/profile/admin-profile-actions";
import { generateProfileCV } from "@/lib/profile/generate-cv-pdf";
import { toast } from "sonner";
import type {
    FullProfile,
    Experience,
    Education,
    Project,
} from "@/lib/types/profile";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { AblyClientProvider } from "@/providers/ably-provider";
import { NotificationEngineProvider } from "@/components/notifications/notification-engine";

interface ProfilePageClientProps {
    profile: FullProfile;
    isOwner: boolean;
    isAdmin: boolean;
    currentUserId?: string;
    dashboardProps?: any; // Using any to avoid duplicating complex DashboardShell props types here, but ideally should be typed
}

type EditSection = "basic" | "about" | "photos" | null;

export function ProfilePageClient({
    profile: initialProfile,
    isOwner,
    isAdmin,
    currentUserId,
    dashboardProps,
}: ProfilePageClientProps) {
    const router = useRouter();
    const [profile, setProfile] = useState(initialProfile);

    // Modal states
    const [editSection, setEditSection] = useState<EditSection>(null);
    const [editExperience, setEditExperience] = useState<Experience | null>(null);
    const [showExperienceModal, setShowExperienceModal] = useState(false);
    const [editEducation, setEditEducation] = useState<Education | null>(null);
    const [showEducationModal, setShowEducationModal] = useState(false);
    const [showSkillsModal, setShowSkillsModal] = useState(false);
    const [editProject, setEditProject] = useState<Project | null>(null);
    const [showProjectModal, setShowProjectModal] = useState(false);

    const handleRefresh = useCallback(() => {
        router.refresh();
    }, [router]);

    const handleDownloadCV = async () => {
        toast.loading("Generating CV...");
        try {
            await generateProfileCV(profile);
            toast.dismiss();
            toast.success("CV downloaded!");
        } catch (error) {
            toast.dismiss();
            toast.error("Failed to generate CV");
        }
    };

    // Experience handlers
    const handleAddExperience = () => {
        setEditExperience(null);
        setShowExperienceModal(true);
    };

    const handleEditExperience = (exp: Experience) => {
        setEditExperience(exp);
        setShowExperienceModal(true);
    };

    // Education handlers
    const handleAddEducation = () => {
        setEditEducation(null);
        setShowEducationModal(true);
    };

    const handleEditEducation = (edu: Education) => {
        setEditEducation(edu);
        setShowEducationModal(true);
    };

    // Project handlers
    const handleAddProject = () => {
        setEditProject(null);
        setShowProjectModal(true);
    };

    const handleEditProject = (proj: Project) => {
        setEditProject(proj);
        setShowProjectModal(true);
    };

    const content = (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
            <div className={`container max-w-4xl py-6 px-4 md:px-6 space-y-6 mx-auto ${dashboardProps ? 'pt-6' : 'pt-6'}`}>
                {/* Header / Intro */}
                <div className="bg-card rounded-xl shadow-lg overflow-hidden">
                    <ProfileHeader
                        profile={profile}
                        isOwner={isOwner}
                        isAdmin={isAdmin}
                        onEdit={() => setEditSection("photos")}
                        onDownloadCV={handleDownloadCV}
                    />
                </div>

                {/* Admin Actions (if admin viewing intern) */}
                {isAdmin && !isOwner && (
                    <AdminProfileActions profile={profile} />
                )}

                {/* About */}
                <ProfileAbout
                    about={profile.about}
                    isOwner={isOwner}
                    onEdit={() => setEditSection("about")}
                />

                {/* Experience */}
                <ProfileExperience
                    experiences={profile.experiences}
                    isOwner={isOwner}
                    onAdd={handleAddExperience}
                    onEdit={handleEditExperience}
                />

                {/* Education */}
                <ProfileEducation
                    education={profile.education}
                    isOwner={isOwner}
                    onAdd={handleAddEducation}
                    onEdit={handleEditEducation}
                />

                {/* Skills */}
                <ProfileSkills
                    skills={profile.skills}
                    isOwner={isOwner}
                    onAdd={() => setShowSkillsModal(true)}
                    onEdit={() => setShowSkillsModal(true)}
                />

                {/* Projects */}
                <ProfileProjects
                    projects={profile.projects}
                    isOwner={isOwner}
                    onAdd={handleAddProject}
                    onEdit={handleEditProject}
                />

                {/* Recommendations */}
                <ProfileRecommendations
                    recommendations={profile.recommendations}
                    isOwner={isOwner}
                />

                {/* Edit Profile Modal */}
                <ProfileEditModal
                    profile={profile}
                    section={editSection}
                    isOpen={editSection !== null}
                    onClose={() => setEditSection(null)}
                    onSave={handleRefresh}
                />

                {/* Experience Modal */}
                <ExperienceModal
                    profileId={profile.id}
                    experience={editExperience}
                    isOpen={showExperienceModal}
                    onClose={() => {
                        setShowExperienceModal(false);
                        setEditExperience(null);
                    }}
                    onSave={handleRefresh}
                />

                {/* Education Modal */}
                <EducationModal
                    profileId={profile.id}
                    education={editEducation}
                    isOpen={showEducationModal}
                    onClose={() => {
                        setShowEducationModal(false);
                        setEditEducation(null);
                    }}
                    onSave={handleRefresh}
                />

                {/* Skills Modal */}
                <SkillsModal
                    profileId={profile.id}
                    skills={profile.skills}
                    isOpen={showSkillsModal}
                    onClose={() => setShowSkillsModal(false)}
                    onSave={handleRefresh}
                />

                {/* Project Modal */}
                <ProjectModal
                    profileId={profile.id}
                    project={editProject}
                    isOpen={showProjectModal}
                    onClose={() => {
                        setShowProjectModal(false);
                        setEditProject(null);
                    }}
                    onSave={handleRefresh}
                />
            </div>
        </div>
    );

    if (dashboardProps) {
        return (
            <AblyClientProvider userId={dashboardProps.serverUser.id}>
                <NotificationEngineProvider
                    role={dashboardProps.serverProfile?.role}
                    serverSettings={dashboardProps.serverSettings}
                    serverLatestLog={dashboardProps.serverLatestLog}
                >
                    <DashboardShell
                        serverProfile={dashboardProps.serverProfile}
                        serverSettings={dashboardProps.serverSettings}
                        serverOnboarding={dashboardProps.serverOnboarding}
                        serverUser={dashboardProps.serverUser}
                    >
                        {content}
                    </DashboardShell>
                </NotificationEngineProvider>
            </AblyClientProvider>
        );
    }

    return content;
}
