import Link from "next/link";
import { Sparkles, Menu } from "lucide-react";

export function Navbar() {
    return (
        <nav className="h-16 border-b border-border bg-white sticky top-0 z-50">
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
                    <Link href="#" className="text-sm font-medium text-muted hover:text-primary transition-colors">
                        Gallery
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
                    <button className="hidden sm:flex px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/30 hover:bg-primary-dark transition-all">
                        Get Started
                    </button>
                    <button className="md:hidden p-2 text-muted hover:text-foreground">
                        <Menu className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </nav>
    );
}
