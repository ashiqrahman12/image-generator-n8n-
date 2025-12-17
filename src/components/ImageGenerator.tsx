"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Loader2, Upload, X, Image as ImageIcon, Download, Share2, Monitor, ChevronDown, Mic, MicOff, Grid, Maximize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { GlowingBorder } from "@/components/ui/glowing-border";
import * as SimpleAccordion from "@/components/ui/simple-accordion";

// --- Components (Shadcn-like Primitives) ---
const SkeletonLoader = () => (
    <div className="w-full h-full relative overflow-hidden bg-secondary/20 rounded-3xl border border-white/50 backdrop-blur-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
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

const InputStyles = "flex h-12 w-full rounded-xl border border-input bg-background/50 backdrop-blur-sm px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-sm focus:bg-background";

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
    const [loadingProgress, setLoadingProgress] = useState(0);
    // Updated state to hold array of images
    const [generatedImages, setGeneratedImages] = useState<string[]>([]);
    const [selectedImage, setSelectedImage] = useState<string | null>(null); // For lightbox
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
        setLoadingProgress(0);
        setError(null);
        setGeneratedImages([]); // Clear previous results
        setSelectedImage(null);

        // Simulate progress
        const interval = setInterval(() => {
            setLoadingProgress((prev) => {
                if (prev >= 90) return prev; // Hold at 90% until done
                return prev + Math.floor(Math.random() * 10) + 5;
            });
        }, 800);

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

            console.log("API Response:", data); // Debug log

            clearInterval(interval);
            setLoadingProgress(100);

            if (data.imageUrls && data.imageUrls.length > 0) {
                setTimeout(() => { // Small delay to show 100%
                    setGeneratedImages(data.imageUrls);
                    setLoading(false);
                }, 500);

                // History Logic (Save all generated, max 3 in storage)
                try {
                    const newItems = data.imageUrls.map((url: string) => ({
                        id: Date.now().toString() + Math.random().toString(),
                        image: url,
                        prompt: prompt,
                        timestamp: Date.now()
                    }));

                    const stored = localStorage.getItem("imageHistory");
                    const history = stored ? JSON.parse(stored) : [];
                    localStorage.setItem("imageHistory", JSON.stringify([...newItems, ...history].slice(0, 5))); // Increased history slightly
                } catch (e) { console.error("Failed to save history", e); }
            } else { setError("No image data received from API"); setLoading(false); }
        } catch (err: any) {
            clearInterval(interval);
            console.error("Generation error:", err);
            setError(err.message || "An error occurred.");
            setLoading(false);
        }
    };

    useEffect(() => {
        if ((loading || generatedImages.length > 0) && window.innerWidth < 1024) {
            setTimeout(() => {
                previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 100);
        }
    }, [loading, generatedImages]);

    // Format grid based on image count
    const getGridClass = (count: number) => {
        if (count === 1) return "grid-cols-1";
        if (count === 2) return "grid-cols-1 md:grid-cols-2";
        return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"; // Masonry-ish feel
    };

    return (
        <div className="flex flex-col lg:flex-row h-[calc(100dvh-4rem)] bg-background">
            {/* LEFT PANEL: Controls (Scrollable) */}
            <aside
                ref={scrollContainerRef}
                className="w-full lg:w-[420px] flex flex-col bg-white/50 backdrop-blur-xl border-r border-white/20 overflow-y-auto overflow-x-hidden scroll-smooth shadow-[4px_0_24px_-4px_rgba(0,0,0,0.05)] z-20"
            >
                <div className="p-5 lg:p-6 pb-40 space-y-6">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary/20 to-primary/5 flex items-center justify-center border border-primary/10">
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
                                className={cn("p-1.5 rounded-md transition-all", isListening ? "bg-red-900/50 text-red-500 animate-pulse" : "bg-white/10 text-foreground hover:bg-white/20")}
                            >
                                {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                            </button>
                        </div>
                        <GlowingBorder>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="A futuristic city in the clouds..."
                                className={cn(InputStyles, "h-28 pt-3 resize-none bg-black/80 shadow-none border-none focus:ring-0 text-white placeholder:text-gray-500")}
                            />
                        </GlowingBorder>
                    </div>

                    {/* Reference Images */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>Reference Images</Label>
                            <span className="text-xs text-muted-foreground">{refImages.length}/{MAX_IMAGES}</span>
                        </div>
                        <input type="file" ref={fileInputRef} accept="image/*" multiple onChange={handleFileChange} className="hidden" />
                        <div className="grid grid-cols-3 gap-2">
                            {refImages.map((img, index) => (
                                // ... existing image map code (kept simple for brevity, user didn't ask to change inner logic)
                                <motion.div key={index} className="relative group rounded-xl overflow-hidden border border-white/10 aspect-square">
                                    <img src={img.preview} alt="Ref" className="w-full h-full object-cover" />
                                    <button onClick={() => removeImage(index)} className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full hover:bg-red-500/80 transition-colors"><X className="w-3 h-3" /></button>
                                </motion.div>
                            ))}
                            {refImages.length < MAX_IMAGES && (
                                <GlowingBorder className="p-0">
                                    <motion.button
                                        whileHover={{ backgroundColor: "rgba(255,255,255, 0.1)" }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full h-full aspect-square flex items-center justify-center text-muted-foreground hover:text-primary transition-colors bg-black"
                                    >
                                        <Upload className="w-5 h-5" />
                                    </motion.button>
                                </GlowingBorder>
                            )}
                        </div>
                    </div>

                    {/* Controls Grid */}
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                            <Label>Quality</Label>
                            <div className="grid grid-cols-3 gap-2">
                                {qualityOptions.map((opt) => (
                                    <GlowingBorder key={opt.id} className="p-0">
                                        <motion.button
                                            whileHover={{ backgroundColor: "rgba(245, 200, 87, 0.1)" }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setQuality(opt.id)}
                                            className={cn(
                                                "w-full h-full p-2.5 flex flex-col items-center gap-1 text-center transition-all bg-black",
                                                quality === opt.id ? "text-primary bg-primary/10" : "text-muted-foreground"
                                            )}
                                        >
                                            <opt.icon className="w-4 h-4" />
                                            <span className="text-[10px] uppercase font-bold tracking-wide">{opt.label}</span>
                                        </motion.button>
                                    </GlowingBorder>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Aspect Ratio</Label>
                                <GlowingBorder className="p-0">
                                    <div className="relative h-12">
                                        <select
                                            value={aspectRatio}
                                            onChange={(e) => setAspectRatio(e.target.value as any)}
                                            className={cn(InputStyles, "w-full h-full appearance-none pr-8 bg-black border-none text-white focus:ring-0")}
                                        >
                                            {aspectRatioOptions.map((opt) => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                    </div>
                                </GlowingBorder>
                            </div>
                            <div className="space-y-2">
                                <Label>Format</Label>
                                <GlowingBorder className="p-0">
                                    <div className="relative h-12">
                                        <select
                                            value={outputFormat}
                                            onChange={(e) => setOutputFormat(e.target.value as any)}
                                            className={cn(InputStyles, "w-full h-full appearance-none pr-8 bg-black border-none text-white focus:ring-0")}
                                        >
                                            {outputFormatOptions.map((opt) => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                    </div>
                                </GlowingBorder>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Sticky Action Footer (Mobile Only - Glassmorphism) */}
            <div className="lg:hidden fixed bottom-[4.5rem] left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-white/20 z-40 pb-4 shadow-[0_-8px_32px_rgba(0,0,0,0.05)]">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleGenerate}
                    disabled={loading || !prompt.trim()}
                    className={cn(
                        "w-full h-12 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 shadow-xl shadow-primary/30",
                        "bg-gradient-to-r from-primary to-primary-dark hover:brightness-110",
                        "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                    )}
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                    <span>{loading ? "Generating..." : "Generate Image"}</span>
                </motion.button>
            </div>

            {/* RIGHT PANEL: Preview (Masonry Layout) */}
            <main ref={previewRef} className="flex-1 bg-secondary/10 relative flex flex-col items-center p-4 lg:p-10 overflow-y-auto">
                {/* Premium Glass/Noise Pattern */}
                <div className="absolute inset-0 opacity-20 pointer-events-none noise-bg mix-blend-overlay" />
                <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#90AB8B 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />

                <div className="w-full max-w-5xl flex-1 flex flex-col min-h-[500px] lg:min-h-0 pb-32 lg:pb-0 justify-center">
                    <AnimatePresence mode="wait">
                        {generatedImages.length === 0 && !loading && !error && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="text-center self-center my-auto">
                                <div className="w-24 h-24 bg-white rounded-[2rem] mx-auto mb-6 flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">
                                    <ImageIcon className="w-10 h-10 text-primary/40" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground mb-2 tracking-tight">Canvas Ready</h3>
                                <p className="text-sm text-muted">Awaiting your creative input.</p>
                            </motion.div>
                        )}

                        {loading && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="w-full h-full flex flex-col items-center justify-center gap-6">
                                <div className="w-full max-w-md aspect-square rounded-3xl overflow-hidden shadow-2xl relative">
                                    <SkeletonLoader />

                                    {/* Progress Overlay */}
                                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-white text-xs font-medium px-1">
                                                <span>Dreaming...</span>
                                                <span>{loadingProgress}%</span>
                                            </div>
                                            <Progress value={loadingProgress} className="h-2 bg-white/20" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {generatedImages.length > 0 && (
                            <motion.div
                                className={cn("grid gap-6 w-full auto-rows-min", getGridClass(generatedImages.length))}
                            >
                                {generatedImages.map((imgUrl, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4, delay: index * 0.1 }}
                                        className="relative group rounded-3xl overflow-hidden shadow-2xl shadow-primary/10 bg-white/40 backdrop-blur-md border border-white/60 p-2 transition-all hover:scale-[1.02] hover:shadow-primary/20 aspect-square"
                                    >
                                        <div className="w-full h-full relative rounded-2xl overflow-hidden cursor-pointer" onClick={() => setSelectedImage(imgUrl)}>
                                            <img src={imgUrl} alt={`Generated ${index}`} className="w-full h-full object-cover" />
                                            {/* Hover Overlay */}
                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                                                <a
                                                    href={imgUrl}
                                                    download={`ai-gen-${Date.now()}-${index}.png`}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="p-3 bg-white/90 text-foreground rounded-full shadow-lg hover:scale-110 transition-transform"
                                                >
                                                    <Download className="w-5 h-5" />
                                                </a>
                                                <button onClick={(e) => { e.stopPropagation(); setSelectedImage(imgUrl); }} className="p-3 bg-white/90 text-foreground rounded-full shadow-lg hover:scale-110 transition-transform">
                                                    <Maximize2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}

                        {error && (
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-red-50/80 backdrop-blur-md text-red-600 px-8 py-6 rounded-3xl border border-red-100 shadow-xl text-center self-center mx-auto">
                                <div className="p-3 bg-red-100 rounded-full w-fit mx-auto mb-3"><X className="w-6 h-6 text-red-500" /></div>
                                <h4 className="font-bold mb-1">Generation Failed</h4>
                                <p className="text-sm opacity-90">{error}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Desktop Generate Button */}
                <div className="hidden lg:block absolute bottom-8 left-1/2 -translate-x-1/2 z-30 w-64">
                    <GlowingBorder>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleGenerate}
                            disabled={loading || !prompt.trim()}
                            className={cn(
                                "h-14 w-full px-8 rounded-xl font-bold text-black transition-all flex items-center justify-center gap-2",
                                "bg-primary hover:bg-primary-light",
                                "disabled:opacity-50 disabled:cursor-not-allowed"
                            )}
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                            <span>Generate Image</span>
                        </motion.button>
                    </GlowingBorder>
                </div>
            </main>

            {/* Lightbox / Fullscreen View */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 lg:p-10"
                        onClick={() => setSelectedImage(null)}
                    >
                        <motion.img
                            initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                            src={selectedImage}
                            className="max-h-full max-w-full rounded-2xl shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                        <button className="absolute top-6 right-6 p-2 bg-white/10 text-white rounded-full hover:bg-white/20" onClick={() => setSelectedImage(null)}>
                            <X className="w-6 h-6" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
