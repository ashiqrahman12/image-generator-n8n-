"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Loader2, Upload, X, Image as ImageIcon, Download, Share2, Monitor, ChevronDown, Mic, MicOff, Grid, Maximize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
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

    const MAX_IMAGES = 4; // reduced matching design usually
    const MAX_SIZE_MB = 10; // slightly increased for modern standards

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
                className="w-full lg:w-[420px] flex flex-col bg-white/5 backdrop-blur-xl border-r border-white/10 overflow-y-auto overflow-x-hidden scroll-smooth shadow-[4px_0_24px_-4px_rgba(0,0,0,0.05)] z-20"
            >
                <div className="p-5 lg:p-6 pb-40 space-y-8">
                    {/* Header - Now simplified as per design */}
                    <div className="hidden lg:flex items-center gap-2 mb-6">
                        <div className="h-8 w-1 bg-gradient-to-b from-purple-500 to-primary rounded-full" />
                        <h2 className="font-bold text-xl text-white">Describe Your Vision</h2>
                    </div>

                    {/* Prompt Input Section */}
                    <div className="space-y-3">
                        <div className="relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 to-primary/20 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-500"></div>
                            <div className="relative bg-[#0A0A0A] rounded-2xl border border-white/10 p-4">
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="A majestic dragon soaring through a sunset sky..."
                                    className="w-full h-32 bg-transparent border-none focus:ring-0 text-white placeholder:text-muted-foreground/50 resize-none text-base leading-relaxed"
                                />
                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                                    <span className="text-xs text-muted-foreground">{prompt.length} characters</span>
                                    <button
                                        type="button"
                                        onClick={handleVoiceInput}
                                        className={cn("flex items-center gap-1.5 text-xs font-semibold transition-colors", isListening ? "text-red-500 animate-pulse" : "text-purple-400 hover:text-purple-300")}
                                    >
                                        {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                                        {isListening ? "Stop Listening" : "Enhance Prompt"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Reference Images - Drag & Drop Style */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-base text-white font-semibold flex items-center gap-2">
                                <ImageIcon className="w-4 h-4 text-primary" />
                                Reference Images
                            </Label>
                            <span className="text-xs text-muted-foreground">(Optional - Max 4)</span>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <input type="file" ref={fileInputRef} accept="image/*" multiple onChange={handleFileChange} className="hidden" />

                            {refImages.length > 0 && (
                                <div className="grid grid-cols-4 gap-2 mb-2">
                                    {refImages.map((img, index) => (
                                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-white/10 group">
                                            <img src={img.preview} alt="Ref" className="w-full h-full object-cover" />
                                            <button onClick={() => removeImage(index)} className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full hover:bg-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {refImages.length < MAX_IMAGES && (
                                <motion.button
                                    whileHover={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-white/10 rounded-2xl h-32 w-full flex flex-col items-center justify-center gap-3 text-muted-foreground hover:border-primary/50 hover:text-primary transition-all group"
                                >
                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                        <Upload className="w-5 h-5" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-medium">Drag & drop or browse</p>
                                        <p className="text-xs opacity-50 mt-1">JPG, PNG supported</p>
                                    </div>
                                </motion.button>
                            )}
                        </div>
                    </div>

                    {/* Advanced Settings Accordion */}
                    <SimpleAccordion.AccordionItem title="Advanced Settings" className="border-t border-white/10 pt-2">
                        <div className="space-y-6 pt-2">
                            {/* Quality */}
                            <div className="space-y-3">
                                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Quality</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {qualityOptions.map((opt) => (
                                        <button
                                            key={opt.id}
                                            onClick={() => setQuality(opt.id)}
                                            className={cn(
                                                "px-3 py-2 rounded-lg text-sm font-medium transition-all border",
                                                quality === opt.id
                                                    ? "bg-primary/20 border-primary text-primary shadow-[0_0_15px_-3px_rgba(255,107,0,0.3)]"
                                                    : "bg-white/5 border-transparent text-muted-foreground hover:bg-white/10"
                                            )}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Aspect Ratio & Format */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Aspect Ratio</Label>
                                    <div className="relative">
                                        <select
                                            value={aspectRatio}
                                            onChange={(e) => setAspectRatio(e.target.value as any)}
                                            className="w-full h-10 pl-3 pr-8 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-primary/50 appearance-none cursor-pointer"
                                        >
                                            {aspectRatioOptions.map((opt) => <option key={opt.id} value={opt.id} className="bg-black">{opt.label}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Format</Label>
                                    <div className="relative">
                                        <select
                                            value={outputFormat}
                                            onChange={(e) => setOutputFormat(e.target.value as any)}
                                            className="w-full h-10 pl-3 pr-8 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-primary/50 appearance-none cursor-pointer"
                                        >
                                            {outputFormatOptions.map((opt) => <option key={opt.id} value={opt.id} className="bg-black">{opt.label}</option>)}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </SimpleAccordion.AccordionItem>
                </div>

                {/* Generate Button - Fixed at bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black to-transparent z-20">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleGenerate}
                        disabled={loading || !prompt.trim()}
                        className={cn(
                            "w-full h-14 rounded-2xl font-bold text-lg text-white shadow-xl shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                        )}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-primary to-purple-600 animate-gradient-x" />
                        <span className="relative z-10 flex items-center justify-center gap-2">
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 fill-white" />}
                            Generate Images
                        </span>
                    </motion.button>
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
