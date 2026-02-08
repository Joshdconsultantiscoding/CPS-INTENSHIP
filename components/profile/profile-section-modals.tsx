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
import { Loader2, Trash2 } from "lucide-react";
import {
    addExperience,
    updateExperience,
    deleteExperience,
    addEducation,
    updateEducation,
    deleteEducation,
    addSkill,
    removeSkill,
    addProject,
    updateProject,
    deleteProject,
} from "@/actions/profile";
import { toast } from "sonner";
import { COMMON_SKILLS } from "@/lib/types/profile";
import type {
    Experience,
    Education,
    ProfileSkill,
    Project,
} from "@/lib/types/profile";
import { CloudinaryUpload } from "./cloudinary-upload";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

// =============================================
// EXPERIENCE MODAL
// =============================================
interface ExperienceModalProps {
    profileId: string;
    experience?: Experience | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
}

export function ExperienceModal({
    profileId,
    experience,
    isOpen,
    onClose,
    onSave,
}: ExperienceModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [title, setTitle] = useState(experience?.title || "");
    const [company, setCompany] = useState(experience?.company || "");
    const [location, setLocation] = useState(experience?.location || "");
    const [description, setDescription] = useState(experience?.description || "");
    const [startDate, setStartDate] = useState(experience?.start_date || "");
    const [endDate, setEndDate] = useState(experience?.end_date || "");
    const [current, setCurrent] = useState(experience?.current || false);

    const handleSubmit = async () => {
        if (!title.trim() || !company.trim()) {
            toast.error("Title and company are required");
            return;
        }

        setIsLoading(true);
        const formData = {
            title,
            company,
            location,
            description,
            start_date: startDate,
            end_date: current ? null : endDate,
            current,
        };

        let result;
        if (experience) {
            result = await updateExperience(experience.id, profileId, formData);
        } else {
            result = await addExperience(profileId, formData as any);
        }

        if (result.success) {
            toast.success(experience ? "Experience updated!" : "Experience added!");
            onSave();
            onClose();
        } else {
            toast.error(result.error || "Failed to save");
        }
        setIsLoading(false);
    };

    const handleDelete = async () => {
        if (!experience) return;
        setIsLoading(true);
        const result = await deleteExperience(experience.id, profileId);
        if (result.success) {
            toast.success("Experience deleted");
            onSave();
            onClose();
        } else {
            toast.error(result.error || "Failed to delete");
        }
        setIsLoading(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={() => onClose()}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{experience ? "Edit" : "Add"} Experience</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title *</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Software Engineering Intern"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="company">Company *</Label>
                        <Input
                            id="company"
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                            placeholder="CPS Intern"
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

                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                        <Switch checked={current} onCheckedChange={setCurrent} />
                        <Label>I currently work here</Label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="startDate">Start Date</Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        {!current && (
                            <div className="space-y-2">
                                <Label htmlFor="endDate">End Date</Label>
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe your responsibilities and achievements..."
                            className="min-h-[100px]"
                        />
                    </div>
                </div>

                <DialogFooter className="flex justify-between">
                    {experience && (
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isLoading}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                        </Button>
                    )}
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={isLoading}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// =============================================
// EDUCATION MODAL
// =============================================
interface EducationModalProps {
    profileId: string;
    education?: Education | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
}

export function EducationModal({
    profileId,
    education,
    isOpen,
    onClose,
    onSave,
}: EducationModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [school, setSchool] = useState(education?.school || "");
    const [degree, setDegree] = useState(education?.degree || "");
    const [field, setField] = useState(education?.field || "");
    const [description, setDescription] = useState(education?.description || "");
    const [startYear, setStartYear] = useState(education?.start_year?.toString() || "");
    const [endYear, setEndYear] = useState(education?.end_year?.toString() || "");

    const handleSubmit = async () => {
        if (!school.trim()) {
            toast.error("School name is required");
            return;
        }

        setIsLoading(true);
        const formData = {
            school,
            degree,
            field,
            description,
            start_year: startYear ? parseInt(startYear) : null,
            end_year: endYear ? parseInt(endYear) : null,
        };

        let result;
        if (education) {
            result = await updateEducation(education.id, profileId, formData);
        } else {
            result = await addEducation(profileId, formData as any);
        }

        if (result.success) {
            toast.success(education ? "Education updated!" : "Education added!");
            onSave();
            onClose();
        } else {
            toast.error(result.error || "Failed to save");
        }
        setIsLoading(false);
    };

    const handleDelete = async () => {
        if (!education) return;
        setIsLoading(true);
        const result = await deleteEducation(education.id, profileId);
        if (result.success) {
            toast.success("Education deleted");
            onSave();
            onClose();
        } else {
            toast.error(result.error || "Failed to delete");
        }
        setIsLoading(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={() => onClose()}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{education ? "Edit" : "Add"} Education</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="school">School *</Label>
                        <Input
                            id="school"
                            value={school}
                            onChange={(e) => setSchool(e.target.value)}
                            placeholder="University of Lagos"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="degree">Degree</Label>
                        <Input
                            id="degree"
                            value={degree}
                            onChange={(e) => setDegree(e.target.value)}
                            placeholder="Bachelor's Degree"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="field">Field of Study</Label>
                        <Input
                            id="field"
                            value={field}
                            onChange={(e) => setField(e.target.value)}
                            placeholder="Computer Science"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="startYear">Start Year</Label>
                            <Input
                                id="startYear"
                                type="number"
                                value={startYear}
                                onChange={(e) => setStartYear(e.target.value)}
                                placeholder="2020"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="endYear">End Year</Label>
                            <Input
                                id="endYear"
                                type="number"
                                value={endYear}
                                onChange={(e) => setEndYear(e.target.value)}
                                placeholder="2024"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Activities and achievements..."
                            className="min-h-[80px]"
                        />
                    </div>
                </div>

                <DialogFooter className="flex justify-between">
                    {education && (
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isLoading}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                        </Button>
                    )}
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={isLoading}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// =============================================
// SKILLS MODAL
// =============================================
interface SkillsModalProps {
    profileId: string;
    skills: ProfileSkill[];
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
}

export function SkillsModal({
    profileId,
    skills,
    isOpen,
    onClose,
    onSave,
}: SkillsModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [newSkill, setNewSkill] = useState("");

    const handleAddSkill = async (skillName: string) => {
        if (!skillName.trim()) return;
        setIsLoading(true);
        const result = await addSkill(profileId, skillName.trim());
        if (result.success) {
            toast.success("Skill added!");
            setNewSkill("");
            onSave();
        } else {
            toast.error(result.error || "Failed to add skill");
        }
        setIsLoading(false);
    };

    const handleRemoveSkill = async (skillId: string) => {
        setIsLoading(true);
        const result = await removeSkill(skillId, profileId);
        if (result.success) {
            toast.success("Skill removed");
            onSave();
        } else {
            toast.error(result.error || "Failed to remove skill");
        }
        setIsLoading(false);
    };

    const existingSkillNames = skills.map((s) => s.skill_name.toLowerCase());
    const suggestedSkills = COMMON_SKILLS.filter(
        (s) => !existingSkillNames.includes(s.toLowerCase())
    );

    return (
        <Dialog open={isOpen} onOpenChange={() => onClose()}>
            <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Manage Skills</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Current Skills */}
                    <div className="space-y-2">
                        <Label>Your Skills</Label>
                        <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg min-h-[60px]">
                            {skills.length > 0 ? (
                                skills.map((skill) => (
                                    <Badge
                                        key={skill.id}
                                        variant="secondary"
                                        className="px-3 py-1.5 text-sm flex items-center gap-2"
                                    >
                                        {skill.skill_name}
                                        <button
                                            onClick={() => handleRemoveSkill(skill.id)}
                                            className="hover:text-destructive"
                                            disabled={isLoading}
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))
                            ) : (
                                <span className="text-muted-foreground text-sm">
                                    No skills added yet
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Add Custom Skill */}
                    <div className="space-y-2">
                        <Label>Add Skill</Label>
                        <div className="flex gap-2">
                            <Input
                                value={newSkill}
                                onChange={(e) => setNewSkill(e.target.value)}
                                placeholder="Type a skill..."
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleAddSkill(newSkill);
                                    }
                                }}
                            />
                            <Button
                                onClick={() => handleAddSkill(newSkill)}
                                disabled={isLoading || !newSkill.trim()}
                            >
                                Add
                            </Button>
                        </div>
                    </div>

                    {/* Suggested Skills */}
                    <div className="space-y-2">
                        <Label>Suggested</Label>
                        <div className="flex flex-wrap gap-2">
                            {suggestedSkills.slice(0, 12).map((skill) => (
                                <Badge
                                    key={skill}
                                    variant="outline"
                                    className="px-3 py-1.5 cursor-pointer hover:bg-primary/10"
                                    onClick={() => handleAddSkill(skill)}
                                >
                                    + {skill}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button onClick={onClose}>Done</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// =============================================
// PROJECT MODAL
// =============================================
interface ProjectModalProps {
    profileId: string;
    project?: Project | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
}

export function ProjectModal({
    profileId,
    project,
    isOpen,
    onClose,
    onSave,
}: ProjectModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [title, setTitle] = useState(project?.title || "");
    const [description, setDescription] = useState(project?.description || "");
    const [mediaUrl, setMediaUrl] = useState(project?.media_url || "");
    const [link, setLink] = useState(project?.link || "");
    const [tagsInput, setTagsInput] = useState(project?.tags?.join(", ") || "");

    const handleSubmit = async () => {
        if (!title.trim()) {
            toast.error("Project title is required");
            return;
        }

        setIsLoading(true);
        const tags = tagsInput
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t);

        const formData = {
            title,
            description,
            media_url: mediaUrl,
            link,
            tags,
        };

        let result;
        if (project) {
            result = await updateProject(project.id, profileId, formData);
        } else {
            result = await addProject(profileId, formData as any);
        }

        if (result.success) {
            toast.success(project ? "Project updated!" : "Project added!");
            onSave();
            onClose();
        } else {
            toast.error(result.error || "Failed to save");
        }
        setIsLoading(false);
    };

    const handleDelete = async () => {
        if (!project) return;
        setIsLoading(true);
        const result = await deleteProject(project.id, profileId);
        if (result.success) {
            toast.success("Project deleted");
            onSave();
            onClose();
        } else {
            toast.error(result.error || "Failed to delete");
        }
        setIsLoading(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={() => onClose()}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{project ? "Edit" : "Add"} Project</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title *</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="My Awesome Project"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe your project..."
                            className="min-h-[80px]"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Project Image/Video</Label>
                        <CloudinaryUpload
                            currentUrl={mediaUrl}
                            onUploadComplete={setMediaUrl}
                            onError={(err) => toast.error(err)}
                            accept="image/*,video/*"
                            folder="projects"
                            variant="media"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="link">Project Link</Label>
                        <Input
                            id="link"
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                            placeholder="https://github.com/..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="tags">Tags (comma-separated)</Label>
                        <Input
                            id="tags"
                            value={tagsInput}
                            onChange={(e) => setTagsInput(e.target.value)}
                            placeholder="React, TypeScript, Supabase"
                        />
                    </div>
                </div>

                <DialogFooter className="flex justify-between">
                    {project && (
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isLoading}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                        </Button>
                    )}
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={isLoading}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
