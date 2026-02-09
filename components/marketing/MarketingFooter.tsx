import Link from "next/link";
import Image from "next/image";
import { Twitter, Linkedin, Github, Mail } from "lucide-react";

const footerLinks = {
    product: [
        { href: "/features", label: "Features" },
        { href: "/platform", label: "Platform" },
        { href: "/pricing", label: "Pricing" },
        { href: "/how-it-works", label: "How It Works" },
    ],
    solutions: [
        { href: "/solutions", label: "For Interns" },
        { href: "/solutions", label: "For Mentors" },
        { href: "/solutions", label: "For Companies" },
        { href: "/solutions", label: "For Management" },
    ],
    resources: [
        { href: "/resources", label: "Blog" },
        { href: "/resources", label: "Help Center" },
        { href: "/resources", label: "Documentation" },
        { href: "/resources", label: "FAQ" },
    ],
    company: [
        { href: "/about", label: "About" },
        { href: "/contact", label: "Contact" },
        { href: "/mentors", label: "Mentors" },
        { href: "/companies", label: "Companies" },
    ],
};

const socialLinks = [
    { href: "https://twitter.com", icon: Twitter, label: "Twitter" },
    { href: "https://linkedin.com", icon: Linkedin, label: "LinkedIn" },
    { href: "https://github.com", icon: Github, label: "GitHub" },
    { href: "mailto:hello@cpsintern.com", icon: Mail, label: "Email" },
];

export function MarketingFooter() {
    return (
        <footer className="border-t border-border/40 bg-gradient-to-b from-background to-muted/30">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Main Footer */}
                <div className="py-16 grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
                    {/* Brand Column */}
                    <div className="col-span-2 md:col-span-4 lg:col-span-1 mb-8 lg:mb-0">
                        <Link href="/" className="flex items-center gap-2.5 mb-4">
                            <div className="relative h-10 w-10">
                                <Image
                                    src="/logo.png"
                                    alt="CPS Intern Logo"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">CPS Intern</span>
                        </Link>
                        <p className="text-sm text-muted-foreground max-w-xs mb-6">
                            The AI-powered workforce platform where interns learn, teams collaborate, and companies hire top talent.
                        </p>
                        <div className="flex items-center gap-3">
                            {socialLinks.map((social) => (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                                    aria-label={social.label}
                                >
                                    <social.icon className="h-4 w-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Link Columns */}
                    <div>
                        <h3 className="text-sm font-semibold text-foreground mb-4">Product</h3>
                        <ul className="space-y-3">
                            {footerLinks.product.map((link) => (
                                <li key={link.label}>
                                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-foreground mb-4">Solutions</h3>
                        <ul className="space-y-3">
                            {footerLinks.solutions.map((link, i) => (
                                <li key={i}>
                                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-foreground mb-4">Resources</h3>
                        <ul className="space-y-3">
                            {footerLinks.resources.map((link) => (
                                <li key={link.label}>
                                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-foreground mb-4">Company</h3>
                        <ul className="space-y-3">
                            {footerLinks.company.map((link) => (
                                <li key={link.label}>
                                    <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-border/40 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-muted-foreground">
                        © {new Date().getFullYear()} CPS Intern. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6">
                        <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                            Privacy Policy
                        </Link>
                        <Link href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                            Terms of Service
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
