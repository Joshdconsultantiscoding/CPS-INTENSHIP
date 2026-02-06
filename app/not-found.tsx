import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default function NotFound() {
    return (
        <div className="flex h-screen flex-col items-center justify-center bg-background text-foreground">
            <h2 className="text-4xl font-bold tracking-tight">404</h2>
            <p className="mb-8 text-muted-foreground">Page not found</p>
            <Button asChild>
                <Link href="/dashboard">Return Home</Link>
            </Button>
        </div>
    );
}
