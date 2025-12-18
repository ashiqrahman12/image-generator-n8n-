"use client";

import { useState, useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { ImageGenerator } from "@/components/ImageGenerator";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Palette, Zap, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  const generatorRef = useRef<HTMLDivElement>(null);

  const scrollToGenerator = () => {
    generatorRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans selection:bg-primary/30 scroll-smooth">
      <Navbar />

      <main className="flex-1 flex flex-col relative">
        {/* Ambient Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/20 blur-[120px] rounded-full pointer-events-none opacity-20" />

        {/* Hero Section */}
        <section className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center text-center p-6 max-w-4xl mx-auto z-10 space-y-10">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-xs font-medium text-white/80 tracking-wide uppercase">AI Image Generator <span className="text-white/40 ml-1">BETA</span></span>
          </motion.div>

          {/* Verified Hero Title */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1]">
              <span className="block text-white">Create</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-primary animate-gradient-x">Stunning AI</span>
              <span className="block text-white/90">Images</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Unleash the power of artificial intelligence to transform your imagination into breathtaking visuals. Simply describe your vision, and watch magic unfold.
            </p>
          </div>

          {/* Feature Pills */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-2xl">
            {[
              { icon: Sparkles, label: "Photorealistic" },
              { icon: Palette, label: "Artistic Styles" },
              { icon: Zap, label: "Fast Generation" },
              { icon: ImageIcon, label: "Reference Images" }
            ].map((feature, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.05)" }}
                className="flex items-center justify-center gap-2 p-3 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm cursor-default transition-colors hover:border-white/10"
              >
                <feature.icon className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-white/80">{feature.label}</span>
              </motion.div>
            ))}
          </div>

          {/* CTA Button */}
          <div className="pt-4">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 0 40px -10px rgba(255, 107, 0, 0.5)" }}
              whileTap={{ scale: 0.95 }}
              onClick={scrollToGenerator}
              className="group relative px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-primary font-bold text-lg text-white shadow-2xl shadow-primary/25 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                Start Creating
                <Zap className="w-5 h-5 fill-white" />
              </span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
            </motion.button>
          </div>
        </section>

        {/* Generator Section */}
        <section ref={generatorRef} id="generator" className="w-full">
          <ImageGenerator />
        </section>
      </main>
    </div>
  );
}
