"use client";

import { Navbar } from "@/components/Navbar";
import { motion } from "framer-motion";
import {
    Zap,
    Sparkles,
    LayoutGrid,
    Download,
    Palette,
    Smartphone,
    Shield,
    Share2,
    History
} from "lucide-react";

const features = [
    {
        icon: Sparkles,
        title: "AI-Powered Generation",
        description: "Transform your text prompts into stunning visuals using state-of-the-art diffusion models.",
        color: "text-purple-400",
        bg: "bg-purple-500/20"
    },
    {
        icon: Zap,
        title: "Lightning Fast",
        description: "Generate high-quality images in seconds. Our optimized pipeline ensures minimal wait times.",
        color: "text-yellow-400",
        bg: "bg-yellow-500/20"
    },
    {
        icon: Smartphone,
        title: "Mobile Optimized",
        description: "A fully responsive experience designed for creativity on the go. Works perfectly on iOS and Android.",
        color: "text-blue-400",
        bg: "bg-blue-500/20"
    },
    {
        icon: LayoutGrid,
        title: "Smart Gallery",
        description: "Organize your creations automatically. View them in a beautiful, responsive masonry grid.",
        color: "text-green-400",
        bg: "bg-green-500/20"
    },
    {
        icon: Download,
        title: "High-Res Downloads",
        description: "Download your masterpieces in high resolution, ready for printing or digital projects.",
        color: "text-pink-400",
        bg: "bg-pink-500/20"
    },
    {
        icon: Palette,
        title: "Diverse Styles",
        description: "From photorealistic to anime, oil painting to 3D render - explore endless artistic styles.",
        color: "text-orange-400",
        bg: "bg-orange-500/20"
    },
    {
        icon: History,
        title: "History Tracking",
        description: "Never lose a prompt. Your generation history is saved locally for easy access and re-creation.",
        color: "text-cyan-400",
        bg: "bg-cyan-500/20"
    },
    {
        icon: Shield,
        title: "Private & Secure",
        description: "Your creativity is yours. We respect your privacy and ensure secure data handling.",
        color: "text-red-400",
        bg: "bg-red-500/20"
    },
    {
        icon: Share2,
        title: "Easy Sharing",
        description: "Share your creations directly from the app to social media or with friends.",
        color: "text-indigo-400",
        bg: "bg-indigo-500/20"
    }
];

export default function FeaturesPage() {
    return (
        <div className="min-h-screen bg-background flex flex-col font-sans overflow-x-hidden">
            <Navbar />

            <main className="flex-1 pt-24 md:pt-32 pb-32 md:pb-24 px-4">
                {/* Background Glow */}
                <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] md:w-[800px] h-[400px] md:h-[500px] bg-primary/20 blur-[150px] rounded-full pointer-events-none opacity-20" />

                <div className="max-w-6xl mx-auto relative z-10">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-16 md:mb-24"
                    >
                        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6">
                            <span className="text-white">Powerful Features</span>
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-primary">Designed for Creators</span>
                        </h1>
                        <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
                            Everything you need to bring your imagination to life, packed into one beautiful interface.
                        </p>
                    </motion.div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.05 }}
                                className="p-6 md:p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group hover:-translate-y-1"
                            >
                                <div className={`w-14 h-14 rounded-2xl ${feature.bg} flex items-center justify-center mb-6 ring-1 ring-white/10 group-hover:scale-110 transition-transform duration-300`}>
                                    <feature.icon className={`w-7 h-7 ${feature.color}`} />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                                <p className="text-white/60 leading-relaxed text-sm md:text-base">
                                    {feature.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>

                    {/* Bottom CTA */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="mt-24 text-center p-8 md:p-12 rounded-3xl bg-gradient-to-b from-purple-900/20 to-transparent border border-white/10"
                    >
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                            Ready to experience it yourself?
                        </h2>
                        <p className="text-white/60 mb-8 max-w-md mx-auto">
                            Join the community and start generating amazing artwork today.
                        </p>
                        <a
                            href="/"
                            className="inline-flex px-8 py-4 rounded-full bg-white text-black font-bold text-lg hover:scale-105 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                        >
                            Get Started for Free
                        </a>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
