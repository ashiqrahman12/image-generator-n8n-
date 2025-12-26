"use client";

import Link from "next/link";
import { Sparkles, LayoutGrid, Zap, Menu, X, ChevronRight, Star, Info, Mail, ArrowRight } from "lucide-react";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const BdtSymbol = ({ className }: { className?: string }) => (
    <span className={cn("font-bold text-xl leading-none flex items-center justify-center pb-1", className)}>৳</span>
);

const navLinks = [
    { name: "Features", href: "/features", icon: Star },
    { name: "Pricing", href: "/pricing", icon: BdtSymbol },
    { name: "About", href: "/about", icon: Info },
    { name: "Contact", href: "/contact", icon: Mail },
];

export function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Lock body scroll when menu is open
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [mobileMenuOpen]);

    return (
        <header
            className={cn(
                "fixed top-0 left-0 right-0 z-[100] transition-all duration-300 px-4 py-4",
                scrolled ? "py-3" : "py-5"
            )}
        >
            <nav className={cn(
                "max-w-7xl mx-auto h-14 px-4 rounded-2xl transition-all duration-300 flex items-center justify-between",
                scrolled ? "glass shadow-2xl shadow-black/50 border-white/5" : "bg-transparent border-transparent"
            )}>
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2 group shrink-0">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)] group-hover:scale-110 transition-transform">
                        <Sparkles className="h-4 w-4 text-black" />
                    </div>
                    <span className="font-bold text-sm sm:text-base text-white tracking-tight">Antigravity AI</span>
                </Link>

                {/* Nav Links - Desktop */}
                <div className="hidden md:flex items-center gap-1">
                    {navLinks.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="px-4 py-2 rounded-full text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all"
                        >
                            {item.name}
                        </Link>
                    ))}
                    <Link
                        href="/library"
                        className="px-4 py-2 rounded-full text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2"
                    >
                        <LayoutGrid className="w-4 h-4" />
                        Gallery
                    </Link>
                </div>

                {/* Desktop Actions - Clerk Auth */}
                <div className="hidden md:flex items-center gap-3">
                    <SignedOut>
                        <SignInButton mode="modal">
                            <button className="h-10 px-6 bg-white rounded-full text-black text-xs font-semibold uppercase tracking-[0.15em] hover:bg-zinc-200 transition-all flex items-center gap-2 active:scale-95 shadow-[0_0_25px_rgba(255,255,255,0.2)]">
                                Sign In
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </SignInButton>
                    </SignedOut>
                    <SignedIn>
                        <UserButton
                            afterSignOutUrl="/"
                            appearance={{
                                elements: {
                                    avatarBox: "w-10 h-10 border-2 border-white/30 rounded-full"
                                }
                            }}
                        />
                    </SignedIn>
                </div>

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="md:hidden p-2 text-white hover:bg-white/10 rounded-xl transition-colors"
                    aria-label="Toggle menu"
                >
                    <AnimatePresence mode="wait">
                        {mobileMenuOpen ? (
                            <motion.div
                                key="close"
                                initial={{ rotate: -90, opacity: 0 }}
                                animate={{ rotate: 0, opacity: 1 }}
                                exit={{ rotate: 90, opacity: 0 }}
                                transition={{ duration: 0.15 }}
                            >
                                <X className="w-6 h-6" />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="menu"
                                initial={{ rotate: 90, opacity: 0 }}
                                animate={{ rotate: 0, opacity: 1 }}
                                exit={{ rotate: -90, opacity: 0 }}
                                transition={{ duration: 0.15 }}
                            >
                                <Menu className="w-6 h-6" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </button>
            </nav>

            {/* Mobile Fullscreen Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className="md:hidden fixed inset-0 top-[72px] bg-zinc-950/98 backdrop-blur-xl z-[99] overflow-y-auto"
                    >
                        <div className="p-6 space-y-2">
                            {/* Navigation Links */}
                            {navLinks.map((item, index) => (
                                <motion.div
                                    key={item.name}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <Link
                                        href={item.href}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                                <item.icon className="w-5 h-5 text-white" />
                                            </div>
                                            <span className="text-lg font-semibold text-white">{item.name}</span>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                    </Link>
                                </motion.div>
                            ))}

                            {/* Gallery Link */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: navLinks.length * 0.05 }}
                            >
                                <Link
                                    href="/library"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                            <LayoutGrid className="w-5 h-5 text-white" />
                                        </div>
                                        <span className="text-lg font-semibold text-white">Gallery</span>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                </Link>
                            </motion.div>

                            {/* Divider */}
                            <div className="my-6 border-t border-white/10" />

                            {/* Auth Section - Clerk */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <SignedOut>
                                    <SignInButton mode="modal">
                                        <button
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="w-full py-4 rounded-2xl bg-white text-black font-bold text-lg flex items-center justify-center gap-3 hover:bg-zinc-200 transition-all active:scale-[0.98] shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                                        >
                                            Sign In
                                            <ArrowRight className="w-5 h-5" />
                                        </button>
                                    </SignInButton>
                                </SignedOut>
                                <SignedIn>
                                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                                        <span className="text-white font-semibold">My Account</span>
                                        <UserButton
                                            afterSignOutUrl="/"
                                            appearance={{
                                                elements: {
                                                    avatarBox: "w-12 h-12 border-2 border-white/20 rounded-full"
                                                }
                                            }}
                                        />
                                    </div>
                                </SignedIn>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mobile Bottom Navigation - Floating Glass */}
            <AnimatePresence>
                {!mobileMenuOpen && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[400px] h-14 glass rounded-2xl flex items-center justify-around px-2 z-[100] shadow-2xl shadow-black/50"
                    >
                        <Link href="/" className="flex flex-col items-center gap-1 p-2 text-zinc-400 hover:text-white transition-colors">
                            <Zap className="w-5 h-5" />
                            <span className="text-[10px] font-medium tracking-tight">Create</span>
                        </Link>
                        <div className="relative -top-4">
                            <Link href="/" className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.4)] ring-4 ring-zinc-950 transition-transform active:scale-90">
                                <Sparkles className="w-6 h-6 text-black" />
                            </Link>
                        </div>
                        <Link href="/library" className="flex flex-col items-center gap-1 p-2 text-zinc-400 hover:text-white transition-colors">
                            <LayoutGrid className="w-5 h-5" />
                            <span className="text-[10px] font-medium tracking-tight">Gallery</span>
                        </Link>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
