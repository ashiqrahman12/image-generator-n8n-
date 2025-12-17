"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Loader2, Upload, X, Image as ImageIcon, Download, Share2, Monitor, ChevronDown, Mic, MicOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// --- Utility Utils (Shadcn-like) ---
function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// --- Components (Shadcn-like Primitives) ---
const SkeletonLoader = () => (
    <div className="w-full h-full relative overflow-hidden bg-secondary/20 rounded-3xl border border-white/50">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 opacity-30">
                <Sparkles className="w-12 h-12 text-primary" />
                <p className="font-medium text-sm text-primary">Dreaming...</p>
            </div>
        </div>
    </div>
);

const Label = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <label className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", className)}>
        {children}
    </label>
);

const InputStyles = "flex h-12 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-sm";

// --- Options Data ---
const qualityOptions = [
    { id: "1k", label: "1K", icon: Monitor, desc: "1024px" },
    { id: "2k", label: "2K", icon: Monitor, desc: "2048px" },
    { id: "4k", label: "4K", icon: Monitor, desc: "4096px" },
] as const;

const aspectRatioOptions = [
    { id: "1:1", label: "Square", desc: "1:1" },
    { id: "9:16", label: "Portrait", desc: "9:16" },
    { id: "16:9", label: "Landscape", desc: "16:9" },
] as const;

const outputFormatOptions = [
    { id: "png", label: "PNG", desc: "Lossless" },
    { id: "jpg", label: "JPG", desc: "Compressed" },
] as const;

