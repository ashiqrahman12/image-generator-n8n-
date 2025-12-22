"use client";

import Link from "next/link";
import { Sparkles, Library, LogOut, ArrowRight, LayoutGrid, Zap } from "lucide-react";
import { useGoogleLogin, googleLogout } from "@react-oauth/google";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface GoogleUser {
    name: string;
    picture: string;
    email: string;
    access_token?: string;
}

export function Navbar() {
    const [user, setUser] = useState<GoogleUser | null>(null);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        const storedUser = localStorage.getItem("googleUser");
        if (storedUser) setUser(JSON.parse(storedUser));
    }, []);

    const login = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const userInfo = await res.json();
                const newUserData = { ...userInfo, access_token: tokenResponse.access_token };
                setUser(newUserData);
                localStorage.setItem("googleUser", JSON.stringify(newUserData));
            } catch (error) {
                console.error("Failed to fetch user info", error);
            }
        },
    });

    const handleLogout = () => {
        googleLogout();
        setUser(null);
        localStorage.removeItem("googleUser");
    };

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
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)] group-hover:scale-110 transition-transform">
                        <Sparkles className="h-4 w-4 text-black" />
                    </div>
                    <span className="font-bold text-base text-white tracking-tight">Antigravity AI</span>
                </Link>

                {/* Nav Links - Desktop */}
                <div className="hidden md:flex items-center gap-1">
                    {[
                        { name: "Create", href: "/", icon: Zap },
                        { name: "Gallery", href: "/library", icon: LayoutGrid },
                    ].map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="px-5 py-2 rounded-full text-sm font-bold text-white/80 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2.5"
                        >
                            <item.icon className="w-4 h-4" />
                            {item.name}
                        </Link>
                    ))}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    {user ? (
                        <div className="flex items-center gap-3 bg-white/10 pl-4 pr-1.5 py-1.5 rounded-full border border-white/20">
                            <span className="hidden sm:block text-xs font-bold text-white uppercase tracking-wider">{user.name.split(' ')[0]}</span>
                            <img src={user.picture} alt="Profile" className="w-8 h-8 rounded-full border border-white/30" />
                            <button
                                onClick={handleLogout}
                                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => login()}
                            className="h-10 px-6 bg-white rounded-full text-black text-xs font-bold uppercase tracking-[0.15em] hover:bg-zinc-200 transition-all flex items-center gap-2.5 active:scale-95 shadow-[0_0_25px_rgba(255,255,255,0.2)]"
                        >
                            Sign In
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </nav>

            {/* Mobile Bottom Navigation - Floating Glass */}
            <AnimatePresence>
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
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
            </AnimatePresence>
        </header>
    );
}
