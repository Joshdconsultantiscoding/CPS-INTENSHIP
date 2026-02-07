import { Suspense } from "react";
import { getAuthUser } from "@/lib/auth";
import { getStudentCourses } from "@/actions/classroom-student";
import { CourseCard } from "@/components/classroom/course-card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export const metadata = {
    title: "Course Marketplace | InternHub",
};

export default async function CoursesPage({
    searchParams,
}: {
    searchParams: Promise<{ q?: string }>;
}) {
    await getAuthUser();
    const resolvedSearchParams = await searchParams;
    const query = resolvedSearchParams?.q || "";

    const courses = await getStudentCourses(query);

    return (
        <div className="container py-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Course Marketplace</h1>
                    <p className="text-muted-foreground">Expand your knowledge with our curated courses.</p>
                </div>

                <div className="relative w-full md:w-96">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    {/* Search is server-side via URL params in a real app, simplified here */}
                    <form action="/dashboard/classroom/courses" method="get">
                        <Input
                            name="q"
                            type="search"
                            placeholder="Search courses..."
                            className="pl-9"
                            defaultValue={query}
                        />
                    </form>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {(!courses || courses.length === 0) ? (
                    <div className="col-span-full text-center py-12">
                        <p className="text-lg text-muted-foreground">No courses found matching your criteria.</p>
                    </div>
                ) : (
                    courses.map((course: any) => (
                        <CourseCard
                            key={course.id}
                            id={course.id}
                            title={course.title}
                            description={course.description}
                            price={Number(course.price)}
                            thumbnailUrl={course.thumbnail_url}
                            level={course.level}
                            durationMinutes={course.duration_minutes}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
