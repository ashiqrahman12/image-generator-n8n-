"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Loader2, Upload, X, Image as ImageIcon, Download, Share2, Monitor, ChevronDown, Mic, MicOff, Grid, Maximize2, Zap, Settings2, Info, Boxes, Layers, SlidersHorizontal, Ratio, Wand2, MinusCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { AccordionItem } from "@/components/ui/simple-accordion";
import { SimpleSelect } from "@/components/ui/simple-select";
import { SimpleSheet } from "@/components/ui/simple-sheet";

// --- Premium UI Primitives ---
const SkeletonLoader = () => (
    <div className="w-full h-full relative overflow-hidden bg-zinc-900/50 rounded-2xl border border-white/5 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer" />
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 opacity-50">
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center animate-pulse">
                    <Sparkles className="w-6 h-6 text-white" />
                </div>
                <p className="text-xs font-medium text-zinc-400 tracking-wider uppercase">Synthesizing...</p>
            </div>
        </div>
    </div>
);

const SectionLabel = ({ children, icon: Icon }: { children: React.ReactNode; icon?: any }) => (
    <label className="flex items-center gap-2 text-[11px] uppercase font-bold tracking-[0.18em] text-white mb-2.5">
        {Icon && <Icon className="w-3.5 h-3.5 text-white" />}
        {children}
    </label>
);

// --- Options Data ---
const qualityOptions = [
    { id: "1k", label: "Standard", desc: "1024px" },
    { id: "2k", label: "High Def", desc: "2048px" },
    { id: "4k", label: "Ultra HD", desc: "4096px" },
] as const;

const aspectRatioOptions = [
    { id: "1:1", label: "1:1 Square" },
    { id: "9:16", label: "9:16 Portrait" },
    { id: "16:9", label: "16:9 Landscape" },
] as const;

