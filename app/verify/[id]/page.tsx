import { verifyCertificate } from "@/actions/certificate";
import { CertificateTemplate } from "@/components/classroom/certificate-template";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

interface VerifyPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function VerifyCertificatePage(props: VerifyPageProps) {
    const params = await props.params;
    const result = await verifyCertificate(params.id);

    if (!result.success || !result.certificate) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <Card className="max-w-md w-full">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                            <XCircle className="h-8 w-8 text-red-500" />
                        </div>
                        <CardTitle>Certificate Not Found</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center text-muted-foreground">
                        <p>The certificate with ID <strong>{params?.id || "Unknown"}</strong> could not be found.</p>
                        <p className="mt-2">Please verify the certificate ID and try again.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const { certificate, isValid } = result;

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8 px-4">
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Verification Status */}
                <Card className={isValid ? "border-green-200 bg-green-50/50" : "border-red-200 bg-red-50/50"}>
                    <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {isValid ? (
                                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                                ) : (
                                    <AlertTriangle className="h-6 w-6 text-red-500" />
                                )}
                                <div>
                                    <h2 className="font-semibold">
                                        {isValid ? "Certificate Verified" : "Certificate Revoked"}
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        ID: {certificate.certificate_id}
                                    </p>
                                </div>
                            </div>
                            <Badge variant={isValid ? "default" : "destructive"}>
                                {isValid ? "Valid" : "Revoked"}
                            </Badge>
                        </div>
                        {!isValid && certificate.revoked_reason && (
                            <p className="mt-2 text-sm text-red-600">
                                Reason: {certificate.revoked_reason}
                            </p>
                        )}
                    </CardContent>
                </Card>

                {/* Certificate Preview */}
                <CertificateTemplate certificate={certificate} showActions={isValid} />

                {/* Details */}
                <Card>
                    <CardHeader>
                        <CardTitle>Certificate Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <dt className="text-muted-foreground">Recipient</dt>
                                <dd className="font-medium">{certificate.intern_name}</dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground">Course</dt>
                                <dd className="font-medium">{certificate.course_title}</dd>
                            </div>
                            <div>
                                <dt className="text-muted-foreground">Completion Date</dt>
                                <dd className="font-medium">
                                    {new Date(certificate.completion_date).toLocaleDateString()}
                                </dd>
                            </div>
                            {certificate.final_score && (
                                <div>
                                    <dt className="text-muted-foreground">Score</dt>
                                    <dd className="font-medium text-green-600">{certificate.final_score}%</dd>
                                </div>
                            )}
                        </dl>
                    </CardContent>
                </Card>

                {/* Footer */}
                <p className="text-center text-sm text-muted-foreground">
                    This certificate was issued by Cospronos Media Intern Management Platform.
                </p>
            </div>
        </div>
    );
}
