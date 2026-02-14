import { getAuthUser } from "@/lib/auth";
import { AppealsService } from "@/lib/services/appeals-service";
import { AppealsManagement } from "@/components/admin/appeals-management";
import { redirect } from "next/navigation";

export default async function AppealsPage() {
    const user = await getAuthUser();

    if (user.role !== 'admin') {
        redirect("/dashboard");
    }

    const appeals = await AppealsService.getAppeals();

    return (
        <div className="container mx-auto py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Appeals</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage account restoration requests.
                    </p>
                </div>
            </div>

            <AppealsManagement appeals={appeals} />
        </div>
    );
}