export function ImageGenerator() {
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [quality, setQuality] = useState<"1k" | "2k" | "4k">("2k");
    const [aspectRatio, setAspectRatio] = useState<"1:1" | "9:16" | "16:9">("1:1");
    const [outputFormat, setOutputFormat] = useState<"png" | "jpg">("png");
    const [refImages, setRefImages] = useState<{ file: File; preview: string }[]>([]);
    const [isListening, setIsListening] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const previewRef = useRef<HTMLElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const MAX_IMAGES = 7;
    const MAX_SIZE_MB = 4;

    // Voice Input Handler
    const handleVoiceInput = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('Voice input is not supported in your browser.');
            return;
        }
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => setIsListening(false);
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setPrompt((prev) => prev ? `${prev} ${transcript}` : transcript);
        };
        isListening ? recognition.stop() : recognition.start();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        const newImages: { file: File; preview: string }[] = [];
        let totalSize = refImages.reduce((acc, img) => acc + img.file.size, 0);
        Array.from(files).forEach((file) => {
            if (refImages.length + newImages.length >= MAX_IMAGES) return alert(`Maximum ${MAX_IMAGES} images allowed.`);
            totalSize += file.size;
            if (totalSize > MAX_SIZE_MB * 1024 * 1024) return alert(`Total size exceeds ${MAX_SIZE_MB}MB limit.`);
            newImages.push({ file, preview: URL.createObjectURL(file) });
        });
        setRefImages((prev) => [...prev, ...newImages]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeImage = (index: number) => {
        setRefImages((prev) => {
            const updated = [...prev];
            URL.revokeObjectURL(updated[index].preview);
            updated.splice(index, 1);
            return updated;
        });
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setLoading(true);
        setError(null);
        setGeneratedImage(null);
        try {
            const formData = new FormData();
            formData.append("prompt", prompt);
            formData.append("quality", quality);
            formData.append("aspectRatio", aspectRatio);
            formData.append("outputFormat", outputFormat);
            refImages.forEach((img, index) => formData.append(`referenceImage_${index}`, img.file, img.file.name));
            formData.append("referenceImageCount", String(refImages.length));

            const response = await fetch("/api/generate", { method: "POST", body: formData });
            if (!response.ok) throw new Error("Failed to generate image");
            const data = await response.json();

            if (data.imageUrl) {
                setGeneratedImage(data.imageUrl);
                // History Logic
                try {
                    const newItem = { id: Date.now().toString(), image: data.imageUrl, prompt: prompt, timestamp: Date.now() };
                    const stored = localStorage.getItem("imageHistory");
                    const history = stored ? JSON.parse(stored) : [];
                    localStorage.setItem("imageHistory", JSON.stringify([newItem, ...history].slice(0, 3)));
                } catch (e) { console.error("Failed to save history", e); }
            } else { setError("No image data received"); }
        } catch (err: any) {
            console.error("Generation error:", err);
            setError(err.message || "An error occurred.");
        } finally { setLoading(false); }
    };

    useEffect(() => {
        if ((loading || generatedImage) && window.innerWidth < 1024) {
            // On mobile, slight delay to allow rendering then scroll
            setTimeout(() => {
                previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 100);
        }
    }, [loading, generatedImage]);

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100dvh-4rem)] bg-background">
            {/* LEFT PANEL: Controls (Scrollable) */}
            <aside
                ref={scrollContainerRef}
                className="w-full lg:w-[420px] flex flex-col bg-background/50 border-r border-border overflow-y-auto overflow-x-hidden scroll-smooth"
            >
                <div className="p-5 lg:p-6 pb-40 space-y-6">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="font-bold text-foreground">Create Image</h2>
                            <p className="text-xs text-muted">Describe your vision</p>
                        </div>
                    </div>

                    {/* Prompt Input */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>Prompt</Label>
                            <button
                                type="button"
                                onClick={handleVoiceInput}
                                className={cn("p-1.5 rounded-md transition-all", isListening ? "bg-red-100 text-red-500 animate-pulse" : "bg-secondary text-primary hover:bg-secondary/80")}
                            >
                                {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                            </button>
                        </div>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="A futuristic city in the clouds..."
                            className={cn(InputStyles, "h-28 pt-3 resize-none")}
                        />
                    </div>

                    {/* Reference Images */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>Reference Images</Label>
                            <span className="text-xs text-muted">{refImages.length}/{MAX_IMAGES}</span>
                        </div>
                        <input type="file" ref={fileInputRef} accept="image/*" multiple onChange={handleFileChange} className="hidden" />
                        <div className="grid grid-cols-3 gap-2">
                            {refImages.map((img, index) => (
                                <div key={index} className="relative group rounded-xl overflow-hidden border border-border aspect-square">
                                    <img src={img.preview} alt="Ref" className="w-full h-full object-cover" />
                                    <button onClick={() => removeImage(index)} className="absolute top-1 right-1 p-1 bg-white/90 rounded-full shadow-sm">
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                            {refImages.length < MAX_IMAGES && (
                                <button onClick={() => fileInputRef.current?.click()} className="aspect-square border-2 border-dashed border-border rounded-xl flex items-center justify-center text-muted hover:border-primary hover:bg-primary/5 transition-all">
                                    <Upload className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Controls Grid */}
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                            <Label>Quality</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {qualityOptions.map((opt) => (
                                    <button
                                        key={opt.id}
                                        onClick={() => setQuality(opt.id)}
                                        className={cn(
                                            "p-2.5 rounded-xl border transition-all flex flex-col items-center gap-1 text-center",
                                            quality === opt.id ? "border-primary bg-primary/10 text-primary ring-1 ring-primary" : "border-border hover:border-primary/50 text-muted"
                                        )}
                                    >
                                        <opt.icon className="w-4 h-4" />
                                        <span className="text-[10px] uppercase font-bold tracking-wide">{opt.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Aspect Ratio</Label>
                                <div className="relative">
                                    <select
                                        value={aspectRatio}
                                        onChange={(e) => setAspectRatio(e.target.value as any)}
                                        className={cn(InputStyles, "appearance-none pr-8")}
                                    >
                                        {aspectRatioOptions.map((opt) => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Format</Label>
                                <div className="relative">
                                    <select
                                        value={outputFormat}
                                        onChange={(e) => setOutputFormat(e.target.value as any)}
                                        className={cn(InputStyles, "appearance-none pr-8")}
                                    >
                                        {outputFormatOptions.map((opt) => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Sticky Action Footer (Mobile Only) */}
            <div className="lg:hidden fixed bottom-[4.5rem] left-0 right-0 p-4 bg-white/95 backdrop-blur-xl border-t border-border z-40 pb-4">
                <button
                    onClick={handleGenerate}
                    disabled={loading || !prompt.trim()}
                    className={cn(
                        "w-full h-12 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/25 active:scale-95",
                        "bg-primary hover:bg-primary-dark",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    <span>{loading ? "Generating..." : "Generate Image"}</span>
                </button>
            </div>

            {/* RIGHT PANEL: Preview */}
            <main ref={previewRef} className="flex-1 bg-secondary/30 relative flex flex-col items-center p-4 lg:p-10 overflow-y-auto">
                {/* Dot Pattern */}
                <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#90AB8B 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

                <div className="w-full max-w-3xl flex-1 flex flex-col justify-center min-h-[500px] lg:min-h-0 pb-32 lg:pb-0">
                    <AnimatePresence mode="wait">
                        {!generatedImage && !loading && !error && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center">
                                <div className="w-24 h-24 bg-white rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-primary/5 border border-white/50">
                                    <ImageIcon className="w-10 h-10 text-primary/30" />
                                </div>
                                <h3 className="text-lg font-bold text-foreground">Canvas Ready</h3>
                                <p className="text-sm text-muted">Your imagination is the limit.</p>
                            </motion.div>
                        )}
                        {loading && (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full aspect-square lg:aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl shadow-primary/10">
                                <SkeletonLoader />
                            </motion.div>
                        )}
                        {generatedImage && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative group w-full">
                                <div className="rounded-3xl overflow-hidden shadow-2xl shadow-primary/20 bg-white p-2 border border-white/50">
                                    <img src={generatedImage} alt="Generated" className="w-full h-auto rounded-2xl" />
                                </div>
                                {/* Mobile Actions */}
                                <div className="flex gap-3 mt-4 lg:hidden">
                                    <a href={generatedImage} download={`ai-gen-${Date.now()}.png`} className="flex-1 h-12 bg-foreground text-background rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform">
                                        <Download className="w-4 h-4" /> Save
                                    </a>
                                    <button className="h-12 w-12 bg-white text-foreground border border-border rounded-xl flex items-center justify-center shadow-sm active:scale-95 transition-transform">
                                        <Share2 className="w-4 h-4" />
                                    </button>
                                </div>
                                {/* Desktop Actions */}
                                <div className="hidden lg:flex absolute bottom-6 right-6 gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                                    <a href={generatedImage} download className="p-3 bg-white text-foreground rounded-xl shadow-lg hover:scale-105 transition-all"><Download className="w-5 h-5" /></a>
                                </div>
                            </motion.div>
                        )}
                        {error && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-50 text-red-600 px-6 py-4 rounded-xl border border-red-100 text-center">
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Desktop Generate Button (Visible only on Large screens) */}
                <div className="hidden lg:block absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
                    <button
                        onClick={handleGenerate}
                        disabled={loading || !prompt.trim()}
                        className={cn(
                            "h-14 px-8 rounded-2xl font-bold text-white transition-all flex items-center justify-center gap-2 shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 active:scale-95",
                            "bg-primary hover:bg-primary-dark",
                            "disabled:opacity-50 disabled:cursor-not-allowed"
                        )}
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                        <span>Generate Image</span>
                    </button>
                </div>
            </main>
        </div>
    );
}
