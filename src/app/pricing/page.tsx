"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { motion } from "framer-motion";
import { Check, Sparkles, Zap, Crown } from "lucide-react";
import { cn } from "@/lib/utils";

const plans = [
    {
        name: "Starter",
        icon: Zap,
        price: { monthly: 1000, annual: 10000 },
        description: "Best for solo creators",
        features: [
            "100 AI image generations",
            "Standard quality (1K)",
            "Basic support",
            "Community access",
        ],
        popular: false,
    },
    {
        name: "Pro",
        icon: Crown,
        price: { monthly: 2000, annual: 20000 },
        description: "Most popular plan",
        features: [
            "500 AI image generations",
            "High quality (2K)",
            "Priority support",
            "Advanced styles",
            "Reference images",
        ],
        popular: true,
    },
    {
        name: "Enterprise",
        icon: Sparkles,
        price: { monthly: 4000, annual: 40000 },
        description: "For teams & agencies",
        features: [
            "Unlimited generations",
            "Ultra HD quality (4K)",
            "24/7 dedicated support",
            "Custom styles",
            "API access",
            "Team collaboration",
        ],
        popular: false,
    },
];

export default function PricingPage() {
    const [isAnnual, setIsAnnual] = useState(false);

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
                        className="text-center mb-8 md:mb-12 px-2"
                    >
                        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-3 md:mb-4">
                            <span className="text-white">Flexible pricing</span>
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-primary">for teams of all sizes</span>
                        </h1>
                        <p className="text-muted-foreground text-base md:text-lg max-w-md mx-auto">
                            Choose the perfect plan for your creative journey
                        </p>
                    </motion.div>

                    {/* Toggle */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="flex justify-center mb-8 md:mb-16"
                    >
                        <div className="flex items-center gap-1 p-1 rounded-full bg-zinc-900/80 border border-white/10">
                            <button
                                onClick={() => setIsAnnual(false)}
                                className={cn(
                                    "px-5 md:px-6 py-2 md:py-2.5 rounded-full text-sm font-semibold transition-all",
                                    !isAnnual ? "bg-white text-black" : "text-white/60 hover:text-white"
                                )}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setIsAnnual(true)}
                                className={cn(
                                    "px-5 md:px-6 py-2 md:py-2.5 rounded-full text-sm font-semibold transition-all",
                                    isAnnual ? "bg-white text-black" : "text-white/60 hover:text-white"
                                )}
                            >
                                Annual
                            </button>
                        </div>
                    </motion.div>

                    {/* Pricing Cards - Mobile: Show Pro first, centered */}
                    <div className="flex flex-col md:grid md:grid-cols-3 gap-5 md:gap-6 lg:gap-8 items-center md:items-start max-w-sm md:max-w-none mx-auto">
                        {/* Reorder for mobile: Pro first */}
                        {[plans[1], plans[0], plans[2]].map((plan, index) => (
                            <motion.div
                                key={plan.name}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 + index * 0.1 }}
                                className={cn(
                                    "relative rounded-3xl border p-5 md:p-6 lg:p-8 flex flex-col w-full",
                                    // On mobile, Pro is first (index 0), on desktop it's in the middle
                                    "md:order-none",
                                    index === 0 ? "order-first" : index === 1 ? "order-2" : "order-3",
                                    plan.popular
                                        ? "bg-gradient-to-b from-purple-900/30 to-zinc-900/80 border-purple-500/50 shadow-2xl shadow-purple-500/20 md:-mt-4 md:mb-4"
                                        : "bg-zinc-900/60 border-white/10"
                                )}
                                style={{
                                    // Reset order for desktop grid
                                    ...(plan.name === "Starter" && { order: undefined }),
                                    ...(plan.name === "Pro" && { order: undefined }),
                                    ...(plan.name === "Enterprise" && { order: undefined }),
                                }}
                            >
                                {/* Popular Badge */}
                                {plan.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-[10px] md:text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">
                                        Most Popular
                                    </div>
                                )}

                                {/* Icon */}
                                <div className={cn(
                                    "w-12 md:w-14 h-12 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center mb-4 md:mb-6 mx-auto",
                                    plan.popular ? "bg-purple-500/20 ring-2 ring-purple-500/50" : "bg-white/10"
                                )}>
                                    <plan.icon className={cn(
                                        "w-6 md:w-7 h-6 md:h-7",
                                        plan.popular ? "text-purple-400" : "text-white"
                                    )} />
                                </div>

                                {/* Plan Name */}
                                <h3 className="text-base md:text-lg font-bold text-white text-center mb-1">{plan.name}</h3>

                                {/* Price */}
                                <div className="text-center mb-2">
                                    <span className={cn(
                                        "text-4xl md:text-5xl font-extrabold tracking-tight",
                                        plan.popular ? "text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400" : "text-white"
                                    )}>
                                        ৳{isAnnual ? plan.price.annual.toLocaleString() : plan.price.monthly.toLocaleString()}
                                    </span>
                                    <span className="text-white/50 text-sm ml-1">/{isAnnual ? "yr" : "mo"}</span>
                                </div>

                                {/* Description */}
                                <p className="text-sm text-white/60 text-center mb-4 md:mb-6">{plan.description}</p>

                                {/* Features */}
                                <ul className="space-y-2.5 md:space-y-3 mb-6 md:mb-8 flex-1">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-center gap-2.5 md:gap-3 text-sm">
                                            <div className={cn(
                                                "w-5 h-5 rounded-full flex items-center justify-center shrink-0",
                                                plan.popular ? "bg-purple-500/20 text-purple-400" : "bg-white/10 text-primary"
                                            )}>
                                                <Check className="w-3 h-3" />
                                            </div>
                                            <span className="text-white/80">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                {/* CTA Button */}
                                <button className={cn(
                                    "w-full py-3.5 md:py-4 rounded-xl md:rounded-2xl font-bold text-sm uppercase tracking-wider transition-all active:scale-[0.98]",
                                    plan.popular
                                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50"
                                        : "bg-white/10 text-white border border-white/20 hover:bg-white/20"
                                )}>
                                    Get Started
                                </button>
                            </motion.div>
                        ))}
                    </div>

                    {/* Note */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="text-center text-sm text-white/40 mt-8 md:mt-12"
                    >
                        All prices in BDT. Cancel anytime. No hidden fees.
                    </motion.p>
                </div>
            </main>
        </div>
    );
}
