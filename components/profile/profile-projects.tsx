"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Plus, FolderKanban, ExternalLink } from "lucide-react";
import type { Project } from "@/lib/types/profile";
import { cn } from "@/lib/utils";

interface ProfileProjectsProps {
    projects: Project[];
    isOwner: boolean;
    onAdd?: () => void;
    onEdit?: (project: Project) => void;
}

export function ProfileProjects({
    projects,
    isOwner,
    onAdd,
    onEdit,
}: ProfileProjectsProps) {
    if (projects.length === 0 && !isOwner) return null;

    return (
        <Card className="border-none shadow-lg bg-card/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xl flex items-center gap-2">
                    <FolderKanban className="h-5 w-5" />
                    Projects
                </CardTitle>
                {isOwner && (
                    <Button variant="ghost" size="icon" onClick={onAdd}>
                        <Plus className="h-4 w-4" />
                    </Button>
                )}
            </CardHeader>
            <CardContent>
                {projects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {projects.map((project) => (
                            <div
                                key={project.id}
                                className="group relative overflow-hidden rounded-xl border bg-card hover:shadow-lg transition-all duration-300"
                            >
                                {/* Media */}
                                {project.media_url && (
                                    <div className="aspect-video overflow-hidden bg-muted">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={project.thumbnail_url || project.media_url}
                                            alt={project.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    </div>
                                )}

                                {/* Content */}
                                <div className="p-4">
                                    <div className="flex items-start justify-between gap-2">
                                        <h3 className="font-semibold text-foreground line-clamp-1">
                                            {project.title}
                                        </h3>
                                        <div className="flex gap-1 flex-shrink-0">
                                            {project.link && (
                                                <a
                                                    href={project.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1 rounded hover:bg-muted transition-colors"
                                                >
                                                    <ExternalLink className="h-4 w-4 text-primary" />
                                                </a>
                                            )}
                                            {isOwner && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => onEdit?.(project)}
                                                >
                                                    <Pencil className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {project.description && (
                                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                                            {project.description}
                                        </p>
                                    )}

                                    {project.tags && project.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-3">
                                            {project.tags.slice(0, 3).map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                            {project.tags.length > 3 && (
                                                <span className="px-2 py-0.5 text-xs text-muted-foreground">
                                                    +{project.tags.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground/50 italic text-center py-8">
                        Showcase your projects here...
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
