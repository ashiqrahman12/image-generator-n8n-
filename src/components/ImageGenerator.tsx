"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Loader2, Upload, X, Image as ImageIcon, Download, Share2, Monitor, ChevronDown, Mic, MicOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

const SkeletonLoader = () => (
    <div className="w-full h-full relative overflow-hidden bg-secondary/30 rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 opacity-20">
                <Sparkles className="w-12 h-12" />
                <p className="font-medium text-sm">Dreaming...</p>
            </div>
        </div>
    </div>
);

const qualityOptions = [
    { id: "1k", label: "1K", icon: Monitor, desc: "1024px" },
    { id: "2k", label: "2K", icon: Monitor, desc: "2048px" },
    { id: "4k", label: "4K", icon: Monitor, desc: "4096px" },
] as const;

const aspectRatioOptions = [
    { id: "1:1", label: "1:1", desc: "Square" },
    { id: "9:16", label: "9:16", desc: "Portrait" },
    { id: "16:9", label: "16:9", desc: "Landscape" },
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

    const MAX_IMAGES = 7;
    const MAX_SIZE_MB = 30;

    // Voice Input Handler using Web Speech API
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

        if (isListening) {
            recognition.stop();
        } else {
            recognition.start();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const newImages: { file: File; preview: string }[] = [];
        let totalSize = refImages.reduce((acc, img) => acc + img.file.size, 0);

        Array.from(files).forEach((file) => {
            if (refImages.length + newImages.length >= MAX_IMAGES) {
                alert(`Maximum ${MAX_IMAGES} images allowed.`);
                return;
            }
            totalSize += file.size;
            if (totalSize > MAX_SIZE_MB * 1024 * 1024) {
                alert(`Total size exceeds ${MAX_SIZE_MB}MB limit.`);
                return;
            }
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
            // Build FormData to send prompt, quality, aspect ratio, and reference image as binary
            const formData = new FormData();
            formData.append("prompt", prompt);
            formData.append("quality", quality);
            formData.append("aspectRatio", aspectRatio);
            formData.append("outputFormat", outputFormat);

            // Append all reference images as binary files
            refImages.forEach((img, index) => {
                formData.append(`referenceImage_${index}`, img.file, img.file.name);
            });
            formData.append("referenceImageCount", String(refImages.length));

            const response = await fetch("/api/generate", {
                method: "POST",
                body: formData, // FormData automatically sets correct Content-Type
            });

            if (!response.ok) throw new Error("Failed to generate image");
            const data = await response.json();
            if (data.imageUrl) {
                setGeneratedImage(data.imageUrl);
            } else {
                setError("No image data received");
            }
        } catch (err) {
            console.error(err);
            setError("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Auto-scroll to preview on mobile when generating or result arrives
    useEffect(() => {
        if ((loading || generatedImage) && window.innerWidth < 1024) {
            previewRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [loading, generatedImage]);

    return (
        <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-4rem)]">
            {/* LEFT PANEL: Controls */}
            <aside className="w-full lg:w-[380px] xl:w-[420px] p-4 lg:p-6 lg:pb-6 pb-64 border-r border-border bg-white flex flex-col gap-3 lg:gap-6 lg:overflow-y-auto">
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
                        <label className="text-sm font-semibold text-foreground">Prompt</label>
                        <button
                            type="button"
                            onClick={handleVoiceInput}
                            className={cn(
                                "p-2 rounded-lg transition-all",
                                isListening
                                    ? "bg-red-100 text-red-500 animate-pulse"
                                    : "bg-primary/10 text-primary hover:bg-primary/20"
                            )}
                            title={isListening ? "Stop listening" : "Voice input"}
                        >
                            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </button>
                    </div>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="A peaceful mountain landscape at sunrise with soft morning fog..."
                        className="w-full h-24 lg:h-32 p-4 rounded-2xl bg-input border border-border focus:ring-2 focus:ring-primary focus:border-primary resize-none transition-all text-sm placeholder:text-muted"
                    />
                </div>

                {/* Reference Images */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-foreground">Reference Images</label>
                        <span className="text-xs text-muted">{refImages.length}/{MAX_IMAGES}</span>
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        multiple
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    {refImages.length > 0 ? (
                        <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-2">
                                {refImages.map((img, index) => (
                                    <div key={index} className="relative group rounded-xl overflow-hidden border border-border aspect-square">
                                        <img src={img.preview} alt={`Reference ${index + 1}`} className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => removeImage(index)}
                                            className="absolute top-1 right-1 p-1 bg-white/90 rounded-full text-foreground hover:bg-white transition-colors shadow-sm opacity-0 group-hover:opacity-100"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                                {refImages.length < MAX_IMAGES && (
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="aspect-square border-2 border-dashed border-border rounded-xl flex items-center justify-center text-muted hover:border-primary hover:bg-primary/5 transition-all"
                                    >
                                        <Upload className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full h-28 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center text-muted hover:border-primary hover:bg-primary/5 transition-all group"
                        >
                            <Upload className="w-6 h-6 mb-2 group-hover:text-primary transition-colors" />
                            <span className="text-sm group-hover:text-primary transition-colors">Upload references</span>
                            <span className="text-xs text-muted mt-1">Up to 7 images, max 30MB total</span>
                        </button>
                    )}
                </div>

                {/* Quality Selector */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Quality</label>
                    <div className="grid grid-cols-3 gap-2">
                        {qualityOptions.map((opt) => (
                            <button
                                key={opt.id}
                                onClick={() => setQuality(opt.id)}
                                className={cn(
                                    "p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1.5 text-center",
                                    quality === opt.id
                                        ? "border-primary bg-primary/10 text-primary"
                                        : "border-border hover:border-primary/40 text-muted hover:text-foreground"
                                )}
                            >
                                <opt.icon className="w-5 h-5" />
                                <span className="text-xs font-semibold">{opt.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Aspect Ratio Selector */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Aspect Ratio</label>
                    <div className="relative">
                        <select
                            value={aspectRatio}
                            onChange={(e) => setAspectRatio(e.target.value as "1:1" | "9:16" | "16:9")}
                            className="w-full appearance-none p-3 pr-10 rounded-xl border-2 border-border bg-input text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-all cursor-pointer"
                        >
                            {aspectRatioOptions.map((opt) => (
                                <option key={opt.id} value={opt.id}>
                                    {opt.label} - {opt.desc}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted pointer-events-none" />
                    </div>
                </div>

                {/* Output Format Selector */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">Output Format</label>
                    <div className="relative">
                        <select
                            value={outputFormat}
                            onChange={(e) => setOutputFormat(e.target.value as "png" | "jpg")}
                            className="w-full appearance-none p-3 pr-10 rounded-xl border-2 border-border bg-input text-foreground focus:ring-2 focus:ring-primary focus:border-primary transition-all cursor-pointer"
                        >
                            {outputFormatOptions.map((opt) => (
                                <option key={opt.id} value={opt.id}>
                                    {opt.label} - {opt.desc}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted pointer-events-none" />
                    </div>
                </div>

                {/* Mobile Scroll Spacer */}
                <div className="h-32 lg:hidden" />

                {/* Generate Button */}
                <div className="fixed bottom-24 left-4 right-4 lg:static z-50 transition-all lg:p-0">
                    <button
                        onClick={handleGenerate}
                        disabled={loading || !prompt.trim()}
                        className={cn(
                            "w-full h-14 rounded-2xl font-bold text-white transition-all flex items-center justify-center gap-2.5 active:scale-95 shadow-xl shadow-primary/20",
                            "bg-primary hover:bg-primary-dark",
                            "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                        )}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Generating...</span>
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5" />
                                <span>Generate Image</span>
                            </>
                        )}
                    </button>
                </div>
            </aside>

            {/* RIGHT PANEL: Preview */}
            <main ref={previewRef} className="flex-1 bg-secondary/30 p-6 lg:p-10 flex items-center justify-center relative overflow-hidden">
                {/* Subtle dot pattern */}
                <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#90AB8B 0.5px, transparent 0.5px)', backgroundSize: '20px 20px' }} />

                <AnimatePresence mode="wait">
                    {!generatedImage && !loading && !error && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="text-center max-w-md"
                        >
                            <div className="w-28 h-28 bg-white rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-xl shadow-primary/10 border border-border">
                                <ImageIcon className="w-12 h-12 text-primary/40" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-2">Ready to Create</h3>
                            <p className="text-sm text-muted">Enter a prompt and watch the magic happen.</p>
                        </motion.div>
                    )}

                    {loading && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="relative w-full max-w-3xl aspect-square lg:aspect-auto lg:h-[70vh]"
                        >
                            <SkeletonLoader />
                        </motion.div>
                    )}

                    {generatedImage && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="relative group max-w-3xl w-full"
                        >
                            <div className="rounded-3xl overflow-hidden shadow-2xl shadow-primary/20 bg-white p-3 border border-border">
                                <img
                                    src={generatedImage}
                                    alt="Generated Artwork"
                                    className="w-full h-auto rounded-2xl object-cover max-h-[70vh]"
                                />
                            </div>
                            {/* Actions */}
                            <div className="absolute bottom-8 right-8 flex gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                                <button
                                    onClick={() => {
                                        if (generatedImage) {
                                            const link = document.createElement('a');
                                            link.href = generatedImage;
                                            link.download = `ai-generated-${Date.now()}.png`;
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                        }
                                    }}
                                    className="p-3 bg-white text-foreground rounded-xl shadow-lg hover:shadow-xl border border-border hover:border-primary transition-all"
                                    title="Download"
                                >
                                    <Download className="w-5 h-5" />
                                </button>
                                <button className="p-3 bg-primary text-white rounded-xl shadow-lg hover:shadow-xl hover:bg-primary-dark transition-all" title="Share">
                                    <Share2 className="w-5 h-5" />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {error && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-red-50 text-red-600 px-6 py-4 rounded-2xl border border-red-100 shadow-sm"
                        >
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
