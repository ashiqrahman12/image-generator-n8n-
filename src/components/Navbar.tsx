"use client";

import Link from "next/link";
import { Sparkles, Menu, Home, Library, LogOut, ArrowRight } from "lucide-react";
import { useGoogleLogin, googleLogout } from "@react-oauth/google";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface GoogleUser {
    name: string;
    picture: string;
    email: string;
    access_token?: string;
}

import { ThemeTogglerButton } from "@/components/animate-ui/components/buttons/theme-toggler";

export function Navbar() {
    const [user, setUser] = useState<GoogleUser | null>(null);

    // Check for persisted session on mount
    useEffect(() => {
        const storedUser = localStorage.getItem("googleUser");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
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
        onError: () => console.log('Login Failed'),
    });

    const handleLogout = () => {
        googleLogout();
        setUser(null);
        localStorage.removeItem("googleUser");
    };

    return (
        <nav className="h-16 border-b border-border bg-white dark:bg-gray-900 sticky top-0 z-50 transition-colors">
            <div className="h-full container mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2.5 group">
                    <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/25 group-hover:shadow-lg group-hover:shadow-primary/30 transition-shadow">
                        <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-bold text-lg text-foreground tracking-tight">ImageGen</span>
                </Link>

                {/* Nav Links - Desktop */}
                <div className="hidden md:flex items-center gap-8">
                    <Link href="/library" className="text-sm font-medium text-muted hover:text-primary transition-colors">
                        Image Gallery
                    </Link>
                    <Link href="#" className="text-sm font-medium text-muted hover:text-primary transition-colors">
                        Pricing
                    </Link>
                    <Link href="#" className="text-sm font-medium text-muted hover:text-primary transition-colors">
                        API
                    </Link>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    <ThemeTogglerButton />
                    {user ? (
                        <div className="flex items-center gap-3">
                            <div className="hidden sm:block text-right">
                                <p className="text-xs font-bold text-foreground">{user.name}</p>
                                <p className="text-[10px] text-muted">{user.email}</p>
                            </div>
                            <img src={user.picture} alt="Profile" className="w-9 h-9 rounded-full border border-border shadow-sm" />
                            <button
                                onClick={handleLogout}
                                className="p-2 text-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Sign out"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <motion.button
                            whileHover="hover"
                            onClick={() => login()}
                            className="relative group cursor-pointer"
                        >
                            <motion.div
                                variants={{ hover: { opacity: 1, scale: 1.1 } }}
                                initial={{ opacity: 0, scale: 0.8 }}
                                className="absolute -inset-1 bg-primary/30 rounded-full blur-md"
                            />
                            <div className="relative relative px-6 py-2.5 bg-primary rounded-full text-white text-sm font-semibold shadow-lg shadow-primary/30 flex items-center gap-2 transition-transform active:scale-95">
                                Get Started
                                <motion.div variants={{ hover: { x: 4 } }}>
                                    <ArrowRight className="w-4 h-4" />
                                </motion.div>
                            </div>
                        </motion.button>
                    )}
                </div>
            </div>

            {/* Mobile Bottom Tab Bar - Floating Style */}
            <div className="md:hidden fixed bottom-4 left-4 right-4 h-16 bg-white/90 backdrop-blur-xl border border-white/20 shadow-2xl rounded-2xl flex items-center justify-around z-[60] text-muted-foreground ring-1 ring-black/5">
                <Link href="/" className="flex flex-col items-center gap-1 p-2 hover:text-primary transition-colors">
                    <Home className="w-5 h-5" />
                    <span className="text-[10px] font-medium">Home</span>
                </Link>
                <Link href="/" className="flex flex-col items-center gap-1 p-2 text-primary relative group">
                    <div className="absolute -top-10 bg-primary w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-primary/30 ring-4 ring-white transition-transform group-active:scale-95">
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-[10px] font-medium font-bold mt-6">Generate</span>
                </Link>
                <Link href="/library" className="flex flex-col items-center gap-1 p-2 hover:text-primary transition-colors">
                    <Library className="w-5 h-5" />
                    <span className="text-[10px] font-medium">Library</span>
                </Link>
            </div>
        </nav>
    );
}
