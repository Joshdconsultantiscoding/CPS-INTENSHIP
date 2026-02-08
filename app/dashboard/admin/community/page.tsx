"use client";

import { useState, useEffect } from "react";
import {
    Plus,
    Trash2,
    Ban,
    CheckCircle2,
    Search,
    LayoutGrid,
    Users,
    Activity,
    Loader2,
    UserPlus,
    Target,
    BrainCircuit,
    AlertTriangle,
    FileText,
    Calendar,
    Edit3,
    Eye,
    Globe,
    RefreshCcw
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    getNiches,
    createNiche,
    deleteNiche,
    updateNiche,
    getAllMemberships,
    manageMembership,
    getAllProfiles,
    adminAddInternToNiche,
    getAllOnboardingResponses,
    getPosts,
    type Niche,
    type NicheMembership,
    type Post
} from "@/app/actions/community";
import { createClient } from "@/lib/supabase/client";
import { useLoading } from "@/hooks/use-loading";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PostCard } from "@/components/community/post-card";
import { PostComposer } from "@/components/community/post-composer";
import { useUser } from "@clerk/nextjs";

export default function AdminCommunityPage() {
    const { user: clerkUser } = useUser();
    const [niches, setNiches] = useState<Niche[]>([]);
    const [memberships, setMemberships] = useState<NicheMembership[]>([]);
    const [profiles, setProfiles] = useState<any[]>([]);
    const [responses, setResponses] = useState<any[]>([]);
    const [globalPosts, setGlobalPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const { setIsLoading } = useLoading();
    const [search, setSearch] = useState("");
    const [adminNicheChoice, setAdminNicheChoice] = useState<string>("global");
    const router = useRouter();

    // Form state for new niche
    const [newNiche, setNewNiche] = useState({ name: "", description: "", icon: "Sparkles" });
    const [isCreating, setIsCreating] = useState(false);

    // Form state for editing niche
    const [editingNiche, setEditingNiche] = useState<Niche | null>(null);
    const [editData, setEditData] = useState({ name: "", description: "" });
    const [isUpdating, setIsUpdating] = useState(false);

    // Form state for adding intern
    const [assignment, setAssignment] = useState({ userId: "", nicheId: "" });
    const [isAssigning, setIsAssigning] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        setIsLoading(loading);
        return () => setIsLoading(false);
    }, [loading, setIsLoading]);

    // Real-time Subscriptions
    useEffect(() => {
        const nichesSub = supabase
            .channel('public:community_niches')
            .on('postgres_changes', { event: '*', table: 'community_niches' }, () => {
                refreshNiches();
            })
            .subscribe();

        const postsSub = supabase
            .channel('public:posts')
            .on('postgres_changes', { event: 'INSERT', table: 'posts' }, () => {
                refreshPosts();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(nichesSub);
            supabase.removeChannel(postsSub);
        };
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [nRes, mRes, pRes, rRes, poRes] = await Promise.all([
            getNiches(),
            getAllMemberships(),
            getAllProfiles(),
            getAllOnboardingResponses(),
            getPosts(50, 0) // Fetch all posts globally
        ]);
        if (nRes.success) setNiches(nRes.niches);
        if (mRes.success) setMemberships(mRes.memberships || []);
        if (pRes.success) setProfiles(pRes.profiles || []);
        if (rRes.success) setResponses(rRes.responses || []);
        if (poRes.success) setGlobalPosts(poRes.posts || []);
        setLoading(false);
    };

    const refreshNiches = async () => {
        const res = await getNiches();
        if (res.success) setNiches(res.niches);
    };

    const refreshPosts = async () => {
        const res = await getPosts(50, 0);
        if (res.success) setGlobalPosts(res.posts || []);
    };

    const handleCreateNiche = async () => {
        if (!newNiche.name) return;
        setIsCreating(true);
        const res = await createNiche(newNiche.name, newNiche.description, newNiche.icon);
        if (res.success) {
            toast.success("Community created!");
            setNewNiche({ name: "", description: "", icon: "Sparkles" });
            loadData();
        } else {
            toast.error(res.error || "Failed to create");
        }
        setIsCreating(false);
    };

    const handleUpdateNiche = async () => {
        if (!editingNiche || !editData.name) return;
        setIsUpdating(true);
        const res = await updateNiche(editingNiche.id, {
            name: editData.name,
            description: editData.description
        });
        if (res.success) {
            toast.success("Community updated!");
            setEditingNiche(null);
            refreshNiches();
        } else {
            toast.error(res.error || "Failed to update");
        }
        setIsUpdating(false);
    };

    const handleToggleNicheStatus = async (niche: Niche) => {
        const newStatus = !niche.is_active;
        const res = await updateNiche(niche.id, { is_active: newStatus });
        if (res.success) {
            toast.success(`Community ${newStatus ? 'activated' : 'suspended'}`);
            refreshNiches();
        } else {
            toast.error(res.error || "Failed to toggle status");
        }
    };

    const handleAssignIntern = async () => {
        if (!assignment.userId || !assignment.nicheId) return;
        setIsAssigning(true);
        const res = await adminAddInternToNiche(assignment.userId, assignment.nicheId);
        if (res.success) {
            toast.success("Intern assigned successfully");
            setAssignment({ userId: "", nicheId: "" });
            loadData();
        } else {
            toast.error(res.error || "Failed to assign intern");
        }
        setIsAssigning(false);
    };

    const handleDeleteNiche = async (id: string) => {
        if (!confirm("Are you sure? All posts in this niche will be deleted.")) return;
        const res = await deleteNiche(id);
        if (res.success) {
            toast.success("Community deleted");
            loadData();
        } else {
            toast.error(res.error || "Failed to delete");
        }
    };

    const handleStatusUpdate = async (userId: string, nicheId: string, currentStatus: string) => {
        const newStatus = currentStatus === "active" ? "suspended" : "active";
        const res = await manageMembership(userId, nicheId, newStatus as any);
        if (res.success) {
            toast.success(`User ${newStatus}`);
            loadData();
        } else {
            toast.error(res.error || "Failed to update status");
        }
    };

    const filteredMemberships = memberships.filter(m =>
        m.profile?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        m.niche?.name?.toLowerCase().includes(search.toLowerCase())
    );

    const filteredResponses = responses.filter(r =>
        r.profile?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.niche?.name?.toLowerCase().includes(search.toLowerCase())
    );

    const filteredNiches = niches.filter(n =>
        n.name.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return null;
    }

    return (
        <div className="space-y-8 pb-12">
            <div className="bg-card p-6 rounded-3xl border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-extrabold tracking-tight">Community Command Center</h1>
                    <p className="text-muted-foreground font-medium">Real-time monitoring and administrative control.</p>
                </div>
                <div className="flex gap-3">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-6 rounded-2xl shadow-xl shadow-primary/10 transition-all active:scale-95">
                                <Plus className="h-4 w-4" />
                                Community
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] rounded-3xl border-none shadow-2xl">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold tracking-tight">Create Community</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-5 pt-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold">Community Name</label>
                                    <Input
                                        className="rounded-2xl h-12 bg-muted/50 border-input"
                                        placeholder="e.g. AI & ML Enthusiasts"
                                        value={newNiche.name}
                                        onChange={e => setNewNiche({ ...newNiche, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold">Description</label>
                                    <Input
                                        className="rounded-2xl h-12 bg-muted/50 border-input"
                                        placeholder="Briefly describe the purpose..."
                                        value={newNiche.description}
                                        onChange={e => setNewNiche({ ...newNiche, description: e.target.value })}
                                    />
                                </div>
                                <Button
                                    className="w-full h-12 rounded-2xl font-bold"
                                    onClick={handleCreateNiche}
                                    disabled={isCreating || !newNiche.name}
                                >
                                    {isCreating ? <Loader2 className="animate-spin mr-2" /> : <Plus className="mr-2 h-4 w-4" />}
                                    Launch Community
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                    <Button variant="outline" size="icon" className="rounded-2xl" onClick={loadData}>
                        <RefreshCcw className={`h-4 w-4 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="activity" className="space-y-6">
                <TabsList className="bg-muted/50 p-1.5 rounded-2xl h-14 border">
                    <TabsTrigger value="activity" className="rounded-xl px-8 font-bold data-[state=active]:bg-background data-[state=active]:shadow-lg data-[state=active]:text-primary">
                        <Activity className="h-4 w-4 mr-2" />
                        All Activity
                    </TabsTrigger>
                    <TabsTrigger value="niches" className="rounded-xl px-8 font-bold data-[state=active]:bg-background data-[state=active]:shadow-lg">
                        <LayoutGrid className="h-4 w-4 mr-2" />
                        Communities
                    </TabsTrigger>
                    <TabsTrigger value="insights" className="rounded-xl px-8 font-bold data-[state=active]:bg-background data-[state=active]:shadow-lg">
                        <BrainCircuit className="h-4 w-4 mr-2" />
                        Onboarding
                    </TabsTrigger>
                    <TabsTrigger value="members" className="rounded-xl px-8 font-bold data-[state=active]:bg-background data-[state=active]:shadow-lg">
                        <Users className="h-4 w-4 mr-2" />
                        Access
                    </TabsTrigger>
                </TabsList>

                {/* ALL ACTIVITY FEED */}
                <TabsContent value="activity" className="space-y-6">
                    <div className="flex flex-col md:flex-row items-center gap-4 bg-card p-4 rounded-3xl border shadow-sm">
                        <div className="relative flex-1">
                            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <div className="pl-12 py-1 text-muted-foreground font-bold text-xs">
                                Monitoring {globalPosts.length} conversations across all {niches.length} communities.
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Post to:</span>
                            <Select value={adminNicheChoice} onValueChange={setAdminNicheChoice}>
                                <SelectTrigger className="w-[180px] h-9 rounded-xl font-bold text-xs transition-all">
                                    <SelectValue placeholder="Select Target" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-none shadow-2xl">
                                    <SelectItem value="global">🌐 All Communities</SelectItem>
                                    {niches.map(n => (
                                        <SelectItem key={n.id} value={n.id}>📍 {n.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="max-w-3xl mx-auto space-y-8">
                        {/* Admin Command Composer */}
                        <div className="relative">
                            <div className="absolute -top-3 left-6 bg-primary text-primary-foreground px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest z-10 shadow-lg shadow-primary/20">
                                {adminNicheChoice === 'global' ? 'Global Broadcast' : `Posting to ${niches.find(n => n.id === adminNicheChoice)?.name}`}
                            </div>
                            <PostComposer
                                userId={clerkUser?.id || ""}
                                userAvatar={profiles.find(p => p.id === clerkUser?.id)?.avatar_url || clerkUser?.imageUrl}
                                userName={profiles.find(p => p.id === clerkUser?.id)?.full_name || clerkUser?.fullName}
                                isAdmin={true}
                                nicheId={adminNicheChoice === 'global' ? undefined : adminNicheChoice}
                            />
                        </div>

                        <div className="h-px bg-border w-full" />
                        {globalPosts.map((post) => (
                            <div key={post.id} className="relative group">
                                <div className="absolute -left-12 top-6 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center gap-2">
                                    <div className="h-10 w-10 rounded-full bg-card shadow-lg border flex items-center justify-center text-muted-foreground" title={post.niche?.name || "Global"}>
                                        <Globe className="h-4 w-4" />
                                    </div>
                                </div>
                                <div className="bg-primary/10 px-4 py-1.5 rounded-t-2xl border-x border-t border-primary/20 w-fit text-[10px] font-extrabold text-primary uppercase tracking-tighter ml-4">
                                    {post.niche?.name || "Global Feed"}
                                </div>
                                <PostCard
                                    post={post}
                                    currentUserId={clerkUser?.id || ""}
                                    isAdmin={true}
                                />
                            </div>
                        ))}
                        {globalPosts.length === 0 && (
                            <div className="text-center py-20 bg-muted/30 rounded-[2.5rem] border-2 border-dashed">
                                <Loader2 className="h-10 w-10 animate-spin mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-xl font-bold text-muted-foreground">Waiting for conversations...</h3>
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* COMMUNITIES LIST - WITH EDIT/SUSPEND */}
                <TabsContent value="niches" className="space-y-6">
                    <div className="flex items-center gap-4 bg-card p-4 rounded-3xl border shadow-sm">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                placeholder="Search communities..."
                                className="pl-12 rounded-2xl h-12 bg-muted/50 border-transparent focus:bg-background focus:border-primary/20 transition-all font-medium"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredNiches.map(niche => (
                            <Card key={niche.id} className={`overflow-hidden rounded-[2rem] border shadow-sm transition-all hover:shadow-xl ${!niche.is_active ? 'opacity-60 grayscale' : ''}`}>
                                <CardHeader className="p-6 pb-2">
                                    <div className="flex items-center justify-between">
                                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                            <LayoutGrid className="h-6 w-6" />
                                        </div>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10"
                                                onClick={() => {
                                                    setEditingNiche(niche);
                                                    setEditData({ name: niche.name, description: niche.description || "" });
                                                }}
                                            >
                                                <Edit3 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className={`rounded-xl ${niche.is_active ? 'text-muted-foreground hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20' : 'text-primary hover:bg-primary/10'}`}
                                                onClick={() => handleToggleNicheStatus(niche)}
                                            >
                                                {niche.is_active ? <Ban className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="rounded-xl text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                onClick={() => handleDeleteNiche(niche.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <CardTitle className="text-xl font-bold mt-4">{niche.name}</CardTitle>
                                    <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem] mt-1">{niche.description}</p>
                                </CardHeader>
                                <CardContent className="p-6 pt-2 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Badge variant={niche.is_active ? "secondary" : "destructive"} className="rounded-lg font-bold">
                                            {niche.is_active ? "Active" : "Suspended"}
                                        </Badge>
                                        <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">
                                            {new Date(niche.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <Button
                                        className="w-full h-11 rounded-2xl font-bold gap-2 active:scale-95 transition-all shadow-lg"
                                        onClick={() => router.push(`/dashboard/community/${niche.id}`)}
                                    >
                                        <Eye className="h-4 w-4" />
                                        Enter Community
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Edit Niche Dialog */}
                    <Dialog open={!!editingNiche} onOpenChange={(open) => !open && setEditingNiche(null)}>
                        <DialogContent className="rounded-[2rem] border-none shadow-2xl">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold tracking-tight">Edit Community</DialogTitle>
                                <DialogDescription>Update the name and purpose of this sub-community.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold">Name</label>
                                    <Input
                                        className="rounded-2xl h-12 bg-muted/50 border-input"
                                        value={editData.name}
                                        onChange={e => setEditData({ ...editData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold">Description</label>
                                    <Input
                                        className="rounded-2xl h-12 bg-muted/50 border-input"
                                        value={editData.description}
                                        onChange={e => setEditData({ ...editData, description: e.target.value })}
                                    />
                                </div>
                            </div>
                            <DialogFooter className="pt-6">
                                <Button variant="ghost" className="rounded-2xl" onClick={() => setEditingNiche(null)}>Cancel</Button>
                                <Button className="rounded-2xl px-8 font-bold" onClick={handleUpdateNiche} disabled={isUpdating}>
                                    {isUpdating ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                                    Save Changes
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </TabsContent>

                {/* ONBOARDING INSIGHTS */}
                <TabsContent value="insights" className="space-y-6">
                    <div className="flex items-center gap-4 bg-card p-4 rounded-3xl border shadow-sm">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                placeholder="Filter insights by intern name or niche..."
                                className="pl-12 rounded-2xl h-12 bg-muted/50 border-transparent focus:bg-background focus:border-primary/20 transition-all"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredResponses.map((res) => (
                            <Card key={res.id} className="overflow-hidden border bg-card shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] rounded-[2.5rem] transition-all hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)]">
                                <CardHeader className="flex flex-row items-center gap-5 border-b p-6">
                                    <div className="relative">
                                        <Avatar className="h-14 w-14 ring-4 ring-background border">
                                            <AvatarImage src={res.profile?.avatar_url || ""} />
                                            <AvatarFallback className="bg-primary/10 text-primary font-bold">{res.profile?.full_name?.[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-4 border-background" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-xl font-bold tracking-tight">{res.profile?.full_name}</CardTitle>
                                            <div className="flex items-center text-muted-foreground text-xs font-medium">
                                                <Calendar className="h-3.5 w-3.5 mr-1" />
                                                {new Date(res.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <Badge variant="secondary" className="mt-1.5 font-bold px-3 py-1 rounded-lg">
                                            {res.niche?.name}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8 space-y-8">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2.5 text-xs font-extrabold text-primary uppercase tracking-widest">
                                            <BrainCircuit className="h-4 w-4" />
                                            Interests & Learning Needs
                                        </div>
                                        <p className="text-foreground/80 bg-primary/5 p-5 rounded-3xl border border-primary/10 leading-relaxed font-medium">
                                            {res.interests}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2.5 text-xs font-extrabold text-blue-500 uppercase tracking-widest">
                                                <Target className="h-4 w-4" />
                                                Core Goals
                                            </div>
                                            <p className="text-sm text-foreground/80 bg-blue-500/5 p-4 rounded-2xl border border-blue-500/10 font-medium">
                                                {res.goals}
                                            </p>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2.5 text-xs font-extrabold text-red-500 uppercase tracking-widest">
                                                <AlertTriangle className="h-4 w-4" />
                                                Challenges
                                            </div>
                                            <p className="text-sm text-foreground/80 bg-red-500/5 p-4 rounded-2xl border border-red-500/10 font-medium">
                                                {res.pain_points}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* ACCESS MANAGEMENT */}
                <TabsContent value="members" className="space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-4 rounded-3xl border shadow-sm">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or email..."
                                className="pl-12 rounded-2xl h-12 bg-muted/50 border-transparent focus:bg-background focus:border-primary/20 transition-all font-medium"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-8 rounded-2xl shadow-xl shadow-emerald-500/10 active:scale-95 transition-all h-12 font-bold">
                                    <UserPlus className="h-5 w-5" />
                                    Assign Access
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px] rounded-3xl border-none shadow-2xl">
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-bold tracking-tight">Manual Assignment</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 pt-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold">Intern</label>
                                        <Select onValueChange={(v) => setAssignment({ ...assignment, userId: v })} value={assignment.userId}>
                                            <SelectTrigger className="h-12 rounded-2xl bg-muted/50 border-input">
                                                <SelectValue placeholder="Choose intern..." />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl">
                                                {profiles.map(p => (
                                                    <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold">Target Community</label>
                                        <Select onValueChange={(v) => setAssignment({ ...assignment, nicheId: v })} value={assignment.nicheId}>
                                            <SelectTrigger className="h-12 rounded-2xl bg-muted/50 border-input">
                                                <SelectValue placeholder="Choose community..." />
                                            </SelectTrigger>
                                            <SelectContent className="rounded-2xl">
                                                {niches.map(n => (
                                                    <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button className="w-full h-12 rounded-2xl" onClick={handleAssignIntern} disabled={isAssigning || !assignment.userId || !assignment.nicheId}>
                                        {isAssigning ? <Loader2 className="animate-spin mr-2" /> : <UserPlus className="mr-2 h-4 w-4" />}
                                        Grant Access
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="bg-card border rounded-[2.5rem] overflow-hidden shadow-sm">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow className="hover:bg-transparent px-4 border-b">
                                    <TableHead className="font-bold py-6 px-8">Member Identity</TableHead>
                                    <TableHead className="font-bold py-6">Community Path</TableHead>
                                    <TableHead className="font-bold py-6">Status</TableHead>
                                    <TableHead className="font-bold py-6">Active Since</TableHead>
                                    <TableHead className="text-right font-bold py-6 px-8">Management</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredMemberships.map(m => (
                                    <TableRow key={m.id} className="border-b hover:bg-muted/30 transition-colors">
                                        <TableCell className="py-5 px-8">
                                            <div className="flex items-center gap-4">
                                                <Avatar className="h-10 w-10 border">
                                                    <AvatarImage src={m.profile?.avatar_url || ""} />
                                                    <AvatarFallback className="bg-muted text-muted-foreground">{m.profile?.full_name?.[0]}</AvatarFallback>
                                                </Avatar>
                                                <span className="font-bold">{m.profile?.full_name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-muted-foreground font-bold px-3 py-1 rounded-lg">{m.niche?.name}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className={`h-2 w-2 rounded-full ${m.status === 'active' ? "bg-emerald-500" : "bg-red-400"}`} />
                                                <span className={`text-xs font-extrabold uppercase tracking-widest ${m.status === 'active' ? "text-emerald-500" : "text-red-500"}`}>
                                                    {m.status}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground font-medium text-sm">
                                            {new Date(m.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right py-5 px-8">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className={`rounded-xl font-bold px-4 ${m.status === 'active' ? "text-red-500 hover:bg-red-500/10 hover:text-red-600" : "text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-600"}`}
                                                onClick={() => handleStatusUpdate(m.user_id, m.niche_id, m.status)}
                                            >
                                                {m.status === 'active' ? <Ban className="h-4 w-4 mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                                                {m.status === 'active' ? "Revoke" : "Restore"}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
