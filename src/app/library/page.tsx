"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { X, Download, Share2, Sparkles, Trash2, Maximize2 } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface HistoryItem {
    id: string;
    image: string;
    prompt: string;
    timestamp: number;
}

export default function LibraryPage() {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [selectedImage, setSelectedImage] = useState<HistoryItem | null>(null);

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
        <div className="min-h-screen bg-background flex flex-col font-sans overflow-x-hidden">
            <Navbar />
            <main className="flex-1 container mx-auto px-4 py-8 pt-24 pb-32 md:pb-24">
                {/* Background Glow */}
                <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] md:w-[800px] h-[400px] md:h-[500px] bg-primary/20 blur-[150px] rounded-full pointer-events-none opacity-20" />

                <div className="relative z-10">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">Image Gallery</h1>
                            <p className="text-muted-foreground mt-1">Your personal collection of AI creations</p>
                        </div>
                        {history.length > 0 && (
                            <button
                                onClick={clearHistory}
                                className="px-5 py-2.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm font-semibold hover:bg-red-500/20 transition-colors self-start sm:self-auto"
                            >
                                Clear All
                            </button>
                        )}
                    </div>

                    {history.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center justify-center py-32 text-center"
                        >
                            <div className="w-24 h-24 bg-zinc-900/60 border border-white/10 rounded-3xl flex items-center justify-center mb-6">
                                <Sparkles className="w-10 h-10 text-white/20" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">No images yet</h3>
                            <p className="text-muted-foreground max-w-xs mx-auto mb-8">Create your first masterpiece to see it here.</p>
                            <Link href="/" className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-bold shadow-xl shadow-purple-500/20 hover:shadow-purple-500/40 hover:scale-105 transition-all">
                                Start Creating
                            </Link>
                        </motion.div>
                    ) : (
                        /* Masonry Grid */
                        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
                            {history.map((item, index) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                    className="group relative bg-zinc-900/60 backdrop-blur-md rounded-2xl overflow-hidden border border-white/10 hover:border-purple-500/50 transition-all break-inside-avoid"
                                >
                                    {/* Image */}
                                    <div
                                        className="relative cursor-pointer overflow-hidden"
                                        onClick={() => setSelectedImage(item)}
                                    >
                                        <img
                                            src={item.image}
                                            alt={item.prompt}
                                            className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                                        />

                                        {/* Hover Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                                            <button
                                                className="px-4 py-2 bg-white/90 text-black rounded-full text-sm font-semibold flex items-center gap-2 hover:bg-white transition-colors"
                                            >
                                                <Maximize2 className="w-4 h-4" />
                                                View
                                            </button>
                                        </div>
                                    </div>

                                    {/* Info Footer */}
                                    <div className="p-4">
                                        <p className="text-sm text-white/90 line-clamp-2 mb-3" title={item.prompt}>
                                            {item.prompt}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs text-white/40">
                                                {new Date(item.timestamp).toLocaleDateString()}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <a
                                                    href={item.image}
                                                    download={`ai-art-${item.id}.png`}
                                                    className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                                    onClick={(e) => e.stopPropagation()}
                                                    title="Download"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </a>
                                                <button
                                                    onClick={(e) => deleteItem(item.id, e)}
                                                    className="p-2 text-white/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Lightbox / Fullscreen View */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
                        onClick={() => setSelectedImage(null)}
                    >
                        {/* Close Button - Top Right */}
                        <button
                            className="absolute top-4 right-4 md:top-6 md:right-6 w-12 h-12 md:w-14 md:h-14 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full flex items-center justify-center text-white transition-all hover:scale-110 z-10"
                            onClick={() => setSelectedImage(null)}
                        >
                            <X className="w-6 h-6 md:w-7 md:h-7" />
                        </button>

                        {/* Image Container */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative max-w-5xl w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img
                                src={selectedImage.image}
                                alt={selectedImage.prompt}
                                className="w-full h-auto max-h-[80vh] object-contain rounded-2xl shadow-2xl"
                            />

                            {/* Bottom Info Bar */}
                            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-black/90 to-transparent rounded-b-2xl">
                                <p className="text-white/90 text-sm md:text-base mb-4 line-clamp-2">{selectedImage.prompt}</p>
                                <div className="flex items-center justify-between">
                                    <p className="text-white/50 text-xs md:text-sm">
                                        Created on {new Date(selectedImage.timestamp).toLocaleDateString()}
                                    </p>
                                    <a
                                        href={selectedImage.image}
                                        download={`ai-gallery-${selectedImage.id}.png`}
                                        className="px-5 py-2.5 bg-white text-black rounded-full font-bold text-sm flex items-center gap-2 hover:scale-105 transition-transform"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Download className="w-4 h-4" />
                                        Download
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
