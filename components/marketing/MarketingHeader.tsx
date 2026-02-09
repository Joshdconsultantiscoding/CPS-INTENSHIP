"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, Twitter, Linkedin, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
    { href: "/", label: "Home" },
    { href: "/platform", label: "Platform" },
    { href: "/features", label: "Features" },
    { href: "/solutions", label: "Solutions" },
    { href: "/how-it-works", label: "How It Works" },
    { href: "/pricing", label: "Pricing" },
    {
        label: "More",
        children: [
            { href: "/resources", label: "Resources" },
            { href: "/about", label: "About" },
            { href: "/contact", label: "Contact" },
            { href: "/mentors", label: "Mentors" },
            { href: "/companies", label: "Companies" },
        ],
    },
];

export function MarketingHeader() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    // Track scroll
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <header
            className={cn(
                "sticky top-0 z-50 w-full transition-all duration-300",
                scrolled
                    ? "bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 py-2 shadow-sm"
                    : "bg-transparent py-4"
            )}
        >
            <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 md:gap-3 group relative z-50">
                    <div className="relative h-8 w-8 md:h-9 md:w-9 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6">
                        <Image
                            src="/logo.png"
                            alt="CPS Intern Logo"
                            fill
                            className="object-contain drop-shadow-md"
                            priority
                        />
                    </div>
                    <span className="text-lg md:text-xl font-black tracking-tighter text-foreground whitespace-nowrap">
                        CPS <span className="text-sky-500">Intern</span>
                    </span>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden lg:flex lg:items-center lg:gap-2 bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-md">
                    {navLinks.map((link) =>
                        link.children ? (
                            <div key={link.label} className="relative">
                                <button
                                    onMouseEnter={() => setDropdownOpen(true)}
                                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-all rounded-xl hover:bg-white dark:hover:bg-slate-900 shadow-xs"
                                >
                                    {link.label}
                                    <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-300", dropdownOpen ? "rotate-180" : "")} />
                                </button>
                                <AnimatePresence>
                                    {dropdownOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            transition={{ duration: 0.2, ease: "easeOut" }}
                                            className="absolute right-0 mt-3 w-56 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl shadow-2xl p-2 z-[60]"
                                            onMouseLeave={() => setDropdownOpen(false)}
                                        >
                                            {link.children.map((child) => (
                                                <Link
                                                    key={child.href}
                                                    href={child.href}
                                                    className="block px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-500/10 rounded-xl transition-all"
                                                    onClick={() => setDropdownOpen(false)}
                                                >
                                                    {child.label}
                                                </Link>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="px-4 py-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-all rounded-xl hover:bg-white dark:hover:bg-slate-900 shadow-xs"
                            >
                                {link.label}
                            </Link>
                        )
                    )}
                </div>

                {/* Auth Buttons */}
                <div className="flex items-center gap-2 sm:gap-3 relative z-50">
                    <Link
                        href="/auth/sign-in"
                        className="hidden md:block text-sm font-bold text-muted-foreground hover:text-foreground transition-colors px-4 py-2"
                    >
                        Login
                    </Link>
                    <Button asChild size="sm" className="hidden sm:flex bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-full h-10 px-6 shadow-lg shadow-sky-500/20 border-none transition-all hover:scale-105 active:scale-95">
                        <Link href="/auth/sign-up">Sign Up</Link>
                    </Button>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="lg:hidden p-2.5 text-foreground bg-slate-100 dark:bg-slate-800 rounded-xl hover:scale-105 active:scale-95 transition-all outline-hidden ring-sky-500/20 focus:ring-4"
                        aria-label="Toggle menu"
                    >
                        {mobileMenuOpen ? <X className="h-5 w-5 md:h-6 md:w-6" /> : <Menu className="h-5 w-5 md:h-6 md:w-6" />}
                    </button>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed inset-0 z-40 lg:hidden bg-white/80 dark:bg-slate-950/80 backdrop-blur-3xl"
                    >
                        <div className="flex flex-col h-full pt-28 px-6 pb-12 overflow-y-auto">
                            {/* Section: Main Navigation */}
                            <div className="flex flex-col gap-3">
                                <span className="text-[10px] font-black text-sky-500 uppercase tracking-[0.2em] px-2 mb-2">Navigation</span>
                                {navLinks.map((link, i) => (
                                    <motion.div
                                        key={link.label}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.04 }}
                                    >
                                        {link.children ? (
                                            <div className="space-y-3">
                                                <div className="p-4 bg-slate-100/50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
                                                    <span className="text-sm font-bold text-muted-foreground">{link.label}</span>
                                                    <div className="grid grid-cols-2 gap-2 mt-3">
                                                        {link.children.map((child) => (
                                                            <Link
                                                                key={child.href}
                                                                href={child.href}
                                                                className="px-4 py-3 text-sm font-bold text-foreground bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 transition-all active:scale-95 shadow-sm"
                                                                onClick={() => setMobileMenuOpen(false)}
                                                            >
                                                                {child.label}
                                                            </Link>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <Link
                                                href={link.href}
                                                className="group flex items-center justify-between p-5 bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm active:scale-[0.98] transition-all"
                                                onClick={() => setMobileMenuOpen(false)}
                                            >
                                                <span className="text-xl font-black text-foreground tracking-tight group-hover:text-sky-500 transition-colors">{link.label}</span>
                                                <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-sky-500 group-hover:text-white transition-all">
                                                    <ChevronDown className="h-4 w-4 -rotate-90" />
                                                </div>
                                            </Link>
                                        )}
                                    </motion.div>
                                ))}
                            </div>

                            {/* Section: Action Center */}
                            <div className="mt-12 space-y-4">
                                <span className="text-[10px] font-black text-sky-500 uppercase tracking-[0.2em] px-2">Account Control</span>
                                <div className="grid grid-cols-2 gap-4">
                                    <Button asChild variant="outline" className="h-16 rounded-2xl border-2 font-black text-lg active:scale-95">
                                        <Link href="/auth/sign-in" onClick={() => setMobileMenuOpen(false)}>Login</Link>
                                    </Button>
                                    <Button asChild className="h-16 rounded-2xl bg-sky-500 text-white font-black text-lg shadow-xl shadow-sky-500/20 active:scale-95">
                                        <Link href="/auth/sign-up" onClick={() => setMobileMenuOpen(false)}>Join Now</Link>
                                    </Button>
                                </div>
                            </div>

                            {/* Section: Menu Footer */}
                            <div className="mt-auto pt-10 border-t border-slate-200 dark:border-slate-800 flex flex-col items-center gap-6">
                                <div className="flex gap-4">
                                    {[
                                        { icon: Twitter, href: "https://twitter.com" },
                                        { icon: Linkedin, href: "https://linkedin.com" },
                                        { icon: Github, href: "https://github.com" },
                                    ].map((social, i) => (
                                        <motion.a
                                            key={i}
                                            href={social.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.5 + i * 0.1 }}
                                            className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-muted-foreground hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-500/10 transition-all border border-slate-200/50 dark:border-slate-700/50"
                                        >
                                            <social.icon className="h-5 w-5" />
                                        </motion.a>
                                    ))}
                                </div>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] text-center opacity-50">
                                    © {new Date().getFullYear()} CPS Intern Systems
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}

