"use client";

import { useState, useRef } from "react";
import { Navbar } from "@/components/Navbar";
import { ImageGenerator } from "@/components/ImageGenerator";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Palette, Zap, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans selection:bg-primary/30">
      <Navbar />

      <main className="flex-1 flex flex-col relative">
        <ImageGenerator />
      </main>
    </div>
  );
}
