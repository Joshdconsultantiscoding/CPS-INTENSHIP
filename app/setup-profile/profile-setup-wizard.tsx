"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { CloudinaryUpload } from "@/components/profile/cloudinary-upload";
import {
    ArrowLeft,
    ArrowRight,
    Check,
    Loader2,
    User,
    Camera,
    FileText,
    Sparkles,
    Briefcase,
    GraduationCap,
    X,
} from "lucide-react";
import { updateProfile, addSkill, addExperience, addEducation, markProfileComplete } from "@/actions/profile";
import { COMMON_SKILLS } from "@/lib/types/profile";
import type { Profile, ProfileSkill } from "@/lib/types/profile";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProfileSetupWizardProps {
    userId: string;
    initialProfile: Profile | null;
    initialSkills: ProfileSkill[];
}

const STEPS = [
    { id: 1, title: "Basic Info", icon: User },
    { id: 2, title: "Photo", icon: Camera },
    { id: 3, title: "About", icon: FileText },
    { id: 4, title: "Skills", icon: Sparkles },
    { id: 5, title: "Experience", icon: Briefcase },
    { id: 6, title: "Education", icon: GraduationCap },
];

export function ProfileSetupWizard({
    userId,
    initialProfile,
    initialSkills,
}: ProfileSetupWizardProps) {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [completionPercentage, setCompletionPercentage] = useState(0);

    // Form states
    const [firstName, setFirstName] = useState(initialProfile?.first_name || "");
    const [lastName, setLastName] = useState(initialProfile?.last_name || "");
    const [headline, setHeadline] = useState(initialProfile?.headline || "");
    const [location, setLocation] = useState(initialProfile?.location || "");
    const [avatarUrl, setAvatarUrl] = useState(initialProfile?.avatar_url || "");
    const [coverUrl, setCoverUrl] = useState(initialProfile?.cover_url || "");
    const [about, setAbout] = useState(initialProfile?.about || "");
    const [selectedSkills, setSelectedSkills] = useState<string[]>(
        initialSkills.map((s) => s.skill_name)
    );

    // Experience
    const [expTitle, setExpTitle] = useState("");
    const [expCompany, setExpCompany] = useState("");
    const [expDescription, setExpDescription] = useState("");
    const [expStartDate, setExpStartDate] = useState("");
    const [expCurrent, setExpCurrent] = useState(true);

    // Education
    const [eduSchool, setEduSchool] = useState("");
    const [eduDegree, setEduDegree] = useState("");
    const [eduField, setEduField] = useState("");
    const [eduEndYear, setEduEndYear] = useState("");

    // Calculate completion
    useEffect(() => {
        let percentage = 0;
        if (avatarUrl) percentage += 20;
        if (coverUrl) percentage += 5;
        if (headline) percentage += 15;
        if (about && about.length > 20) percentage += 20;
        if (location) percentage += 5;
        if (selectedSkills.length > 0) percentage += 15;
        if (expTitle && expCompany) percentage += 10;
        if (eduSchool) percentage += 10;
        setCompletionPercentage(percentage);
    }, [avatarUrl, coverUrl, headline, about, location, selectedSkills, expTitle, expCompany, eduSchool]);

    const saveCurrentStep = async () => {
        setIsLoading(true);
        try {
            switch (currentStep) {
                case 1:
                    await updateProfile(userId, {
                        first_name: firstName,
                        last_name: lastName,
                        full_name: `${firstName} ${lastName}`.trim(),
                        headline,
                        location,
                    });
                    break;
                case 2:
                    await updateProfile(userId, {
                        avatar_url: avatarUrl,
                        cover_url: coverUrl,
                    });
                    break;
                case 3:
                    await updateProfile(userId, { about });
                    break;
                case 4:
                    // Add new skills that weren't already there
                    const existingSkillNames = initialSkills.map((s) => s.skill_name);
                    for (const skill of selectedSkills) {
                        if (!existingSkillNames.includes(skill)) {
                            await addSkill(userId, skill);
                        }
                    }
                    break;
                case 5:
                    if (expTitle && expCompany) {
                        await addExperience(userId, {
                            title: expTitle,
                            company: expCompany,
                            description: expDescription,
                            start_date: expStartDate,
                            end_date: "",
                            current: expCurrent,
                            location: "",
                        });
                    }
                    break;
                case 6:
                    if (eduSchool) {
                        await addEducation(userId, {
                            school: eduSchool,
                            degree: eduDegree,
                            field: eduField,
                            description: "",
                            start_year: null,
                            end_year: eduEndYear ? parseInt(eduEndYear) : null,
                        });
                    }
                    break;
            }
            return true;
        } catch (error) {
            toast.error("Failed to save");
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const handleNext = async () => {
        const saved = await saveCurrentStep();
        if (saved && currentStep < 6) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleComplete = async () => {
        await saveCurrentStep();

        if (completionPercentage < 70) {
            toast.error(`Profile is only ${completionPercentage}% complete. Need at least 70%.`);
            return;
        }

        setIsLoading(true);
        const result = await markProfileComplete(userId);

        if (result.success) {
            toast.success("Profile complete! Welcome to CPS Intern.");
            router.push("/dashboard");
        } else {
            toast.error(result.error || "Failed to complete profile");
        }
        setIsLoading(false);
    };

    const toggleSkill = (skill: string) => {
        setSelectedSkills((prev) =>
            prev.includes(skill)
                ? prev.filter((s) => s !== skill)
                : [...prev, skill]
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-muted/30 flex justify-center">
            <div className="w-full max-w-3xl py-8 px-4 mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        Complete Your Profile
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Let's set up your professional profile on CPS Intern
                    </p>
                </div>

                {/* Progress */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Profile Strength</span>
                        <span className={cn(
                            "text-sm font-bold",
                            completionPercentage >= 70 ? "text-green-500" : "text-amber-500"
                        )}>
                            {completionPercentage}%
                        </span>
                    </div>
                    <Progress value={completionPercentage} className="h-2" />
                    {completionPercentage < 70 && (
                        <p className="text-xs text-muted-foreground mt-1">
                            Complete at least 70% to access your dashboard
                        </p>
                    )}
                </div>

                {/* Steps indicator */}
                <div className="flex justify-between mb-8 overflow-x-auto pb-2">
                    {STEPS.map((step) => {
                        const Icon = step.icon;
                        const isActive = step.id === currentStep;
                        const isComplete = step.id < currentStep;

                        return (
                            <button
                                key={step.id}
                                onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                                className={cn(
                                    "flex flex-col items-center gap-1 min-w-[60px] transition-all",
                                    isActive && "scale-110",
                                    step.id < currentStep && "cursor-pointer"
                                )}
                            >
                                <div
                                    className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                                        isActive && "bg-primary text-primary-foreground",
                                        isComplete && "bg-green-500 text-white",
                                        !isActive && !isComplete && "bg-muted text-muted-foreground"
                                    )}
                                >
                                    {isComplete ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                                </div>
                                <span className={cn(
                                    "text-xs",
                                    isActive ? "text-primary font-medium" : "text-muted-foreground"
                                )}>
                                    {step.title}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Step Content */}
                <Card className="shadow-xl">
                    <CardHeader>
                        <CardTitle>{STEPS[currentStep - 1].title}</CardTitle>
                        <CardDescription>
                            {currentStep === 1 && "Tell us about yourself"}
                            {currentStep === 2 && "Add a profile photo and cover image"}
                            {currentStep === 3 && "Write a professional summary"}
                            {currentStep === 4 && "Select your skills"}
                            {currentStep === 5 && "Add your experience (optional)"}
                            {currentStep === 6 && "Add your education (optional)"}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Step 1: Basic Info */}
                        {currentStep === 1 && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName">First Name *</Label>
                                        <Input
                                            id="firstName"
                                            value={firstName}
                                            onChange={(e) => setFirstName(e.target.value)}
                                            placeholder="John"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName">Last Name *</Label>
                                        <Input
                                            id="lastName"
                                            value={lastName}
                                            onChange={(e) => setLastName(e.target.value)}
                                            placeholder="Doe"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="headline">Professional Headline *</Label>
                                    <Input
                                        id="headline"
                                        value={headline}
                                        onChange={(e) => setHeadline(e.target.value)}
                                        placeholder="Software Engineering Intern | Learning React & TypeScript"
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
                            </>
                        )}

                        {/* Step 2: Photos */}
                        {currentStep === 2 && (
                            <div className="space-y-8">
                                <div className="flex flex-col items-center space-y-4">
                                    <Label className="text-center">Profile Photo</Label>
                                    <AvatarUpload
                                        currentUrl={avatarUrl}
                                        onUploadComplete={setAvatarUrl}
                                        onError={(err) => toast.error(err)}
                                        fallback={firstName?.[0] || "U"}
                                        size="xl"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Cover Image (Optional)</Label>
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

                        {/* Step 3: About */}
                        {currentStep === 3 && (
                            <div className="space-y-2">
                                <Label htmlFor="about">About You *</Label>
                                <Textarea
                                    id="about"
                                    value={about}
                                    onChange={(e) => setAbout(e.target.value)}
                                    placeholder="I'm a passionate learner focused on software development. Currently exploring React, TypeScript, and modern web technologies through the CPS Intern program..."
                                    className="min-h-[200px] resize-none"
                                />
                                <p className="text-xs text-muted-foreground">
                                    {about.length}/2000 characters (minimum 20 required)
                                </p>
                            </div>
                        )}

                        {/* Step 4: Skills */}
                        {currentStep === 4 && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Selected Skills ({selectedSkills.length})</Label>
                                    <div className="flex flex-wrap gap-2 p-3 bg-muted/50 rounded-lg min-h-[60px]">
                                        {selectedSkills.length > 0 ? (
                                            selectedSkills.map((skill) => (
                                                <Badge
                                                    key={skill}
                                                    variant="default"
                                                    className="px-3 py-1.5 cursor-pointer"
                                                    onClick={() => toggleSkill(skill)}
                                                >
                                                    {skill}
                                                    <X className="h-3 w-3 ml-1" />
                                                </Badge>
                                            ))
                                        ) : (
                                            <span className="text-muted-foreground text-sm">
                                                Select at least one skill below
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Click to add skills</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {COMMON_SKILLS.filter((s) => !selectedSkills.includes(s)).map((skill) => (
                                            <Badge
                                                key={skill}
                                                variant="outline"
                                                className="px-3 py-1.5 cursor-pointer hover:bg-primary/10"
                                                onClick={() => toggleSkill(skill)}
                                            >
                                                + {skill}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 5: Experience */}
                        {currentStep === 5 && (
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Add your most recent experience, or skip if you don't have any yet.
                                </p>
                                <div className="space-y-2">
                                    <Label htmlFor="expTitle">Job Title</Label>
                                    <Input
                                        id="expTitle"
                                        value={expTitle}
                                        onChange={(e) => setExpTitle(e.target.value)}
                                        placeholder="Software Engineering Intern"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="expCompany">Company</Label>
                                    <Input
                                        id="expCompany"
                                        value={expCompany}
                                        onChange={(e) => setExpCompany(e.target.value)}
                                        placeholder="CPS Intern"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="expDescription">Description</Label>
                                    <Textarea
                                        id="expDescription"
                                        value={expDescription}
                                        onChange={(e) => setExpDescription(e.target.value)}
                                        placeholder="What did you work on?"
                                        className="min-h-[80px]"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Step 6: Education */}
                        {currentStep === 6 && (
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Add your education, or skip if you prefer.
                                </p>
                                <div className="space-y-2">
                                    <Label htmlFor="eduSchool">School</Label>
                                    <Input
                                        id="eduSchool"
                                        value={eduSchool}
                                        onChange={(e) => setEduSchool(e.target.value)}
                                        placeholder="University of Lagos"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="eduDegree">Degree</Label>
                                        <Input
                                            id="eduDegree"
                                            value={eduDegree}
                                            onChange={(e) => setEduDegree(e.target.value)}
                                            placeholder="Bachelor's"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="eduField">Field of Study</Label>
                                        <Input
                                            id="eduField"
                                            value={eduField}
                                            onChange={(e) => setEduField(e.target.value)}
                                            placeholder="Computer Science"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="eduEndYear">Graduation Year</Label>
                                    <Input
                                        id="eduEndYear"
                                        type="number"
                                        value={eduEndYear}
                                        onChange={(e) => setEduEndYear(e.target.value)}
                                        placeholder="2024"
                                    />
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Navigation */}
                <div className="flex justify-between mt-6">
                    <Button
                        variant="outline"
                        onClick={handleBack}
                        disabled={currentStep === 1 || isLoading}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>

                    {currentStep < 6 ? (
                        <Button onClick={handleNext} disabled={isLoading}>
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <>
                                    Next
                                    <ArrowRight className="h-4 w-4 ml-2" />
                                </>
                            )}
                        </Button>
                    ) : (
                        <Button
                            onClick={handleComplete}
                            disabled={isLoading || completionPercentage < 70}
                            className="bg-green-500 hover:bg-green-600"
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <>
                                    <Check className="h-4 w-4 mr-2" />
                                    Complete Profile
                                </>
                            )}
                        </Button>
                    )}
                </div>

                {/* Skip to dashboard link */}
                {completionPercentage >= 70 && (
                    <p className="text-center mt-4 text-sm text-muted-foreground">
                        Your profile is ready!{" "}
                        <button
                            onClick={handleComplete}
                            className="text-primary hover:underline"
                        >
                            Go to dashboard
                        </button>
                    </p>
                )}
            </div>
        </div>
    );
}
