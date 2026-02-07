import { ChangelogService } from "@/lib/changelog/changelog-service";
import { ChangelogList } from "@/components/updates/changelog-list";
import { Sparkles, History } from "lucide-react";

export default async function UpdatesPage() {
    const changelogs = await ChangelogService.getChangelogs();

    return (
        <div className="container max-w-5xl py-12 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="text-center space-y-4 max-w-3xl mx-auto">
                <div className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-primary/10 text-primary border border-primary/20 mb-2">
                    <Sparkles className="mr-1 h-3.5 w-3.5" />
                    Product Updates
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">What&apos;s New at CPS Intern</h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                    Check out our latest releases, new features, and improvements we&apos;ve made to the platform.
                </p>
                <div className="flex items-center justify-center gap-2 pt-2">
                    <History className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground font-medium uppercase tracking-widest">Version History</span>
                </div>
            </div>

            {/* Timeline Section */}
            <div className="pt-8">
                <ChangelogList changelogs={changelogs} />
            </div>

            {/* Footer / Call to Action */}
            <div className="text-center pt-12 pb-24 border-t border-dashed">
                <p className="text-muted-foreground italic text-sm">
                    Keep your application updated for the best experience.
                </p>
            </div>
        </div>
    );
}