export function ImageGenerator() {
    const [prompt, setPrompt] = useState("");
    const [negativePrompt, setNegativePrompt] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [generatedImages, setGeneratedImages] = useState<string[]>([]);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [quality, setQuality] = useState<"1k" | "2k" | "4k">("2k");
    const [aspectRatio, setAspectRatio] = useState<"1:1" | "9:16" | "16:9">("1:1");
    const [outputFormat, setOutputFormat] = useState<"png" | "jpg">("png");
    const [refImages, setRefImages] = useState<{ file: File; preview: string }[]>([]);
    const [isListening, setIsListening] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false); // Mobile Settings Drawer

    const fileInputRef = useRef<HTMLInputElement>(null);
    const previewRef = useRef<HTMLElement>(null);

    const MAX_IMAGES = 4;

    const handleVoiceInput = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return alert('Voice input is not supported in your browser.');
        const recognition = new SpeechRecognition();
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (e: any) => setPrompt((p) => p ? `${p} ${e.results[0][0].transcript}` : e.results[0][0].transcript);
        isListening ? recognition.stop() : recognition.start();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const newImages: { file: File; preview: string }[] = [];
        Array.from(e.target.files).forEach((file) => {
            if (refImages.length + newImages.length >= MAX_IMAGES) return;
            newImages.push({ file, preview: URL.createObjectURL(file) });
        });
        setRefImages((prev) => [...prev, ...newImages]);
    };

    const handleGenerate = async () => {
        if (!prompt.trim() || loading) return;
        setLoading(true);
        setLoadingProgress(0);
        setError(null);
        setGeneratedImages([]);

        const interval = setInterval(() => {
            setLoadingProgress((p) => (p >= 90 ? p : p + Math.floor(Math.random() * 5) + 2));
        }, 500);

        try {
            const formData = new FormData();
            formData.append("prompt", prompt);
            formData.append("negative_prompt", negativePrompt); // Added to API payload
            formData.append("quality", quality);
            formData.append("aspectRatio", aspectRatio);
            formData.append("outputFormat", outputFormat);
            refImages.forEach((img, i) => formData.append(`referenceImage_${i}`, img.file));
            formData.append("referenceImageCount", String(refImages.length));

            const res = await fetch("/api/generate", { method: "POST", body: formData });
            if (!res.ok) throw new Error("Generation failed");
            const data = await res.json();

            clearInterval(interval);
            setLoadingProgress(100);

            if (data.imageUrls?.length) {
                setTimeout(() => {
                    setGeneratedImages(data.imageUrls);
                    setLoading(false);

                    // Save to localStorage for Gallery
                    try {
                        const existingHistory = JSON.parse(localStorage.getItem("imageHistory") || "[]");
                        const newItems = data.imageUrls.map((url: string) => ({
                            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                            image: url,
                            prompt: prompt,
                            timestamp: Date.now()
                        }));
                        const updatedHistory = [...newItems, ...existingHistory];
                        localStorage.setItem("imageHistory", JSON.stringify(updatedHistory));
                    } catch (e) {
                        console.error("Failed to save to gallery:", e);
                    }
                }, 400);
            }
        } catch (err: any) {
            clearInterval(interval);
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row min-h-screen bg-background text-foreground">
            {/* Control Sidebar (Desktop) / Mobile Controls */}
            <aside className={cn(
                "w-full lg:w-[420px] lg:h-screen lg:sticky lg:top-0 border-t lg:border-t-0 lg:border-r border-white/5 bg-zinc-950/80 lg:bg-zinc-950/20 backdrop-blur-2xl flex flex-col z-40 transition-all shadow-2xl shadow-black"
            )}>


                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 pb-32 lg:pb-40">
                    {/* Prompt Section - Always Visible */}
                    <div className="space-y-3">
                        <SectionLabel icon={Zap}>Prompt</SectionLabel>
                        <div className="group relative">
                            <div className="absolute -inset-0.5 bg-gradient-to-br from-white/10 to-white/0 rounded-2xl blur-sm opacity-0 group-focus-within:opacity-100 transition-opacity" />
                            <div className="relative bg-zinc-900/80 border border-white/10 rounded-2xl p-4 transition-all focus-within:border-white/20 focus-within:ring-1 focus-within:ring-white/10">
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="Describe what you want to create..."
                                    className="w-full h-24 lg:h-32 bg-transparent border-none resize-none text-base font-normal text-white placeholder:text-white/40 focus:ring-0 leading-relaxed custom-scrollbar"
                                />
                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
                                    <div className="flex gap-1">
                                        <button onClick={handleVoiceInput} className={cn("p-2 rounded-lg transition-colors", isListening ? "bg-red-500/20 text-red-500 animate-pulse" : "text-white/70 hover:text-white hover:bg-white/5")}>
                                            <Mic className="w-4 h-4" />
                                        </button>

                                        {/* Mobile Settings Trigger */}
                                        <button
                                            onClick={() => setIsSettingsOpen(true)}
                                            className="lg:hidden p-2 text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2"
                                        >
                                            <SlidersHorizontal className="w-4 h-4" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider">Settings</span>
                                        </button>
                                    </div>
                                    <span className="text-[11px] font-medium text-white/50 tracking-wide uppercase">{prompt.length} / 1000</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Desktop Settings | Mobile: Hidden in Sheet */}
                    <div className="hidden lg:block space-y-6">
                        {/* Negative Prompt */}
                        <AccordionItem title="Negative Prompt">
                            <div className="relative bg-zinc-900/50 border border-white/10 rounded-xl p-3 focus-within:border-white/20 transition-all">
                                <div className="flex items-center gap-2 mb-2 text-white/50">
                                    <MinusCircle className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Avoid Content</span>
                                </div>
                                <textarea
                                    value={negativePrompt}
                                    onChange={(e) => setNegativePrompt(e.target.value)}
                                    placeholder="blur, distortion, low quality..."
                                    className="w-full h-16 bg-transparent border-none resize-none text-sm text-white placeholder:text-white/30 focus:ring-0 leading-relaxed custom-scrollbar"
                                />
                            </div>
                        </AccordionItem>

                        {/* Configuration */}
                        <div className="space-y-6">
                            {/* Reference Images */}
                            <div className="space-y-3">
                                <SectionLabel icon={Boxes}>Structure Reference</SectionLabel>
                                <div className="grid grid-cols-4 gap-2">
                                    {refImages.map((img, i) => (
                                        <motion.div key={i} layoutId={`ref-${i}`} className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group">
                                            <img src={img.preview} className="w-full h-full object-cover" />
                                            <button onClick={() => setRefImages(r => r.filter((_, idx) => idx !== i))} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </motion.div>
                                    ))}
                                    {refImages.length < MAX_IMAGES && (
                                        <button onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-xl border border-dashed border-white/10 flex items-center justify-center hover:bg-white/5 hover:border-white/20 transition-all group">
                                            <Upload className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300" />
                                        </button>
                                    )}
                                </div>
                                <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileChange} />
                            </div>

                            {/* Aspect Ratio */}
                            <div className="space-y-3">
                                <SectionLabel icon={Ratio}>Aspect Ratio</SectionLabel>
                                <SimpleSelect
                                    value={aspectRatio}
                                    onChange={(v) => setAspectRatio(v as any)}
                                    options={aspectRatioOptions}
                                />
                            </div>

                            {/* Quality */}
                            <div className="space-y-3">
                                <SectionLabel icon={Layers}>Quality Level</SectionLabel>
                                <div className="flex p-1 bg-zinc-900/50 rounded-xl border border-white/10">
                                    {qualityOptions.map((opt) => (
                                        <button
                                            key={opt.id}
                                            onClick={() => setQuality(opt.id as any)}
                                            className={cn(
                                                "flex-1 py-2 text-[10px] font-bold rounded-lg transition-all tracking-tight uppercase",
                                                quality === opt.id ? "bg-white text-black shadow-lg" : "text-white/50 hover:text-white"
                                            )}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sticky Generation Footer */}
                <div className="sticky lg:absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent pt-10 border-t border-white/5 backdrop-blur-md pb-[max(1.5rem,env(safe-area-inset-bottom)+5rem)] lg:pb-6">
                    <button
                        onClick={handleGenerate}
                        disabled={loading || !prompt.trim()}
                        className={cn(
                            "w-full h-14 rounded-2xl font-bold text-base uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-2xl overflow-hidden group relative",
                            loading ? "bg-zinc-800 text-white/50 cursor-not-allowed" : "bg-white text-black hover:bg-zinc-200"
                        )}
                    >
                        {loading && <div className="absolute inset-0 bg-black/5 animate-shimmer" />}
                        <div className="relative z-10 flex items-center gap-3">
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                            {loading ? `Dreaming (${loadingProgress}%)` : "Generate Image"}
                        </div>
                    </button>
                </div>
            </aside>

            {/* Mobile Settings Sheet */}
            <SimpleSheet isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="Generation Settings">
                <div className="space-y-8 pt-2">
                    {/* Negative Prompt (Mobile) */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-2 text-white/50">
                            <MinusCircle className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Avoid Content</span>
                        </div>
                        <textarea
                            value={negativePrompt}
                            onChange={(e) => setNegativePrompt(e.target.value)}
                            placeholder="blur, distortion, low quality..."
                            className="w-full h-20 bg-zinc-900/50 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 resize-none"
                        />
                    </div>

                    {/* Reference Images (Mobile) */}
                    <div className="space-y-3">
                        <SectionLabel icon={Boxes}>Structure Reference</SectionLabel>
                        <div className="grid grid-cols-4 gap-2">
                            {refImages.map((img, i) => (
                                <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-white/10">
                                    <img src={img.preview} className="w-full h-full object-cover" />
                                    <button onClick={() => setRefImages(r => r.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-black/60 rounded-full p-1 text-white">
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                            {refImages.length < MAX_IMAGES && (
                                <button onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-xl border border-dashed border-white/10 flex items-center justify-center hover:bg-white/5">
                                    <Upload className="w-4 h-4 text-zinc-600" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Aspect Ratio (Mobile) */}
                    <div className="space-y-3">
                        <SectionLabel icon={Ratio}>Aspect Ratio</SectionLabel>
                        <SimpleSelect
                            value={aspectRatio}
                            onChange={(v) => setAspectRatio(v as any)}
                            options={aspectRatioOptions}
                        />
                    </div>

                    {/* Quality (Mobile) */}
                    <div className="space-y-3">
                        <SectionLabel icon={Layers}>Quality Level</SectionLabel>
                        <div className="flex p-1 bg-zinc-900/50 rounded-xl border border-white/10">
                            {qualityOptions.map((opt) => (
                                <button
                                    key={opt.id}
                                    onClick={() => setQuality(opt.id as any)}
                                    className={cn(
                                        "flex-1 py-3 text-[10px] font-bold rounded-lg transition-all tracking-tight uppercase",
                                        quality === opt.id ? "bg-white text-black shadow-lg" : "text-white/50 hover:text-white"
                                    )}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </SimpleSheet>

            {/* Canvas Area */}
            <main ref={previewRef} className="flex-1 bg-zinc-950 relative overflow-y-auto custom-scrollbar pb-60 lg:pb-0">
                <div className="absolute inset-0 noise-bg opacity-[0.03] pointer-events-none" />

                <div className="max-w-6xl mx-auto p-6 md:p-12 min-h-full flex flex-col items-center justify-center">
                    <AnimatePresence mode="wait">
                        {generatedImages.length === 0 && !loading && !error && (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="text-center">
                                <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-white/5 mx-auto mb-6 flex items-center justify-center shadow-2xl">
                                    <ImageIcon className="w-8 h-8 text-zinc-700" />
                                </div>
                                <h1 className="text-2xl font-bold tracking-tight mb-2">Infinite Possibilities</h1>
                                <p className="text-sm text-zinc-500 max-w-xs mx-auto">Your vision will appear here. Describe anything to get started.</p>
                            </motion.div>
                        )}

                        {loading && (
                            <div className="w-full max-w-2xl aspect-square">
                                <SkeletonLoader />
                            </div>
                        )}

                        {generatedImages.length > 0 && (
                            <div className={cn(
                                "grid gap-6 w-full",
                                generatedImages.length === 1 ? "max-w-2xl" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                            )}>
                                {generatedImages.map((url, i) => (
                                    <motion.div
                                        key={url}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="relative group aspect-square rounded-3xl overflow-hidden border border-white/5 bg-zinc-900/40 shadow-2xl"
                                    >
                                        <img src={url} className="w-full h-full object-cover cursor-pointer" onClick={() => setSelectedImage(url)} />
                                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                            <a href={url} download className="p-3 bg-white text-black rounded-full hover:scale-110 transition-transform">
                                                <Download className="w-5 h-5" />
                                            </a>
                                            <button onClick={() => setSelectedImage(url)} className="p-3 bg-black/40 text-white rounded-full hover:scale-110 transition-transform backdrop-blur-md">
                                                <Maximize2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        {error && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 glass rounded-3xl text-center">
                                <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                                    <Info className="w-6 h-6" />
                                </div>
                                <h3 className="font-bold text-red-500 mb-2">Generation Failed</h3>
                                <p className="text-sm text-zinc-400">{error}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            {/* Fullscreen Lightbox */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6"
                        onClick={() => setSelectedImage(null)}
                    >
                        <motion.img
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            src={selectedImage} className="max-h-full max-w-full rounded-2xl shadow-3xl object-contain"
                        />
                        <button className="absolute top-8 right-8 p-3 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors" onClick={() => setSelectedImage(null)}>
                            <X className="w-6 h-6" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255,255,255,0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255,255,255,0.1);
                }
            `}</style>
        </div>
    );
}
