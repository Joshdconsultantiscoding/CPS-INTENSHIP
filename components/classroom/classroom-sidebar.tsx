"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { GraduationCap, BookOpen, Layout, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useState } from "react";

interface ClassroomSidebarProps {
    assignedClasses: {
        id: string;
        name: string;
    }[];
    activeClassId?: string;
    activeClassName?: string;
}

export function ClassroomSidebar({ assignedClasses, activeClassId, activeClassName }: ClassroomSidebarProps) {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    const isInsideClass = !!activeClassId;

    const SidebarContent = () => (
        <div className="flex flex-col gap-6 p-4 h-full">
            {isInsideClass ? (
                // Inside a Class Navigation
                <div>
                    <div className="mb-4 flex items-center gap-2 px-2">
                        <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                            <Link href="/dashboard/classroom">
                                <Menu className="h-4 w-4 rotate-180" />
                            </Link>
                        </Button>
                        <h2 className="text-lg font-semibold tracking-tight truncate" title={activeClassName}>
                            {activeClassName}
                        </h2>
                    </div>
                    <div className="space-y-1">
                        {[
                            { name: "Overview", icon: Layout, href: `/dashboard/classroom/classes/${activeClassId}` },
                            { name: "Announcements", icon: Menu, href: `/dashboard/classroom/classes/${activeClassId}?tab=announcements` },
                            { name: "Tasks", icon: BookOpen, href: `/dashboard/classroom/classes/${activeClassId}?tab=tasks` },
                            { name: "Courses", icon: GraduationCap, href: `/dashboard/classroom/classes/${activeClassId}?tab=courses` },
                            { name: "Chat", icon: Menu, href: `/dashboard/classroom/classes/${activeClassId}?tab=chat` },
                            { name: "Members", icon: GraduationCap, href: `/dashboard/classroom/classes/${activeClassId}?tab=members` },
                        ].map((item) => (
                            <Button
                                key={item.name}
                                variant={pathname.endsWith(item.href) || pathname === item.href ? "secondary" : "ghost"}
                                className="w-full justify-start"
                                asChild
                                onClick={() => setOpen(false)}
                            >
                                <Link href={item.href}>
                                    <item.icon className="mr-2 h-4 w-4" />
                                    {item.name}
                                </Link>
                            </Button>
                        ))}
                    </div>
                </div>
            ) : (
                // Main Classroom Navigation
                <div>
                    <h2 className="px-2 text-lg font-semibold tracking-tight mb-2">
                        Classroom
                    </h2>
                    <div className="space-y-1">
                        <Button
                            variant={pathname === "/dashboard/classroom" ? "secondary" : "ghost"}
                            className="w-full justify-start"
                            asChild
                            onClick={() => setOpen(false)}
                        >
                            <Link href="/dashboard/classroom">
                                <Layout className="mr-2 h-4 w-4" />
                                Overview
                            </Link>
                        </Button>
                        <Button
                            variant={pathname.startsWith("/dashboard/classroom/courses") ? "secondary" : "ghost"}
                            className="w-full justify-start"
                            asChild
                            onClick={() => setOpen(false)}
                        >
                            <Link href="/dashboard/classroom/courses">
                                <GraduationCap className="mr-2 h-4 w-4" />
                                Course Marketplace
                            </Link>
                        </Button>
                    </div>
                </div>
            )}

            {!isInsideClass && (
                <div>
                    <h2 className="px-2 text-lg font-semibold tracking-tight mb-2">
                        My Classes
                    </h2>
                    <div className="space-y-1">
                        {assignedClasses.length === 0 ? (
                            <p className="px-2 text-sm text-muted-foreground">
                                No classes assigned yet.
                            </p>
                        ) : (
                            assignedClasses.map((cls) => (
                                <Button
                                    key={cls.id}
                                    variant={pathname.startsWith(`/dashboard/classroom/classes/${cls.id}`) ? "secondary" : "ghost"}
                                    className="w-full justify-start truncate"
                                    asChild
                                    onClick={() => setOpen(false)}
                                >
                                    <Link href={`/dashboard/classroom/classes/${cls.id}`} title={cls.name}>
                                        <BookOpen className="mr-2 h-4 w-4" />
                                        <span className="truncate">{cls.name}</span>
                                    </Link>
                                </Button>
                            ))
                        )}
                    </div>
                </div>
            )}

            {isInsideClass && (
                <div className="mt-auto">
                    <Button variant="outline" className="w-full" asChild>
                        <Link href="/dashboard/classroom">
                            Back to Classroom
                        </Link>
                    </Button>
                </div>
            )}
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <div className="hidden md:flex md:w-64 border-r bg-muted/10 h-full flex-col">
                <SidebarContent />
            </div>

            {/* Mobile Trigger (Floating or Header) */}
            <div className="md:hidden p-4 border-b flex items-center gap-2">
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon">
                            <Menu className="h-5 w-5" />
                            <span className="sr-only">Toggle Classroom Menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[80%] max-w-xs p-0">
                        <SheetHeader className="px-4 pt-4 text-left">
                            <SheetTitle>Classroom Menu</SheetTitle>
                        </SheetHeader>
                        <div className="pt-2">
                            <SidebarContent />
                        </div>
                    </SheetContent>
                </Sheet>
                <span className="font-semibold text-lg">Classroom Menu</span>
            </div>
        </>
    );
}
