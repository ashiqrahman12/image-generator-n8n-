"use client";

import { Navbar } from "@/components/Navbar";
import { motion } from "framer-motion";
import { Sparkles, Zap, Globe, Users, Cpu, Rocket } from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-background flex flex-col font-sans overflow-x-hidden">
            <Navbar />

            <main className="flex-1 pt-24 md:pt-32 pb-32 md:pb-24 px-4">
                {/* Background Glow */}
                <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] md:w-[800px] h-[400px] md:h-[500px] bg-primary/20 blur-[150px] rounded-full pointer-events-none opacity-20" />

                <div className="max-w-4xl mx-auto relative z-10">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-16 md:mb-24"
                    >
                        <div className="inline-flex items-center justify-center p-2 mb-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                            <Sparkles className="w-5 h-5 text-purple-400 mr-2" />
                            <span className="text-sm font-semibold text-white/90">Revolutionizing Creativity</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
                            <span className="text-white">We are</span> <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-primary">Antigravity</span>
                        </h1>
                        <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                            Pushing the boundaries of imagination with Artificial Intelligence. We build tools that empower creators to turn their wildest dreams into visual reality.
                        </p>
                    </motion.div>

                    {/* Mission Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mb-24 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                        >
                            <h2 className="text-3xl font-bold text-white mb-4">Our Mission</h2>
                            <p className="text-white/70 text-lg leading-relaxed mb-6">
                                To democratize digital art creation by making high-end generative AI accessible to everyone. We believe that creativity shouldn't be limited by technical skills or expensive hardware.
                            </p>
                            <div className="flex gap-4">
                                <div className="flex flex-col gap-1">
                                    <span className="text-3xl font-bold text-purple-400">10k+</span>
                                    <span className="text-sm text-white/50">Users</span>
                                </div>
                                <div className="w-px bg-white/10" />
                                <div className="flex flex-col gap-1">
                                    <span className="text-3xl font-bold text-pink-400">500k+</span>
                                    <span className="text-sm text-white/50">Images Created</span>
                                </div>
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 }}
                            className="relative aspect-square md:aspect-video bg-gradient-to-br from-purple-900/40 to-black rounded-3xl border border-white/10 overflow-hidden flex items-center justify-center"
                        >
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                            <Globe className="w-32 h-32 text-white/10" />
                        </motion.div>
                    </div>

                    {/* Features/Values Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
                        {[
                            {
                                icon: Zap,
                                title: "Lightning Fast",
                                desc: "Generate high-quality images in seconds, not minutes. Our optimized pipeline ensures you stay in the flow."
                            },
                            {
                                icon: Cpu,
                                title: "Cutting Edge Models",
                                desc: "We constantly update our engine with the latest advancements in diffusion technology for superior results."
                            },
                            {
                                icon: Users,
                                title: "Community Driven",
                                desc: "Built for creators, by creators. We listen to our community to shape the future of our platform."
                            }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="p-6 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                            >
                                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
                                    <item.icon className="w-6 h-6 text-purple-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                                <p className="text-white/60 text-sm leading-relaxed">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* CTA */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center p-8 md:p-12 rounded-3xl bg-gradient-to-b from-white/5 to-transparent border border-white/10"
                    >
                        <Rocket className="w-12 h-12 text-white/50 mx-auto mb-6" />
                        <h2 className="text-3xl font-bold text-white mb-4">Ready to Create?</h2>
                        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                            Join thousands of artists and creators who are already using Antigravity to bring their ideas to life.
                        </p>
                        <Link
                            href="/"
                            className="inline-flex px-8 py-4 rounded-full bg-white text-black font-bold text-lg hover:scale-105 transition-transform"
                        >
                            Start Generating Now
                        </Link>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
