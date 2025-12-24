"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Loader2, Upload, X, Image as ImageIcon, Download, Share2, Monitor, ChevronDown, Mic, MicOff, Grid, Maximize2, Zap, Settings2, Info, Boxes, Layers, SlidersHorizontal, Ratio, Wand2, MinusCircle, Expand, Trash2, Palette } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { SimpleSelect } from "@/components/ui/simple-select";
import { SimpleSheet } from "@/components/ui/simple-sheet";
import { AccordionItem } from "@/components/ui/simple-accordion";

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
    const [showOptionsDesktop, setShowOptionsDesktop] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const previewRef = useRef<HTMLElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

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
        setShowOptionsDesktop(false);

        const interval = setInterval(() => {
            setLoadingProgress((p) => (p >= 90 ? p : p + Math.floor(Math.random() * 5) + 2));
        }, 500);

        try {
            const formData = new FormData();
            formData.append("prompt", prompt);
            formData.append("negative_prompt", negativePrompt);
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

    const hasImages = generatedImages.length > 0;

    return (
        <>
            {/* =========================================================
                MOBILE LAYOUT (Strict Separation - Reverted Design) 
                Only visible on < lg screens
               ========================================================= */}
            <div className="flex flex-col min-h-[85vh] bg-background text-foreground lg:hidden pb-24">
                {/* Mobile: Controls Section (Top) */}
                <div className="w-full bg-zinc-950/80 backdrop-blur-xl border-b border-white/5 z-40 p-5 space-y-4">
                    <SectionLabel icon={Zap}>Prompt</SectionLabel>
                    <div className="group relative">
                        <div className="absolute -inset-0.5 bg-gradient-to-br from-white/10 to-white/0 rounded-2xl blur-sm opacity-0 group-focus-within:opacity-100 transition-opacity" />
                        <div className="relative bg-zinc-900/80 border border-white/10 rounded-2xl p-4 transition-all focus-within:border-white/20 focus-within:ring-1 focus-within:ring-white/10">
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Describe what you want to create..."
                                className="w-full h-24 bg-transparent border-none resize-none text-base font-normal text-white placeholder:text-white/40 focus:ring-0 leading-relaxed custom-scrollbar"
                            />
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
                                <div className="flex gap-2">
                                    <button onClick={handleVoiceInput} className={cn("p-2 rounded-lg transition-colors", isListening ? "bg-red-500/20 text-red-500 animate-pulse" : "text-white/70 hover:text-white hover:bg-white/5")}>
                                        <Mic className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setIsSettingsOpen(true)}
                                        className="p-2 text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2"
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

                {/* Mobile: Results Area */}
                <div className="flex-1 p-4 pb-24">
                    <AnimatePresence mode="wait">
                        {!hasImages && !loading && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 text-zinc-500">
                                <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/5 mx-auto mb-4 flex items-center justify-center">
                                    <ImageIcon className="w-8 h-8 opacity-50" />
                                </div>
                                <p className="text-sm">Write a prompt to start dreaming.</p>
                            </motion.div>
                        )}

                        {loading && (
                            <div className="w-full aspect-square rounded-2xl overflow-hidden mb-4">
                                <SkeletonLoader />
                            </div>
                        )}

                        {hasImages && (
                            <div className="grid grid-cols-1 gap-4">
                                {generatedImages.map((url, i) => (
                                    <motion.div
                                        key={url}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="relative group aspect-square rounded-2xl overflow-hidden border border-white/10 bg-zinc-900 shadow-xl"
                                    >
                                        <img src={url} className="w-full h-full object-cover" onClick={() => setSelectedImage(url)} />
                                        <div className="absolute top-2 right-2 flex gap-2">
                                            <a href={url} download className="p-2 bg-black/50 text-white rounded-full backdrop-blur-md">
                                                <Download className="w-4 h-4" />
                                            </a>
                                            <button onClick={() => setSelectedImage(url)} className="p-2 bg-black/50 text-white rounded-full backdrop-blur-md">
                                                <Maximize2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm text-center">
                                {error}
                            </div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Mobile: Sticky Generate Button */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-zinc-950/90 backdrop-blur-xl border-t border-white/10 z-50 pb-[env(safe-area-inset-bottom)+1rem]">
                    <button
                        onClick={handleGenerate}
                        disabled={loading || !prompt.trim()}
                        className={cn(
                            "w-full h-12 rounded-xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-xl",
                            loading ? "bg-zinc-800 text-white/50" : "bg-white text-black"
                        )}
                    >
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        {loading ? "Dreaming..." : "Generate Image"}
                    </button>
                </div>
            </div>

            {/* =========================================================
                DESKTOP LAYOUT (Strict Separation - New Design)
                Only visible on >= lg screens
               ========================================================= */}
            <div className="hidden lg:flex flex-col h-[calc(100vh-72px)] bg-transparent text-foreground relative">
                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto custom-scrollbar relative px-4 pb-40 md:pb-32 pt-10">
                    {/* Hero / Empty State */}
                    <AnimatePresence mode="popLayout">
                        {(!hasImages && !loading) && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -50 }}
                                transition={{ duration: 0.5, ease: "circOut" }}
                                className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-8 absolute inset-0 pointer-events-none"
                            >
                                {/* Ambient Glow */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 blur-[100px] rounded-full opacity-30 pointer-events-none" />

                                {/* Content */}
                                <div className="relative z-10 space-y-6 pointer-events-auto">
                                    <motion.div
                                        initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                                        className="w-24 h-24 bg-gradient-to-br from-zinc-800 to-zinc-950 rounded-3xl border border-white/10 flex items-center justify-center shadow-2xl mx-auto"
                                    >
                                        <ImageIcon className="w-10 h-10 text-white/80" />
                                    </motion.div>
                                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
                                        <span className="block text-white">Create Stunning</span>
                                        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">AI Artworks</span>
                                    </h1>
                                    <p className="text-zinc-400 max-w-lg mx-auto text-lg leading-relaxed">
                                        Describe your vision and let our advanced AI models bring it to life in seconds.
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Results Grid - Bento Style */}
                    <div className="max-w-7xl mx-auto w-full relative z-10">
                        <AnimatePresence mode="wait">
                            {loading && (
                                <motion.div
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="w-full max-w-2xl mx-auto aspect-square md:aspect-video"
                                >
                                    <SkeletonLoader />
                                </motion.div>
                            )}

                            {hasImages && (
                                <motion.div
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[300px]"
                                >
                                    {generatedImages.map((url, i) => (
                                        <motion.div
                                            key={url}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: i * 0.1 }}
                                            className={cn(
                                                "group relative rounded-3xl overflow-hidden border border-white/10 bg-zinc-900/40 shadow-2xl",
                                                generatedImages.length === 1 ? "md:col-span-2 md:row-span-2 md:aspect-square" : ""
                                            )}
                                        >
                                            <img src={url} className="w-full h-full object-cover cursor-pointer transition-transform duration-700 group-hover:scale-105" onClick={() => setSelectedImage(url)} />

                                            {/* Overlay Actions */}
                                            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                                <a href={url} download className="p-3 bg-white text-black rounded-full hover:scale-110 transition-transform shadow-lg" title="Download">
                                                    <Download className="w-5 h-5" />
                                                </a>
                                                <button onClick={() => setSelectedImage(url)} className="p-3 bg-black/50 text-white rounded-full hover:scale-110 transition-transform backdrop-blur-md shadow-lg border border-white/20" title="View Fullscreen">
                                                    <Expand className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                            {error && (
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto p-6 bg-red-500/10 border border-red-500/20 rounded-3xl text-center">
                                    <Info className="w-8 h-8 text-red-500 mx-auto mb-3" />
                                    <p className="text-red-400 font-medium">{error}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </main>

                {/* Bottom Input Section - Desktop Only */}
                <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-10 bg-gradient-to-t from-background via-background/95 to-transparent pointer-events-none">
                    <div className="max-w-4xl mx-auto pointer-events-auto">
                        {/* Desktop Settings Panel (Collapsible) */}
                        <AnimatePresence>
                            {showOptionsDesktop && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20, height: 0 }}
                                    animate={{ opacity: 1, y: 0, height: "auto" }}
                                    exit={{ opacity: 0, y: 20, height: 0 }}
                                    className="hidden lg:block mb-4 p-6 bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
                                >
                                    <div className="grid grid-cols-3 gap-8">
                                        <div className="space-y-3">
                                            <SectionLabel icon={Ratio}>Aspect Ratio</SectionLabel>
                                            <SimpleSelect value={aspectRatio} onChange={(v) => setAspectRatio(v as any)} options={aspectRatioOptions} />
                                        </div>
                                        <div className="space-y-3">
                                            <SectionLabel icon={Layers}>Quality</SectionLabel>
                                            <div className="flex bg-zinc-800/50 rounded-xl p-1">
                                                {qualityOptions.map((opt) => (
                                                    <button key={opt.id} onClick={() => setQuality(opt.id as any)} className={cn("flex-1 py-1.5 text-xs font-bold rounded-lg transition-all", quality === opt.id ? "bg-white text-black" : "text-zinc-400 hover:text-white")}>{opt.label}</button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <SectionLabel icon={MinusCircle}>Negative Prompt</SectionLabel>
                                            <input
                                                value={negativePrompt}
                                                onChange={(e) => setNegativePrompt(e.target.value)}
                                                placeholder="blur, distortion..."
                                                className="w-full bg-zinc-800/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Input Bar */}
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-[2rem] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                            <div className="relative flex flex-col md:flex-row items-end gap-2 bg-zinc-900/90 border border-white/10 backdrop-blur-2xl p-3 rounded-[24px] shadow-2xl transition-all focus-within:border-white/20">

                                {/* Desktop Settings Toggle */}
                                <button
                                    onClick={() => setShowOptionsDesktop(!showOptionsDesktop)}
                                    className={cn(
                                        "p-3 rounded-2xl transition-all items-center justify-center bg-white/5 hover:bg-white/10 text-white/70 hover:text-white",
                                        showOptionsDesktop ? "bg-white text-black" : ""
                                    )}
                                    title="Advanced Settings"
                                >
                                    <SlidersHorizontal className="w-5 h-5" />
                                </button>

                                {/* Text Input */}
                                <textarea
                                    ref={inputRef}
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="Describe anything..."
                                    className="flex-1 min-h-[56px] max-h-32 bg-transparent border-none text-base md:text-lg text-white placeholder:text-white/30 focus:ring-0 leading-relaxed py-3 px-2 custom-scrollbar resize-none"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleGenerate();
                                        }
                                    }}
                                />

                                {/* Actions Right */}
                                <div className="flex items-center gap-2 pb-1">
                                    {/* Voice */}
                                    <button onClick={handleVoiceInput} className={cn("hidden md:flex p-3 rounded-full transition-colors", isListening ? "bg-red-500/20 text-red-500" : "hover:bg-white/5 text-white/60")}>
                                        <Mic className="w-5 h-5" />
                                    </button>

                                    {/* Generate Button */}
                                    <button
                                        onClick={handleGenerate}
                                        disabled={loading || !prompt.trim()}
                                        className={cn(
                                            "h-12 px-6 md:px-8 rounded-xl font-bold text-sm md:text-base uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg",
                                            loading || !prompt.trim()
                                                ? "bg-zinc-800 text-white/30 cursor-not-allowed"
                                                : "bg-white text-black hover:scale-105 active:scale-95 hover:shadow-white/20"
                                        )}
                                    >
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 fill-black" />}
                                        <span className="hidden md:inline">{loading ? "Dreaming..." : "Generate"}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lightbox - Shared */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6"
                        onClick={() => setSelectedImage(null)}
                    >
                        <motion.img
                            initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                            src={selectedImage} className="max-h-[85vh] max-w-full rounded-2xl shadow-3xl object-contain"
                            onClick={(e) => e.stopPropagation()}
                        />
                        <div className="absolute top-6 right-6 flex gap-4">
                            <a href={selectedImage} download className="p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-md">
                                <Download className="w-6 h-6" />
                            </a>
                            <button className="p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors backdrop-blur-md" onClick={() => setSelectedImage(null)}>
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mobile Settings Drawer - Shared */}
            <SimpleSheet isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title="Settings">
                <div className="space-y-8 pt-4">
                    <div className="space-y-3">
                        <SectionLabel icon={Ratio}>Aspect Ratio</SectionLabel>
                        <SimpleSelect value={aspectRatio} onChange={(v) => setAspectRatio(v as any)} options={aspectRatioOptions} />
                    </div>
                    <div className="space-y-3">
                        <SectionLabel icon={Layers}>Quality Level</SectionLabel>
                        <div className="flex p-1 bg-zinc-900/50 rounded-xl border border-white/10">
                            {qualityOptions.map((opt) => (
                                <button key={opt.id} onClick={() => setQuality(opt.id as any)} className={cn("flex-1 py-3 text-[10px] font-bold rounded-lg transition-all uppercase", quality === opt.id ? "bg-white text-black" : "text-white/50")}>{opt.label}</button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-3">
                        <SectionLabel icon={MinusCircle}>Negative Prompt</SectionLabel>
                        <textarea value={negativePrompt} onChange={(e) => setNegativePrompt(e.target.value)} placeholder="blur, distortion..." className="w-full h-24 bg-zinc-900/50 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none" />
                    </div>
                </div>
            </SimpleSheet>
        </>
    );
}
