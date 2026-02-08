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
    Share2,
    GraduationCap
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
                <div className="mb-10 text-center">
                    <div className="flex items-center justify-center gap-3 mb-3">
                        <Trophy className="h-8 w-8 text-amber-500" />
                        <h1 className="text-3xl font-bold tracking-tight text-[#1e3a5f]">My Certificates</h1>
                    </div>
                    <p className="text-muted-foreground max-w-lg mx-auto">
                        View and download your earned certificates for completing modules and courses.
                    </p>
                </div>

                {certificates.length === 0 ? (
                    <Card className="text-center py-16 max-w-lg mx-auto border-dashed">
                        <CardContent>
                            <GraduationCap className="h-20 w-20 mx-auto text-muted-foreground/30 mb-6" />
                            <h3 className="text-xl font-semibold mb-2 text-[#1e3a5f]">No Certificates Yet</h3>
                            <p className="text-muted-foreground mb-8 text-sm">
                                Complete courses to earn your certificates and showcase your achievements.
                            </p>
                            <Button asChild size="lg" className="rounded-full">
                                <Link href="/dashboard/classroom/courses">
                                    Start Learning
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="flex flex-wrap justify-center gap-8">
                        {certificates.map((cert: any) => (
                            <Card key={cert.id} className="w-full md:max-w-md overflow-hidden hover:shadow-2xl hover:translate-y-[-4px] transition-all duration-300 border-muted/20">
                                <div className="aspect-[1.414] bg-gradient-to-br from-[#fff7ed] to-[#fef3c7] dark:from-amber-950/20 dark:to-yellow-900/10 relative group">
                                    <div className="absolute inset-0 flex items-center justify-center p-6 transition-transform duration-500 group-hover:scale-105">
                                        <div className="text-center">
                                            <div className="bg-white/90 p-4 rounded-full shadow-sm mx-auto mb-4 inline-block backdrop-blur-sm">
                                                <GraduationCap className="h-10 w-10 text-amber-500" />
                                            </div>
                                            <h4 className="font-bold text-xl line-clamp-2 text-[#1e3a5f] mb-2">{cert.course_title}</h4>
                                            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">{cert.intern_name}</p>
                                        </div>
                                    </div>
                                    {cert.status === "active" && (
                                        <Badge className="absolute top-4 right-4 bg-green-500/90 backdrop-blur-md hover:bg-green-600 border-none shadow-sm px-3 py-1">
                                            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                                            Verified
                                        </Badge>
                                    )}
                                </div>
                                <CardContent className="p-5">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                                            <Calendar className="h-3.5 w-3.5" />
                                            {new Date(cert.completion_date).toLocaleDateString("en-US", {
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric"
                                            })}
                                        </div>
                                        <div className="font-mono text-[10px] text-muted-foreground/60 select-all">
                                            #{cert.certificate_number}
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <Button
                                            variant="outline"
                                            className="flex-1 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 transition-colors"
                                            asChild
                                        >
                                            <Link href={`/verify/${cert.certificate_id}`} target="_blank">
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
