import { Suspense } from "react";
import { getAuthUser } from "@/lib/auth";
import { getUserCertificates } from "@/actions/certificate";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Award,
    Download,
    ExternalLink,
    Calendar,
    Trophy,
    CheckCircle2,
    Share2
} from "lucide-react";
import Link from "next/link";
import { CertificatePreview } from "@/components/classroom/certificate-preview";

export default async function CertificatesPage() {
    const user = await getAuthUser();
    const result = await getUserCertificates();
    const certificates = result.certificates || [];

    return (
        <div className="flex flex-col items-center w-full min-h-screen">
            <div className="w-full max-w-5xl px-4 py-8">
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <Trophy className="h-8 w-8 text-amber-500" />
                        <h1 className="text-3xl font-bold tracking-tight">My Certificates</h1>
                    </div>
                    <p className="text-muted-foreground">
                        View and download your earned certificates
                    </p>
                </div>

                {certificates.length === 0 ? (
                    <Card className="text-center py-12">
                        <CardContent>
                            <Award className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                            <h3 className="text-xl font-semibold mb-2">No Certificates Yet</h3>
                            <p className="text-muted-foreground mb-6">
                                Complete courses to earn your certificates
                            </p>
                            <Button asChild>
                                <Link href="/dashboard/classroom/courses">
                                    Browse Courses
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                        {certificates.map((cert: any) => (
                            <Card key={cert.id} className="overflow-hidden hover:shadow-lg transition-shadow border-muted/20">
                                <div className="aspect-[1.414] bg-gradient-to-br from-[#fff7ed] to-[#fef3c7] dark:from-amber-950/20 dark:to-yellow-900/10 relative">
                                    <div className="absolute inset-0 flex items-center justify-center p-4">
                                        <div className="text-center">
                                            <Award className="h-12 w-12 mx-auto text-amber-500 mb-2" />
                                            <h4 className="font-bold text-lg line-clamp-2">{cert.course_title}</h4>
                                            <p className="text-sm text-muted-foreground mt-1">{cert.intern_name}</p>
                                        </div>
                                    </div>
                                    {cert.status === "active" && (
                                        <Badge className="absolute top-3 right-3 bg-green-500 hover:bg-green-600 border-none">
                                            <CheckCircle2 className="h-3 w-3 mr-1" />
                                            Verified
                                        </Badge>
                                    )}
                                </div>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Calendar className="h-4 w-4" />
                                            {new Date(cert.completion_date).toLocaleDateString("en-US", {
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric"
                                            })}
                                        </div>
                                        <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0 border-muted-foreground/30 text-muted-foreground">
                                            {cert.certificate_number}
                                        </Badge>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1"
                                            asChild
                                        >
                                            <Link href={`/verify/${cert.id}`} target="_blank">
                                                <ExternalLink className="h-4 w-4 mr-2" />
                                                Verify
                                            </Link>
                                        </Button>
                                        <CertificatePreview certificate={cert} />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
