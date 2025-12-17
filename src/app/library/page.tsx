"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { X, Download, Share2, Sparkles, Trash2, Home } from "lucide-react";
import Link from "next/link";

interface HistoryItem {
    id: string;
    image: string;
    prompt: string;
    timestamp: number;
}

export default function LibraryPage() {
    const [history, setHistory] = useState<HistoryItem[]>([]);

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

    const deleteItem = (id: string) => {
        const updated = history.filter(item => item.id !== id);
        setHistory(updated);
        localStorage.setItem("imageHistory", JSON.stringify(updated));
    }

    return (
        <div className="min-h-screen bg-secondary/10 flex flex-col font-sans">
            <Navbar />
            <main className="flex-1 container mx-auto px-4 py-6 mb-24">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Library</h1>
                        <p className="text-sm text-muted">Your recent creations</p>
                    </div>
                    {history.length > 0 && (
                        <button
                            onClick={clearHistory}
                            className="px-3 py-1.5 bg-white border border-red-200 text-red-500 rounded-lg text-xs font-semibold shadow-sm hover:bg-red-50 transition-colors"
                        >
                            Clear All
                        </button>
                    )}
                </div>

                {history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-muted text-center">
                        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-sm">
                            <Sparkles className="w-10 h-10 opacity-20" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">No images yet</h3>
                        <p className="max-w-xs mx-auto mb-8">Create your first masterpiece to see it here.</p>
                        <Link href="/" className="px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all">
                            Create Image
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {history.map((item) => (
                            <div key={item.id} className="bg-white rounded-3xl p-4 shadow-sm border border-border/50 group">
                                <div className="relative aspect-square rounded-2xl overflow-hidden bg-secondary/10 mb-4">
                                    <img src={item.image} alt={item.prompt} className="w-full h-full object-cover" />
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-start justify-between gap-4">
                                        <p className="text-sm text-foreground font-medium line-clamp-2 leading-relaxed flex-1">{item.prompt}</p>
                                        <button onClick={() => deleteItem(item.id)} className="text-muted hover:text-red-500 p-1">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <p className="text-xs text-muted">{new Date(item.timestamp).toLocaleDateString()} • {new Date(item.timestamp).toLocaleTimeString()}</p>

                                    <div className="grid grid-cols-2 gap-3 pt-2">
                                        <a
                                            href={item.image}
                                            download={`ai-art-${item.id}.png`}
                                            className="col-span-2 py-3 bg-primary text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 active:scale-95"
                                        >
                                            <Download className="w-4 h-4" /> Save to Photos
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
