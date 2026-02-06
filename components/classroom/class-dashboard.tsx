"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Layout,
    MessageSquare,
    FileText,
    GraduationCap,
    Users,
    Bell,
    ExternalLink,
    ChevronRight,
    Home,
    Calendar,
    Loader2,
    Video,
    Cloud,
    ChevronLeft,
    FileUp
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { submitClassTask } from "@/actions/classroom-student";
import { toast } from "sonner";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { FileUploader } from "@/components/ui/file-uploader";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface ClassDashboardProps {
    classDetails: any;
    announcements: any[];
    members: any[];
    tasks: any[];
}

export function ClassDashboard({ classDetails, announcements, members, tasks }: ClassDashboardProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const activeTab = searchParams.get("tab") || "overview";

    const setTab = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value === "overview") {
            params.delete("tab");
        } else {
            params.set("tab", value);
        }
        router.push(`?${params.toString()}`);
    };

    return (
        <div className="p-4 md:p-8 space-y-6">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Link href="/dashboard/classroom" className="hover:text-primary transition-colors flex items-center gap-1">
                    <Home className="h-3 w-3" />
                    Classroom
                </Link>
                <ChevronRight className="h-3 w-3" />
                <span className="font-medium text-foreground truncate max-w-[200px]">
                    {classDetails.name}
                </span>
            </nav>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{classDetails.name}</h1>
                    <p className="text-muted-foreground mt-1">
                        {classDetails.description || "Class Workspace"}
                    </p>
                </div>
                {classDetails.instructor && (
                    <div className="flex items-center gap-3 bg-muted/50 px-4 py-2 rounded-lg border">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {classDetails.instructor.full_name.charAt(0)}
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase font-semibold">Instructor</p>
                            <p className="font-medium">{classDetails.instructor.full_name}</p>
                        </div>
                    </div>
                )}
            </div>

            <Tabs value={activeTab} onValueChange={setTab} className="space-y-6">
                <div className="overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-none">
                    <TabsList className="inline-flex h-12 items-center justify-start rounded-none border-b bg-transparent p-0 w-full md:w-auto">
                        {[
                            { value: "overview", label: "Overview", icon: Layout },
                            { value: "announcements", label: "Announcements", icon: Bell },
                            { value: "tasks", label: "Tasks", icon: FileText },
                            { value: "courses", label: "Courses", icon: GraduationCap },
                            { value: "chat", label: "Chat", icon: MessageSquare },
                            { value: "members", label: "Members", icon: Users },
                        ].map((tab) => (
                            <TabsTrigger
                                key={tab.value}
                                value={tab.value}
                                className="inline-flex items-center justify-center whitespace-nowrap border-b-2 border-transparent px-4 py-3 text-sm font-medium ring-offset-background transition-all hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none rounded-none"
                            >
                                <tab.icon className="mr-2 h-4 w-4" />
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </div>

                <TabsContent value="overview" className="animate-in fade-in-50 duration-300">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Class Overview</CardTitle>
                                <CardDescription>Basic information and rules for this class.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h4 className="font-semibold mb-1">Description</h4>
                                    <p className="text-sm text-muted-foreground">
                                        {classDetails.description || "No description provided for this class."}
                                    </p>
                                </div>
                                <div className="pt-4 border-t">
                                    <h4 className="font-semibold mb-2">Class Expectations</h4>
                                    <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                                        <li>Be respectful to classmates and mentors.</li>
                                        <li>Complete assignments before the deadline.</li>
                                        <li>Participate in group discussions.</li>
                                        <li>Reach out if you need help!</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="space-y-6">
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg">Recent Progress</CardTitle>
                                    <CardDescription>Your activity in this class.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-center py-6">
                                        <p className="text-sm text-muted-foreground italic">
                                            No recent activity tracked yet.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-primary/5 border-primary/20">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                                </CardHeader>
                                <CardContent className="grid gap-2">
                                    <Button variant="outline" className="justify-start shadow-none" onClick={() => setTab("chat")}>
                                        <MessageSquare className="mr-2 h-4 w-4" />
                                        Open Class Chat
                                    </Button>
                                    <Button variant="outline" className="justify-start shadow-none" onClick={() => setTab("tasks")}>
                                        <FileText className="mr-2 h-4 w-4" />
                                        View Assignments
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="announcements" className="animate-in fade-in-50 duration-300">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Class Feed</CardTitle>
                                <CardDescription>Important updates from your instructor and admin.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {announcements.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/5 rounded-lg border border-dashed">
                                        <Bell className="h-10 w-10 text-muted-foreground mb-4" />
                                        <h3 className="font-semibold text-lg">No announcements yet</h3>
                                        <p className="text-sm text-muted-foreground max-w-xs mt-1">
                                            When your instructor posts an update, it will appear here.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {announcements.map((ann) => (
                                            <div key={ann.id} className="p-4 rounded-lg border bg-card space-y-2">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-bold">{ann.title}</h4>
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(ann.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                                    {ann.content}
                                                </p>
                                                {ann.author && (
                                                    <div className="pt-2 flex items-center gap-2">
                                                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold">
                                                            {ann.author.full_name.charAt(0)}
                                                        </div>
                                                        <span className="text-xs font-medium">{ann.author.full_name}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="tasks" className="animate-in fade-in-50 duration-300">
                    <Card>
                        <CardHeader>
                            <CardTitle>Assignments</CardTitle>
                            <CardDescription>Review and submit your coursework.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {tasks.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/5 rounded-lg border border-dashed">
                                    <FileText className="h-10 w-10 text-muted-foreground mb-4" />
                                    <h3 className="font-semibold text-lg">No tasks assigned</h3>
                                    <p className="text-sm text-muted-foreground max-w-xs mt-1">
                                        Your instructor will post tasks for this class soon.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {tasks.map((task) => (
                                        <div key={task.id} className="p-4 rounded-lg border bg-card flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex-1">
                                                <h4 className="font-bold">{task.title}</h4>
                                                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                                    {task.description}
                                                </p>
                                                <div className="flex items-center gap-3 mt-2">
                                                    <Badge variant="outline" className="text-[10px] uppercase">
                                                        {task.submission_type}
                                                    </Badge>
                                                    {task.deadline && (
                                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            Due {new Date(task.deadline).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                {task.submission ? (
                                                    <div className="flex flex-col items-end">
                                                        <Badge variant="success" className="bg-green-500/10 text-green-500 border-green-500/20">
                                                            Submitted
                                                        </Badge>
                                                        <span className="text-[10px] text-muted-foreground mt-1">
                                                            {new Date(task.submission.submitted_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <TaskSubmissionDialog task={task} />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="courses" className="animate-in fade-in-50 duration-300">
                    <Card>
                        <CardHeader>
                            <CardTitle>Assigned Learning</CardTitle>
                            <CardDescription>Courses specifically curated for this class.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {!classDetails.class_courses || classDetails.class_courses.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/5 rounded-lg border border-dashed">
                                    <GraduationCap className="h-10 w-10 text-muted-foreground mb-4" />
                                    <h3 className="font-semibold text-lg">No courses assigned yet</h3>
                                    <p className="text-sm text-muted-foreground max-w-xs mt-1">
                                        Explore the course marketplace to find more learning resources.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2">
                                    {classDetails.class_courses.map((cc: any) => (
                                        <Card key={cc.course.id} className="overflow-hidden hover:shadow-md transition-shadow">
                                            <div className="aspect-video bg-muted relative overflow-hidden">
                                                {cc.course.thumbnail_url ? (
                                                    <img src={cc.course.thumbnail_url} alt={cc.course.title} className="object-cover w-full h-full" />
                                                ) : (
                                                    <div className="flex items-center justify-center w-full h-full bg-primary/5">
                                                        <GraduationCap className="h-12 w-12 text-primary/20" />
                                                    </div>
                                                )}
                                                <Badge className="absolute top-2 right-2 uppercase text-[10px]" variant="secondary">
                                                    {cc.course.level || 'Beginner'}
                                                </Badge>
                                            </div>
                                            <CardContent className="p-4 space-y-3">
                                                <div>
                                                    <h4 className="font-bold line-clamp-1">{cc.course.title}</h4>
                                                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                                        {cc.course.description}
                                                    </p>
                                                </div>
                                                <Button asChild className="w-full" size="sm">
                                                    <Link href={`/dashboard/classroom/courses/${cc.course.id}`}>
                                                        Continue Learning
                                                    </Link>
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="chat" className="animate-in fade-in-50 duration-300 h-[600px]">
                    <Card className="h-full flex flex-col overflow-hidden">
                        <CardHeader className="border-b">
                            <CardTitle>Class Communication</CardTitle>
                            <CardDescription>Real-time chat with your classmates and instructor.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                            <div className="bg-primary/5 p-8 rounded-full mb-6">
                                <MessageSquare className="h-12 w-12 text-primary" />
                            </div>
                            <h3 className="font-semibold text-xl">Class Chat Room</h3>
                            <p className="text-muted-foreground max-w-sm mt-2">
                                Connect with your cohort instantly. Chat features are coming soon to this private space!
                            </p>
                            <Button className="mt-6" variant="secondary">
                                Join Private Channel
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="members" className="animate-in fade-in-50 duration-300">
                    <Card>
                        <CardHeader>
                            <CardTitle>Classmates</CardTitle>
                            <CardDescription>Learn which interns and mentors are in your group.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {members.map((member) => (
                                    <div key={member.user_id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                            {member.profile?.full_name?.charAt(0) || "?"}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{member.profile?.full_name || "Unknown User"}</p>
                                            <p className="text-xs text-muted-foreground uppercase">{member.role || "intern"}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function TaskSubmissionDialog({ task }: { task: any }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState(0); // 0: Selection, 1-2: Instructions, 3: Form
    const [method, setMethod] = useState<'manual' | 'youtube' | 'drive' | null>(null);
    const [formData, setFormData] = useState({
        content: "",
        fileUrl: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const result = await submitClassTask({
                taskId: task.id,
                ...formData
            });
            if (result.success) {
                toast.success("Assignment submitted successfully!");
                setIsOpen(false);
                setStep(0);
                setMethod(null);
            }
        } catch (error) {
            toast.error("Failed to submit assignment");
        } finally {
            setIsLoading(false);
        }
    };

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);

    const renderStep = () => {
        switch (step) {
            case 0:
                return (
                    <div className="space-y-4 py-4">
                        <p className="text-sm text-muted-foreground text-center mb-6">
                            How would you like to submit your work today?
                        </p>
                        <div className="grid gap-3">
                            <Button
                                variant="outline"
                                className="h-auto p-4 justify-start gap-4 text-left border-2 hover:border-primary transition-all"
                                onClick={() => { setMethod('manual'); setStep(3); }}
                            >
                                <div className="p-2 bg-primary/10 rounded-full">
                                    <FileUp className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <div className="font-semibold text-sm">Direct Submission</div>
                                    <div className="text-[10px] text-muted-foreground">Short text, images, or direct files</div>
                                </div>
                            </Button>

                            <Button
                                variant="outline"
                                className="h-auto p-4 justify-start gap-4 text-left border-2 hover:border-red-500 transition-all"
                                onClick={() => { setMethod('youtube'); setStep(1); }}
                            >
                                <div className="p-2 bg-red-500/10 rounded-full">
                                    <Video className="h-5 w-5 text-red-600" />
                                </div>
                                <div>
                                    <div className="font-semibold text-sm">YouTube Link</div>
                                    <div className="text-[10px] text-muted-foreground">Best for long video presentations</div>
                                </div>
                            </Button>

                            <Button
                                variant="outline"
                                className="h-auto p-4 justify-start gap-4 text-left border-2 hover:border-blue-500 transition-all"
                                onClick={() => { setMethod('drive'); setStep(1); }}
                            >
                                <div className="p-2 bg-blue-500/10 rounded-full">
                                    <Cloud className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <div className="font-semibold text-sm">Cloud Drive Link</div>
                                    <div className="text-[10px] text-muted-foreground">Google Drive, Dropbox, etc.</div>
                                </div>
                            </Button>
                        </div>
                    </div>
                );

            case 1:
                return (
                    <div className="space-y-6 py-6 animate-in slide-in-from-right duration-300">
                        <div className="text-center space-y-2">
                            <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-xl font-bold">1</span>
                            </div>
                            <h3 className="font-bold text-lg">
                                {method === 'youtube' ? "Upload to YouTube" : "Prepare your Link"}
                            </h3>
                        </div>
                        <div className="p-4 bg-muted/30 rounded-lg space-y-3 text-sm leading-relaxed">
                            {method === 'youtube' ? (
                                <>
                                    <p>• Open <strong>YouTube</strong> on your computer or phone.</p>
                                    <p>• Click <strong>Create</strong> (the camera icon) and select <strong>Upload Video</strong>.</p>
                                    <p>• Choose your project video file to begin the upload process.</p>
                                </>
                            ) : (
                                <>
                                    <p>• Upload your files to <strong>Google Drive</strong> or <strong>OneDrive</strong>.</p>
                                    <p>• Right-click your file and select <strong>Share</strong> or <strong>Get Link</strong>.</p>
                                    <p>• ⚠️ <strong>IMPORTANT:</strong> Change access to <strong>'Anyone with the link'</strong>.</p>
                                </>
                            )}
                        </div>
                        <Button className="w-full" onClick={nextStep}>Got it, next step <ChevronRight className="ml-2 h-4 w-4" /></Button>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-6 py-6 animate-in slide-in-from-right duration-300">
                        <div className="text-center space-y-2">
                            <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-xl font-bold">2</span>
                            </div>
                            <h3 className="font-bold text-lg">
                                {method === 'youtube' ? "Privacy & Copying" : "Make it Public"}
                            </h3>
                        </div>
                        <div className="p-4 bg-muted/30 rounded-lg space-y-3 text-sm leading-relaxed">
                            {method === 'youtube' ? (
                                <>
                                    <p>• In 'Visibility', set the video as <strong>UNLISTED</strong>.</p>
                                    <p>• This means only those with the link (your instructors) can see it.</p>
                                    <p>• Copy the <strong>Video Link</strong> from the sidebar and finish.</p>
                                </>
                            ) : (
                                <>
                                    <p>• Ensure the permission is set to <strong>Viewer</strong>.</p>
                                    <p>• Click <strong>Copy Link</strong> to save it to your clipboard.</p>
                                    <p>• You are now ready to paste the link in the next screen.</p>
                                </>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={prevStep}>Back</Button>
                            <Button className="flex-2" onClick={nextStep}>Finalize Submission <ChevronRight className="ml-2 h-4 w-4" /></Button>
                        </div>
                    </div>
                );

            case 3:
                return (
                    <form onSubmit={handleSubmit} className="space-y-4 py-4 animate-in fade-in duration-300">
                        <div className="grid gap-4">
                            {method === 'manual' ? (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="content">Your Write-up</Label>
                                        <Textarea
                                            id="content"
                                            required
                                            value={formData.content}
                                            onChange={e => setFormData({ ...formData, content: e.target.value })}
                                            placeholder="Write your response or observations here..."
                                            rows={5}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Project Files (Pictures/Audio/Short Video)</Label>
                                        <FileUploader
                                            onUploadComplete={(url) => setFormData({ ...formData, fileUrl: url })}
                                            folder={`submissions/${task.id}`}
                                            label="Upload Asset"
                                        />
                                        {formData.fileUrl && (
                                            <p className="text-[10px] text-green-600 font-medium">✓ File ready for submission</p>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-2">
                                    <Label htmlFor="fileUrl">Paste your {method === 'youtube' ? 'YouTube' : 'Shared'} Link</Label>
                                    <Input
                                        id="fileUrl"
                                        required
                                        value={formData.fileUrl}
                                        onChange={e => setFormData({ ...formData, fileUrl: e.target.value })}
                                        placeholder={method === 'youtube' ? "https://youtu.be/..." : "https://drive.google.com/..."}
                                    />
                                    <p className="text-[10px] text-muted-foreground mt-1">
                                        {method === 'youtube'
                                            ? "Make sure your video is 'Unlisted' so we can view it."
                                            : "Ensure your link permission is set to 'Anyone with the link'."}
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3 pt-4 border-t">
                            <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(0)}>Change Method</Button>
                            <Button type="submit" className="flex-2" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Turn In Assignment
                            </Button>
                        </div>
                    </form>
                );
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(val) => {
            setIsOpen(val);
            if (!val) { setStep(0); setMethod(null); }
        }}>
            <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Submit Work
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {step > 0 && <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setStep(0)}><ChevronLeft className="h-4 w-4" /></Button>}
                        {task.title}
                    </DialogTitle>
                    <DialogDescription>
                        {step === 0 ? "Select your submission method to begin." : `Step ${step} of 3: Instructions`}
                    </DialogDescription>
                </DialogHeader>

                {renderStep()}
            </DialogContent>
        </Dialog>
    );
}
