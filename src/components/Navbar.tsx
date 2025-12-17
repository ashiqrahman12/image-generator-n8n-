import Link from "next/link";
import { Sparkles, Menu, Home, Library } from "lucide-react";

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
                    {/* Mobile Menu Button Removed as per redesign */}
                </div>
            </div>

            {/* Mobile Bottom Tab Bar */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-t border-border flex items-center justify-around z-[60]">
                <Link href="/" className="flex flex-col items-center gap-1 p-2 text-muted hover:text-primary transition-colors">
                    <Home className="w-6 h-6" />
                    <span className="text-[10px] font-medium">Home</span>
                </Link>
                <Link href="/" className="flex flex-col items-center gap-1 p-2 text-primary">
                    <div className="w-10 h-10 -mt-8 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/30 border-4 border-white">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[10px] font-medium font-bold">Generate</span>
                </Link>
                <Link href="#" className="flex flex-col items-center gap-1 p-2 text-muted hover:text-primary transition-colors">
                    <Library className="w-6 h-6" />
                    <span className="text-[10px] font-medium">Library</span>
                </Link>
            </div>
        </nav>
    );
}
