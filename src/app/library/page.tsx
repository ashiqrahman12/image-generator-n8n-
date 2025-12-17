"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { X, Download, Share2, Sparkles, Trash2, Home, Maximize2 } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface HistoryItem {
    id: string;
    image: string;
    prompt: string;
    timestamp: number;
}

export default function LibraryPage() {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    useEffect(() => {
        try {
            const stored = localStorage.getItem("imageHistory");
            if (stored) {
                setHistory(JSON.parse(stored));
            }
        } catch (e) {
            console.error("Failed to load history", e);
        }
    }, []);

    const clearHistory = () => {
        if (confirm("Are you sure you want to clear your library?")) {
            localStorage.removeItem("imageHistory");
            setHistory([]);
        }
    };

    const deleteItem = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const updated = history.filter(item => item.id !== id);
        setHistory(updated);
        localStorage.setItem("imageHistory", JSON.stringify(updated));
    }

    return (
        <div className="min-h-screen bg-secondary/10 flex flex-col font-sans">
            <Navbar />
            <main className="flex-1 container mx-auto px-4 py-8 mb-24 lg:mb-10">
                {/* Background Pattern */}
                <div className="fixed inset-0 opacity-30 pointer-events-none -z-10" style={{ backgroundImage: 'radial-gradient(#90AB8B 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />

                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Image Gallery</h1>
                        <p className="text-muted">Your personal collection of AI creations</p>
                    </div>
                    {history.length > 0 && (
                        <button
                            onClick={clearHistory}
                            className="px-4 py-2 bg-white/50 backdrop-blur-sm border border-red-200 text-red-500 rounded-xl text-sm font-semibold shadow-sm hover:bg-red-50 transition-colors"
                        >
                            Clear All
                        </button>
                    )}
                </div>

                {history.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center py-32 text-muted text-center"
                    >
                        <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center mb-6 shadow-sm border border-white/50">
                            <Sparkles className="w-10 h-10 opacity-20" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-2">No images yet</h3>
                        <p className="max-w-xs mx-auto mb-8">Create your first masterpiece to see it here.</p>
                        <Link href="/" className="px-8 py-4 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/20 hover:bg-primary-dark hover:scale-105 transition-all">
                            Start Creating
                        </Link>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <AnimatePresence>
                            {history.map((item, index) => (
                                <motion.div
                                    key={item.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                    className="group relative bg-white/40 backdrop-blur-md rounded-3xl p-3 shadow-sm border border-white/60 hover:shadow-xl hover:shadow-primary/10 transition-all hover:-translate-y-1"
                                >
                                    {/* Image Container */}
                                    <div
                                        className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer"
                                        onClick={() => setSelectedImage(item.image)}
                                    >
                                        <img src={item.image} alt={item.prompt} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />

                                        {/* Hover Overlay */}
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                                            <button
                                                onClick={() => setSelectedImage(item.image)}
                                                className="p-3 bg-white/90 text-foreground rounded-full shadow-lg hover:scale-110 transition-transform"
                                                title="View Fullscreen"
                                            >
                                                <Maximize2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Info & Actions */}
                                    <div className="mt-3 px-1">
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                            <p className="text-sm font-medium text-foreground line-clamp-1 flex-1" title={item.prompt}>
                                                {item.prompt}
                                            </p>
                                            <button
                                                onClick={(e) => deleteItem(item.id, e)}
                                                className="text-muted hover:text-red-500 transition-colors p-1"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] text-muted font-medium">
                                                {new Date(item.timestamp).toLocaleDateString()}
                                            </p>
                                            <a
                                                href={item.image}
                                                download={`ai-art-${item.id}.png`}
                                                className="text-xs font-bold text-primary hover:text-primary-dark flex items-center gap-1 px-3 py-1.5 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Download className="w-3.5 h-3.5" /> Download
                                            </a>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </main>

            {/* Lightbox / Fullscreen View */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 lg:p-10"
                        onClick={() => setSelectedImage(null)}
                    >
                        <motion.img
                            initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                            src={selectedImage}
                            className="max-h-full max-w-full rounded-2xl shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                        <button className="absolute top-6 right-6 p-4 text-white/50 hover:text-white transition-colors" onClick={() => setSelectedImage(null)}>
                            <X className="w-8 h-8" />
                        </button>

                        <a
                            href={selectedImage}
                            download={`ai-gallery-image.png`}
                            onClick={(e) => e.stopPropagation()}
                            className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-white text-black rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform"
                        >
                            <Download className="w-5 h-5" /> Download Image
                        </a>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
