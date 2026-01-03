"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { X, Download, Share2, Sparkles, Trash2, Maximize2 } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import { getImageHistory, deleteImageFromHistory, clearAllHistory, ImageHistoryItem } from "@/lib/supabase";

interface HistoryItem {
    id: string;
    image: string;
    prompt: string;
    style_preset?: string | null;
    created_at: string;
}

export default function LibraryPage() {
    const { user, isLoaded } = useUser();
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<HistoryItem | null>(null);

    // Load images from Supabase when user is available
    useEffect(() => {
        async function loadHistory() {
            if (!isLoaded) return;

            if (!user?.id) {
                setLoading(false);
                return;
            }

            try {
                const data = await getImageHistory(user.id);
                // Map Supabase data to HistoryItem format
                const items: HistoryItem[] = data.map((item: ImageHistoryItem) => ({
                    id: item.id,
                    image: item.image_url,
                    prompt: item.prompt,
                    style_preset: item.style_preset,
                    created_at: item.created_at
                }));
                setHistory(items);
                console.log("Loaded from Supabase:", items.length, "images");
            } catch (e) {
                console.error("Failed to load history", e);
            } finally {
                setLoading(false);
            }
        }

        loadHistory();
    }, [user, isLoaded]);

    const handleClearHistory = async () => {
        if (!user?.id) return;
        if (confirm("Are you sure you want to clear your library?")) {
            const success = await clearAllHistory(user.id);
            if (success) {
                setHistory([]);
            }
        }
    };

    const deleteItem = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const success = await deleteImageFromHistory(id);
        if (success) {
            setHistory(prev => prev.filter(item => item.id !== id));
        }
    };

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
                                onClick={handleClearHistory}
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
                        /* Bento Grid System */
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[200px]">
                            {history.map((item, index) => {
                                // Bento Pattern Logic
                                const isLarge = index % 7 === 0; // Large square (2x2)
                                const isWide = index % 7 === 3;  // Wide landscape (2x1)
                                const isTall = index % 7 === 5;  // Tall portrait (1x2)

                                return (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.4, delay: index * 0.05 }}
                                        className={cn(
                                            "group relative rounded-3xl overflow-hidden border border-white/10 bg-zinc-900/40 hover:border-purple-500/50 transition-all shadow-sm",
                                            isLarge ? "col-span-2 row-span-2" :
                                                isWide ? "col-span-2 row-span-1" :
                                                    isTall ? "col-span-1 row-span-2" :
                                                        "col-span-1 row-span-1"
                                        )}
                                    >
                                        <div
                                            className="w-full h-full cursor-pointer relative"
                                            onClick={() => setSelectedImage(item)}
                                        >
                                            <img
                                                src={item.image}
                                                alt={item.prompt}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />

                                            {/* Hover Overlay - Clean & Minimal */}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                                                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                                    <p className="text-white text-xs md:text-sm font-medium line-clamp-1 mb-2 opacity-90">
                                                        {item.prompt}
                                                    </p>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedImage(item);
                                                            }}
                                                            className="flex-1 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg text-xs font-semibold text-white transition-colors flex items-center justify-center gap-2"
                                                        >
                                                            <Maximize2 className="w-3 h-3" /> View
                                                        </button>
                                                        <button
                                                            onClick={(e) => deleteItem(item.id, e)}
                                                            className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors"
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
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
                                        Created on {new Date(selectedImage.created_at).toLocaleDateString()}
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
