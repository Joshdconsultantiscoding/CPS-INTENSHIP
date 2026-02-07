"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Share2 } from "lucide-react";
import type { CourseCertificate } from "@/lib/types";

interface CertificateTemplateProps {
    certificate: CourseCertificate;
    showActions?: boolean;
}

export function CertificateTemplate({ certificate, showActions = true }: CertificateTemplateProps) {
    const CERT_WIDTH = 1000;
    const CERT_HEIGHT = 700;

    const wrapperRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    // Responsive Preview Logic
    useEffect(() => {
        const updateScale = () => {
            if (wrapperRef.current) {
                const parentWidth = wrapperRef.current.offsetWidth;
                // Add some breathing room (32px padding)
                const availableWidth = parentWidth - 32;
                // Calculate scale (max 1 to avoid blurring on large screens, though user can zoom)
                // We allow it to go slightly above 1 on huge screens if needed, but 1 is safe default for "print size".
                // Actually, fitting to width is better.
                const newScale = Math.min(availableWidth / CERT_WIDTH, 1);
                setScale(newScale > 0 ? newScale : 0.1);
            }
        };

        // Initial sizing
        updateScale();

        // Observer for robust resizing
        const observer = new ResizeObserver(() => {
            requestAnimationFrame(updateScale);
        });

        if (wrapperRef.current) {
            observer.observe(wrapperRef.current);
        }

        return () => observer.disconnect();
    }, []);

    const handleDownload = async () => {
        // Dynamic import for PDF generation
        const html2canvas = (await import("html2canvas")).default;
        const { jsPDF } = await import("jspdf");

        // 1. Create a hidden iframe
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.left = '-10000px';
        iframe.style.top = '0';
        iframe.style.width = `${CERT_WIDTH}px`;
        iframe.style.height = `${CERT_HEIGHT}px`;
        iframe.style.border = 'none';
        iframe.style.visibility = 'hidden'; // Extra safety
        document.body.appendChild(iframe);

        try {
            // 0. Pre-load Logo as PNG Data URL (Most Robust Method)
            // We use the PNG version to avoid complexity with html2canvas parsing large SVGs
            let logoDataUrl = "";
            try {
                const logoResponse = await fetch('/logo.png'); // Use the PNG version
                const logoBlob = await logoResponse.blob();
                logoDataUrl = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(logoBlob);
                });
            } catch (err) {
                console.warn("Failed to load logo image:", err);
            }

            // 2. Construct Pristine HTML
            // We use a high-res PNG img tag which is universally supported
            const content = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        /* Reset everything */
                        * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact; }
                        
                        /* Font Imports */
                        @import url('https://fonts.googleapis.com/css2?family=Georgia&display=swap');
                        @import url('https://fonts.googleapis.com/css2?family=Brush+Script+MT&display=swap');
                        
                        body { 
                            margin: 0; 
                            padding: 0; 
                            background-color: #ffffff;
                            overflow: hidden; /* Prevent iframe scrollbars */
                        }
                        
                        .cert-container {
                            width: ${CERT_WIDTH}px;
                            height: ${CERT_HEIGHT}px;
                            position: relative;
                            background-color: #ffffff;
                            color: #1e3a5f;
                            font-family: "Georgia", "Times New Roman", serif;
                            overflow: hidden;
                        }
                    </style>
                </head>
                <body>
                    <div class="cert-container">
                        <!-- Borders -->
                        <div style="position: absolute; inset: 20px; border: 6px double #b8860b; border-radius: 4px; pointer-events: none; z-index: 10;"></div>
                        <div style="position: absolute; inset: 35px; border: 2px solid #1e3a5f; border-radius: 2px; pointer-events: none; z-index: 10;"></div>

                        <!-- Corners -->
                        <div style="position: absolute; top: 0; left: 0; width: 120px; height: 120px; background: radial-gradient(circle at 100% 100%, #b8860b 0%, transparent 70%); opacity: 0.4; z-index: 5;"></div>
                        <div style="position: absolute; top: 0; right: 0; width: 120px; height: 120px; background: radial-gradient(circle at 0% 100%, #b8860b 0%, transparent 70%); opacity: 0.4; z-index: 5;"></div>
                        <div style="position: absolute; bottom: 0; left: 0; width: 120px; height: 120px; background: radial-gradient(circle at 100% 0%, #b8860b 0%, transparent 70%); opacity: 0.4; z-index: 5;"></div>
                        <div style="position: absolute; bottom: 0; right: 0; width: 120px; height: 120px; background: radial-gradient(circle at 0% 0%, #b8860b 0%, transparent 70%); opacity: 0.4; z-index: 5;"></div>

                        <!-- Content -->
                        <div style="position: relative; height: 100%; display: flex; flex-direction: column; align-items: center; padding: 60px 80px; z-index: 20;">
                            
                            <!-- Header -->
                            <div style="text-align: center; margin-bottom: 20px;">
                                <div style="margin-bottom: 15px;">
                                    ${logoDataUrl ?
                    `<img src="${logoDataUrl}" alt="Logo" style="width: 100px; height: 100px; object-fit: contain; margin: 0 auto; display: block;" />` :
                    `<div style="width:100px; height:100px; background:#f3f4f6; border-radius:50%; margin:0 auto; display:flex; align-items:center; justify-content:center; color:#9ca3af; font-size:12px;">Logo</div>`
                }
                                </div>
                                <div style="font-size: 12px; letter-spacing: 0.5em; text-transform: uppercase; color: #6b7280; margin-bottom: 10px;">Cospronos Media</div>
                                <div style="height: 1px; width: 100px; background-color: #e5e7eb; margin: 0 auto;"></div>
                                <h2 style="font-size: 42px; font-weight: 700; color: #1e3a5f; margin: 15px 0 5px 0; letter-spacing: -0.02em;">Certificate of Completion</h2>
                            </div>

                            <!-- Body -->
                            <div style="text-align: center; width: 100%; max-width: 800px; flex-grow: 1; display: flex; flex-direction: column; justify-content: center;">
                                <p style="color: #4b5563; font-size: 18px; margin: 0;">This is to certify that</p>
                                
                                <h3 style="font-size: 56px; font-weight: 400; font-style: italic; color: #1e3a5f; font-family: 'Brush Script MT', cursive, serif; line-height: 1.1; margin: 15px 0;">
                                    ${certificate.intern_name}
                                </h3>

                                <p style="color: #4b5563; font-size: 18px; margin: 0;">has successfully completed the course</p>
                                
                                <h4 style="font-size: 28px; font-weight: 600; color: #b8860b; line-height: 1.3; margin: 15px 0;">
                                    "${certificate.course_title}"
                                </h4>

                                ${certificate.final_score ? `
                                    <p style="color: #4b5563; font-size: 16px; margin-top: 5px;">
                                        with a cumulative score of <span style="color: #16a34a; font-weight: 700;">${certificate.final_score}%</span>
                                    </p>
                                ` : ''}
                            </div>

                            <!-- Footer -->
                            <div style="width: 100%; display: flex; align-items: flex-end; justify-content: space-between; margin-top: 20px;">
                                <!-- Date -->
                                <div style="text-align: center; width: 160px;">
                                    <div style="margin-bottom: 10px;">
                                        <!-- Simple Icon for PDF -->
                                        <div style="width: 40px; height: 40px; background-color: #f9fafb; border-radius: 4px; margin: 0 auto; display: flex; align-items: center; justify-content: center; font-family: monospace; font-weight: bold; color: #1e3a5f; border: 1px solid #e5e7eb;">ID</div>
                                        <p style="font-size: 10px; font-family: monospace; color: #9ca3af; margin-top: 4px;">${certificate.certificate_id}</p>
                                    </div>
                                    <div style="border-top: 2px solid #d1d5db; padding-top: 8px;">
                                        <p style="font-weight: 700; font-size: 14px; color: #1e3a5f; margin: 0;">${formatDate(certificate.completion_date)}</p>
                                        <p style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #6b7280; margin: 0;">Date Issued</p>
                                    </div>
                                </div>

                                <!-- Seal -->
                                <div style="width: 100px; height: 100px; opacity: 0.5; margin-bottom: 5px;">
                                    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="50" cy="50" r="45" fill="none" stroke="#b8860b" stroke-width="2" />
                                        <circle cx="50" cy="50" r="40" fill="none" stroke="#b8860b" stroke-width="1" stroke-dasharray="2,2" />
                                        <text x="50" y="45" text-anchor="middle" font-size="8" fill="#b8860b" font-weight="bold" font-family="serif">COSPRONOS</text>
                                        <text x="50" y="55" text-anchor="middle" font-size="6" fill="#b8860b" font-family="serif">OFFICIAL SEAL</text>
                                        <text x="50" y="65" text-anchor="middle" font-size="5" fill="#b8860b" font-style="italic" font-family="serif">★ Verified ★</text>
                                    </svg>
                                </div>

                                <!-- Signature -->
                            <div style="text-align: center; width: 160px;">
                                <div style="margin-bottom: 8px; min-height: 40px; display: flex; align-items: flex-end; justify-content: center;">
                                    <p style="font-weight: 700; font-style: italic; font-size: 26px; font-family: 'Brush Script MT', cursive; color: #1e3a5f; line-height: 1; margin: 0;">
                                        ${certificate.admin_signature || "Cospronos Media"}
                                    </p>
                                </div>
                                <div style="border-top: 2px solid #d1d5db; padding-top: 8px;">
                                    <p style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #6b7280; margin: 0;">Authorized Signature</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `;

            const doc = iframe.contentDocument || iframe.contentWindow?.document;
            const iframeWindow = iframe.contentWindow;

            if (doc && iframeWindow) {
                doc.open();
                doc.write(content);
                doc.close();

                // Wait for image to be absolutely ready
                await new Promise(resolve => {
                    const img = doc.querySelector('img');
                    if (img) {
                        if (img.complete) {
                            resolve(null);
                        } else {
                            img.onload = () => resolve(null);
                            img.onerror = () => {
                                console.warn("Logo failed to load in iframe");
                                resolve(null);
                            };
                            // Safety timeout
                            setTimeout(resolve, 3000);
                        }
                    } else {
                        resolve(null);
                    }
                });

                // Slight delay for layout stability
                await new Promise(r => setTimeout(r, 500));

                // PASS THE IFRAME WINDOW CONTEXT which is critical for resolving styles correctly in isolation
                const canvas = await html2canvas(doc.body.firstElementChild as HTMLElement, {
                    scale: 2,
                    backgroundColor: "#ffffff",
                    logging: false,
                    useCORS: true,
                    window: iframeWindow, // Use the iframe's window object
                    width: CERT_WIDTH,
                    height: CERT_HEIGHT,
                    x: 0,
                    y: 0
                } as any);

                const imgData = canvas.toDataURL("image/png");
                const pdf = new jsPDF({
                    orientation: "landscape",
                    unit: "px",
                    format: [CERT_WIDTH, CERT_HEIGHT]
                });

                pdf.addImage(imgData, "PNG", 0, 0, CERT_WIDTH, CERT_HEIGHT);
                pdf.save(`Certificate-${certificate.certificate_id}.pdf`);
            } else {
                throw new Error("Could not access iframe content");
            }
        } catch (error) {
            console.error("Certificate Generation Error:", error);
            alert("There was an error generating the certificate. Please try again.");
        } finally {
            if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
            }
        }
    };

    const handleShare = async () => {
        const shareData = {
            title: `Certificate: ${certificate.course_title}`,
            text: `I completed ${certificate.course_title} at Cospronos Media!`,
            url: certificate.verification_url || window.location.href
        };

        if (navigator.share) {
            await navigator.share(shareData);
        } else {
            await navigator.clipboard.writeText(shareData.url);
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    };

    return (
        <div
            className="w-full flex flex-col items-center justify-center p-4 md:p-8"
            ref={wrapperRef}
        >
            {/* 
                Responsive Container:
                Takes up exactly the scaled width/height in the DOM.
                This prevents "ghost" dimensions from messing up mobile scrolling or centering.
            */}
            <div
                style={{
                    width: `${CERT_WIDTH * scale}px`,
                    height: `${CERT_HEIGHT * scale}px`,
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', // shadow-2xl equivalent
                }}
                className="bg-white"
            >
                {/* 
                    Fixed-Size Certificate:
                    Rendered at full 1000x700 resolution, then scaled down.
                    Transform origin is top-left so it fills the responsive container exactly.
                */}
                <div
                    style={{
                        width: `${CERT_WIDTH}px`,
                        height: `${CERT_HEIGHT}px`,
                        transform: `scale(${scale})`,
                        transformOrigin: 'top left',
                    }}
                    className="bg-white text-[#1e3a5f]"
                >
                    <div
                        className="relative w-full h-full"
                        style={{
                            fontFamily: "Georgia, 'Times New Roman', serif",
                            backgroundColor: "#ffffff",
                        }}
                    >
                        {/* Decorative Borders */}
                        <div className="absolute inset-[20px] border-double border-[6px] border-[#b8860b] rounded-[4px] pointer-events-none z-10" />
                        <div className="absolute inset-[35px] border-[2px] border-[#1e3a5f] rounded-[2px] pointer-events-none z-10" />

                        {/* Corner Accents */}
                        <div className="absolute top-0 left-0 w-[120px] h-[120px] bg-[radial-gradient(circle_at_100%_100%,_#b8860b_0%,_transparent_70%)] opacity-40 z-0" />
                        <div className="absolute top-0 right-0 w-[120px] h-[120px] bg-[radial-gradient(circle_at_0%_100%,_#b8860b_0%,_transparent_70%)] opacity-40 z-0" />
                        <div className="absolute bottom-0 left-0 w-[120px] h-[120px] bg-[radial-gradient(circle_at_100%_0%,_#b8860b_0%,_transparent_70%)] opacity-40 z-0" />
                        <div className="absolute bottom-0 right-0 w-[120px] h-[120px] bg-[radial-gradient(circle_at_0%_0%,_#b8860b_0%,_transparent_70%)] opacity-40 z-0" />

                        {/* Content Container */}
                        <div className="relative h-full flex flex-col items-center px-20 py-16 z-20">

                            {/* Header */}
                            <div className="text-center mb-5">
                                <div className="mb-4">
                                    {/* Enhanced Logo Check to avoid broken image icon if path is wrong */}
                                    <img
                                        src="/logo.png"
                                        alt="Logo"
                                        className="w-[100px] h-[100px] object-contain mx-auto block"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                            // Fallback text if image fails
                                            if (e.currentTarget.parentElement) {
                                                const fallback = document.createElement('div');
                                                fallback.innerText = 'Logo';
                                                fallback.className = 'w-[100px] h-[100px] bg-gray-100 rounded-full mx-auto flex items-center justify-center text-gray-400 text-xs';
                                                e.currentTarget.parentElement.appendChild(fallback);
                                            }
                                        }}
                                    />
                                </div>
                                <div className="text-xs tracking-[0.5em] uppercase text-gray-500 mb-2">Cospronos Media</div>
                                <div className="h-px w-[100px] bg-gray-200 mx-auto" />
                                <h2 className="text-[42px] font-bold text-[#1e3a5f] mt-4 mb-1 tracking-tight">Certificate of Completion</h2>
                            </div>

                            {/* Body */}
                            <div className="text-center w-full max-w-[800px] flex-grow flex flex-col justify-center">
                                <p className="text-gray-600 text-[18px] m-0">This is to certify that</p>

                                <h3 className="text-[56px] font-normal italic text-[#1e3a5f] font-[family-name:var(--font-brush-script)] leading-[1.1] my-4" style={{ fontFamily: "'Brush Script MT', cursive" }}>
                                    {certificate.intern_name}
                                </h3>

                                <p className="text-gray-600 text-[18px] m-0">has successfully completed the course</p>

                                <h4 className="text-[28px] font-semibold text-[#b8860b] leading-[1.3] my-4">
                                    "{certificate.course_title}"
                                </h4>

                                {certificate.final_score && (
                                    <p className="text-gray-600 text-[16px] mt-1">
                                        with a cumulative score of <span className="text-green-600 font-bold">{certificate.final_score}%</span>
                                    </p>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="w-full flex items-end justify-between mt-5">
                                {/* Date */}
                                <div className="text-center w-40">
                                    <div className="mb-2">
                                        <div className="w-10 h-10 bg-gray-50 rounded mx-auto flex items-center justify-center font-mono font-bold text-[#1e3a5f] border border-gray-200">ID</div>
                                        <p className="text-[10px] font-mono text-gray-400 mt-1">{certificate.certificate_id}</p>
                                    </div>
                                    <div className="border-t-2 border-gray-300 pt-2">
                                        <p className="font-bold text-sm text-[#1e3a5f]">{formatDate(certificate.completion_date)}</p>
                                        <p className="text-[10px] uppercase tracking-wider text-gray-500">Date Issued</p>
                                    </div>
                                </div>

                                {/* Seal */}
                                <div className="w-[100px] h-[100px] opacity-50 mb-1">
                                    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="50" cy="50" r="45" fill="none" stroke="#b8860b" strokeWidth="2" />
                                        <circle cx="50" cy="50" r="40" fill="none" stroke="#b8860b" strokeWidth="1" strokeDasharray="2,2" />
                                        <text x="50" y="45" textAnchor="middle" fontSize="8" fill="#b8860b" fontWeight="bold">COSPRONOS</text>
                                        <text x="50" y="55" textAnchor="middle" fontSize="6" fill="#b8860b">OFFICIAL SEAL</text>
                                        <text x="50" y="65" textAnchor="middle" fontSize="5" fill="#b8860b" fontStyle="italic">★ Verified ★</text>
                                    </svg>
                                </div>

                                {/* Signature */}
                                <div className="text-center w-40">
                                    <div className="mb-2 min-h-[40px] flex items-end justify-center">
                                        <p className="font-bold italic text-2xl text-[#1e3a5f] font-serif leading-none" style={{ fontFamily: "'Brush Script MT', cursive" }}>
                                            {certificate.admin_signature || "Cospronos Media"}
                                        </p>
                                    </div>
                                    <div className="border-t-2 border-gray-300 pt-2">
                                        <p className="text-[10px] uppercase tracking-wider text-gray-500">Authorized Signature</p>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 mt-8 w-full max-w-md justify-center">
                <Button
                    onClick={handleDownload}
                    className="flex-1 bg-[#1e3a5f] hover:bg-[#162c46] text-white py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all rounded-xl"
                >
                    <Download className="mr-2 h-5 w-5" />
                    Download PDF
                </Button>

                <Button
                    variant="outline"
                    className="flex-1 border-gray-200 hover:bg-gray-50 text-gray-700 py-6 text-lg font-semibold shadow-sm hover:shadow-md transition-all rounded-xl"
                    onClick={() => {
                        const verifyUrl = `${window.location.origin}/verify/${certificate.certificate_id}`;

                        if (navigator.share) {
                            navigator.share({
                                title: `Certificate for ${certificate.intern_name}`,
                                text: `Check out my certificate for ${certificate.course_title}!`,
                                url: verifyUrl,
                            }).catch(console.error);
                        } else {
                            // Fallback
                            navigator.clipboard.writeText(verifyUrl);
                            alert("Verification link copied to clipboard!");
                        }
                    }}
                >
                    <Share2 className="mr-2 h-5 w-5" />
                    Share Honor
                </Button>
            </div>

            <style jsx global>{`
                @font-face {
                    font-family: 'Brush Script MT';
                    src: local('Brush Script MT'), url('https://fonts.cdnfonts.com/s/13903/BrushScriptMTItalic.woff') format('woff');
                }
            `}</style>
        </div>
    );
}
