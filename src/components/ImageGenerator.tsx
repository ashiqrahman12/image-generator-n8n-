"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Sparkles,
    Plus,
    Image as ImageIcon,
    Maximize2,
    Download,
    X,
    Loader2,
    Wand2,
    Square,
    RectangleHorizontal,
    RectangleVertical,
    Minus,
    ChevronDown,
    Upload,
    Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface GeneratedImage {
    id: string;
    url: string;
    prompt: string;
    timestamp: number;
}

interface ReferenceImage {
    file: File;
    preview: string;
}

const aspectRatios = [
    { label: "1:1", value: "1:1", icon: Square },
    { label: "16:9", value: "16:9", icon: RectangleHorizontal },
    { label: "9:16", value: "9:16", icon: RectangleVertical },
];

const qualityOptions = ["1K", "2K", "4K"];

export function ImageGenerator() {
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);
    const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
    const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
    const [aspectRatio, setAspectRatio] = useState("1:1");
    const [quality, setQuality] = useState("1K");
    const [imageCount, setImageCount] = useState(1);
    const [showAspectDropdown, setShowAspectDropdown] = useState(false);
    const [referenceImage, setReferenceImage] = useState<ReferenceImage | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const preview = URL.createObjectURL(file);
            setReferenceImage({ file, preview });
        }
    };

    const removeReferenceImage = () => {
        if (referenceImage) {
            URL.revokeObjectURL(referenceImage.preview);
            setReferenceImage(null);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleGenerate = async () => {
        if (!prompt.trim() || loading) return;
        setLoading(true);

        try {
            // Build FormData for API (matches what route.ts expects)
            const formData = new FormData();
            formData.append("prompt", prompt);
            formData.append("quality", quality.toLowerCase());
            formData.append("aspectRatio", aspectRatio);
            formData.append("outputFormat", "png");

            // Append reference image if selected
            if (referenceImage) {
                formData.append("referenceImage_0", referenceImage.file);
                formData.append("referenceImageCount", "1");
            } else {
                formData.append("referenceImageCount", "0");
            }

            const res = await fetch("/api/generate", {
                method: "POST",
                body: formData, // FormData auto-sets Content-Type with boundary
            });
            const data = await res.json();

            if (data.imageUrls?.length) {
                const newImages: GeneratedImage[] = data.imageUrls.map((url: string) => ({
                    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    url,
                    prompt,
                    timestamp: Date.now()
                }));

                setGeneratedImages(prev => [...newImages, ...prev]);

                // Save to localStorage for Gallery
                try {
                    const existingHistory = JSON.parse(localStorage.getItem("imageHistory") || "[]");
                    const historyItems = newImages.map(img => ({
                        id: img.id,
                        image: img.url,
                        prompt: img.prompt,
                        timestamp: img.timestamp
                    }));
                    localStorage.setItem("imageHistory", JSON.stringify([...historyItems, ...existingHistory]));
                } catch (e) {
                    console.error("Failed to save to gallery:", e);
                }
            }
        } catch (error) {
            console.error("Generation failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleGenerate();
        }
    };

    const downloadImage = async (url: string, id: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `antigravity-${id}.png`;
            link.click();
        } catch (error) {
            console.error("Download failed:", error);
        }
    };

    return (
        <div className="min-h-screen bg-background relative flex flex-col">
            {/* Hero Section - Centered */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 pt-24 pb-40">
                {/* Logo Icon */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-8"
                >
                    <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/10 flex items-center justify-center">
                        <ImageIcon className="w-10 h-10 text-purple-400" />
                        <Wand2 className="w-6 h-6 text-pink-400 absolute -top-1 -right-1" />
                        <div className="absolute -top-2 -right-2">
                            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                        </div>
                    </div>
                </motion.div>

                {/* Title */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-4xl md:text-6xl font-extrabold tracking-tight text-center mb-4"
                >
                    <span className="text-white">ANTIGRAVITY </span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-primary">AI</span>
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-muted-foreground text-center max-w-md"
                >
                    Create stunning, <span className="text-purple-400">high-aesthetic</span> images in seconds
                </motion.p>

                {/* Generated Images Bento Grid */}
                {generatedImages.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full max-w-6xl mt-16"
                    >
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[200px]">
                            {generatedImages.map((img, index) => {
                                const isLarge = index % 7 === 0;
                                const isWide = index % 7 === 3;
                                const isTall = index % 7 === 5;

                                return (
                                    <motion.div
                                        key={img.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.05 }}
                                        className={cn(
                                            "group relative rounded-2xl overflow-hidden border border-white/10 bg-zinc-900/40 hover:border-purple-500/50 transition-all",
                                            isLarge ? "col-span-2 row-span-2" :
                                                isWide ? "col-span-2 row-span-1" :
                                                    isTall ? "col-span-1 row-span-2" :
                                                        "col-span-1 row-span-1"
                                        )}
                                    >
                                        <img
                                            src={img.url}
                                            alt={img.prompt}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />

                                        {/* Hover Overlay */}
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                            <p className="text-white text-xs line-clamp-2 mb-3 opacity-90">{img.prompt}</p>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setSelectedImage(img)}
                                                    className="flex-1 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg text-xs font-semibold text-white transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <Maximize2 className="w-3 h-3" /> View
                                                </button>
                                                <button
                                                    onClick={() => downloadImage(img.url, img.id)}
                                                    className="flex-1 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg text-xs font-semibold text-white transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <Download className="w-3 h-3" /> Download
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Bottom Input Bar - Fixed */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-zinc-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-2xl shadow-black/50">
                        {/* Reference Image Preview */}
                        {referenceImage && (
                            <div className="mb-3 flex items-center gap-3 p-2 bg-zinc-800/50 rounded-xl">
                                <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/20">
                                    <img
                                        src={referenceImage.preview}
                                        alt="Reference"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-white/70 font-medium">Reference Image</p>
                                    <p className="text-xs text-white/40 truncate">{referenceImage.file.name}</p>
                                </div>
                                <button
                                    onClick={removeReferenceImage}
                                    className="p-2 text-white/50 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                    title="Remove"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        {/* Hidden File Input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                        />

                        {/* Input Row */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 flex-1 bg-zinc-800/50 rounded-xl px-4 py-3">
                                {/* Upload Button */}
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className={cn(
                                        "p-1.5 rounded-lg transition-all hover:scale-110",
                                        referenceImage
                                            ? "text-purple-400 bg-purple-500/20"
                                            : "text-white/40 hover:text-white/70 hover:bg-white/10"
                                    )}
                                    title="Upload reference image"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Describe the scene you imagine"
                                    className="flex-1 bg-transparent text-white placeholder:text-white/40 focus:outline-none text-sm"
                                    disabled={loading}
                                />
                            </div>

                            {/* Generate Button */}
                            <button
                                onClick={handleGenerate}
                                disabled={loading || !prompt.trim()}
                                className={cn(
                                    "px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all",
                                    loading || !prompt.trim()
                                        ? "bg-zinc-700 text-white/50 cursor-not-allowed"
                                        : "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105"
                                )}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        Generate
                                        <Sparkles className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Controls Row */}
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                            {/* Model Badge */}
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800/80 border border-white/10 text-xs font-medium text-white/80">
                                <div className="w-4 h-4 rounded bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-[8px] font-bold">A</div>
                                Antigravity Pro
                            </div>

                            {/* Aspect Ratio */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowAspectDropdown(!showAspectDropdown)}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800/80 border border-white/10 text-xs font-medium text-white/80 hover:bg-zinc-700/80 transition-colors"
                                >
                                    <Square className="w-3 h-3" />
                                    {aspectRatio}
                                    <ChevronDown className="w-3 h-3" />
                                </button>

                                <AnimatePresence>
                                    {showAspectDropdown && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute bottom-full mb-2 left-0 bg-zinc-900 border border-white/10 rounded-xl overflow-hidden min-w-[100px]"
                                        >
                                            {aspectRatios.map((ar) => (
                                                <button
                                                    key={ar.value}
                                                    onClick={() => {
                                                        setAspectRatio(ar.value);
                                                        setShowAspectDropdown(false);
                                                    }}
                                                    className={cn(
                                                        "w-full px-4 py-2 text-xs text-left flex items-center gap-2 transition-colors",
                                                        aspectRatio === ar.value
                                                            ? "bg-purple-500/20 text-purple-400"
                                                            : "text-white/70 hover:bg-white/5"
                                                    )}
                                                >
                                                    <ar.icon className="w-3 h-3" />
                                                    {ar.label}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Quality */}
                            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-zinc-800/80 border border-white/10">
                                {qualityOptions.map((q) => (
                                    <button
                                        key={q}
                                        onClick={() => setQuality(q)}
                                        className={cn(
                                            "px-2 py-0.5 rounded text-xs font-medium transition-colors",
                                            quality === q
                                                ? "bg-white/10 text-white"
                                                : "text-white/50 hover:text-white/80"
                                        )}
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>

                            {/* Image Count */}
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800/80 border border-white/10">
                                <button
                                    onClick={() => setImageCount(Math.max(1, imageCount - 1))}
                                    className="text-white/50 hover:text-white transition-colors"
                                    disabled={imageCount <= 1}
                                >
                                    <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-xs font-medium text-white/80 min-w-[24px] text-center">{imageCount}/4</span>
                                <button
                                    onClick={() => setImageCount(Math.min(4, imageCount + 1))}
                                    className="text-white/50 hover:text-white transition-colors"
                                    disabled={imageCount >= 4}
                                >
                                    <Plus className="w-3 h-3" />
                                </button>
                            </div>

                            {/* Draw Mode */}
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800/80 border border-white/10 text-xs font-medium text-white/80">
                                <Wand2 className="w-3 h-3" />
                                Draw
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lightbox */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
                        onClick={() => setSelectedImage(null)}
                    >
                        <button
                            className="absolute top-4 right-4 md:top-6 md:right-6 w-12 h-12 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full flex items-center justify-center text-white transition-all hover:scale-110 z-10"
                            onClick={() => setSelectedImage(null)}
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative max-w-5xl w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img
                                src={selectedImage.url}
                                alt={selectedImage.prompt}
                                className="w-full h-auto max-h-[80vh] object-contain rounded-2xl shadow-2xl"
                            />

                            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-black/90 to-transparent rounded-b-2xl">
                                <p className="text-white/90 text-sm md:text-base mb-4 line-clamp-2">{selectedImage.prompt}</p>
                                <button
                                    onClick={() => downloadImage(selectedImage.url, selectedImage.id)}
                                    className="px-5 py-2.5 bg-white text-black rounded-full font-bold text-sm flex items-center gap-2 hover:scale-105 transition-transform"
                                >
                                    <Download className="w-4 h-4" />
                                    Download
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
