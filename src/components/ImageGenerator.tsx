"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@clerk/nextjs";
import { saveImageToHistory } from "@/lib/supabase";
import { useModel } from "@/context/ModelContext";
import { initFFmpeg, trimVideo, isFFmpegLoaded } from "@/lib/videoTrimmer";
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
    Trash2,
    Mic,
    MicOff,
    Palette,
    Video,
    Play
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
    id: string;
}

const MAX_REFERENCE_IMAGES = 7;

const aspectRatios = [
    { label: "1:1", value: "1:1", icon: Square },
    { label: "16:9", value: "16:9", icon: RectangleHorizontal },
    { label: "9:16", value: "9:16", icon: RectangleVertical },
];

const qualityOptions = ["1K", "2K", "4K"];

const stylePresets = [
    {
        category: "Professional",
        styles: [
            { label: "Product Photography with Logo and Text", value: "product photography with logo and text, depth of field, sharp focus, advertising look, commercial" },
            { label: "Flat Lay", value: "flat lay photography, top-down view, objects arranged on surface, aesthetic layout" },
            { label: "Corporate Headshot", value: "professional headshot, corporate portrait, blurred office background, business attire" },
            { label: "Wedding Photography", value: "wedding photography, romantic, elegant, soft lighting, beautiful couple, celebration, dreamy atmosphere" },
        ]
    },
    {
        category: "Realistic",
        styles: [
            { label: "Cinematic", value: "cinematic style, movie-like color grading, dramatic lighting, wide angle, Hollywood quality" },
            { label: "Natural Outdoor", value: "natural sunlight, outdoor scenery, realistic textures, golden hour, landscape photography" },
            { label: "Analog Film", value: "analog film photography, grainy, faded colors, Kodak Portra look, vintage aesthetic" },
            { label: "Macro", value: "macro photography, extreme close-up, intricate details, shallow depth of field" },
            { label: "National Geographic", value: "National Geographic style, wildlife photography, nature documentary, high quality, detailed" },
            { label: "Underwater Photography", value: "underwater photography, ocean, marine life, deep blue, bubbles, aquatic, scuba diving perspective" },
        ]
    },
    {
        category: "Digital Art",
        styles: [
            { label: "3D Render", value: "3D render, Unreal Engine 5, hyper realistic, octane render, 8K, detailed" },
            { label: "Isometric 3D", value: "isometric 3D view, game-like perspective, clean lines, miniature style" },
            { label: "Cyberpunk", value: "cyberpunk style, neon lights, futuristic city, pink and blue tones, dystopian" },
            { label: "3D App Icon", value: "3D app icon, glossy, modern mobile app icon, rounded corners, vibrant gradient, UI design" },
            { label: "Pixar / Disney 3D", value: "Pixar Disney 3D animation style, cute characters, vibrant colors, high quality CGI, family friendly" },
        ]
    },
    {
        category: "Artistic",
        styles: [
            { label: "Modern Anime (4K)", value: "modern anime style, 4K quality, Japanese animation, vibrant colors, detailed, cinematic anime" },
            { label: "Retro 90s Anime", value: "retro 90s anime style, VHS aesthetic, classic anime, nostalgic, hand-drawn cel animation look" },
            { label: "Oil Painting", value: "oil painting style, Van Gogh inspired, visible brush strokes, classical art, textured" },
            { label: "Watercolor", value: "watercolor painting, soft washes, artistic, delicate, flowing colors, paper texture" },
            { label: "Pencil Sketch", value: "pencil sketch, black and white drawing, charcoal, hand-drawn, artistic" },
            { label: "Vector Art", value: "vector art, flat design, clean lines, illustrator style, minimal, logo design" },
            { label: "Pixel Art", value: "pixel art, retro video game style, 8-bit, 16-bit, nostalgic, game sprite" },
            { label: "Comic Book / Graphic Novel", value: "comic book style, graphic novel, bold outlines, halftone dots, superhero comic, dynamic poses" },
        ]
    },
    {
        category: "Design",
        styles: [
            { label: "Minimalist Logo", value: "minimalist logo design, simple, clean, modern, vector, brandable, iconic symbol" },
            { label: "Sticker Art", value: "sticker art, die-cut sticker, cute, kawaii, bold outlines, vinyl sticker design" },
            { label: "T-Shirt Design", value: "t-shirt design, print ready, graphic tee, trendy, streetwear style, bold graphics" },
            { label: "Seamless Pattern", value: "seamless pattern, tileable, repeating pattern, textile design, fabric print, wallpaper" },
        ]
    }
];

export function ImageGenerator() {
    const { user } = useUser();
    const { selectedModel } = useModel();
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);
    const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
    const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
    const [aspectRatio, setAspectRatio] = useState("1:1");
    const [quality, setQuality] = useState("1K");
    const [imageCount, setImageCount] = useState(1);
    const [showAspectDropdown, setShowAspectDropdown] = useState(false);
    const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
    const [referenceVideo, setReferenceVideo] = useState<File | null>(null);
    const [referenceVideoPreview, setReferenceVideoPreview] = useState<string | null>(null);
    const [videoDuration, setVideoDuration] = useState<number>(0);
    const [videoStartTime, setVideoStartTime] = useState<number>(0);
    const [videoEndTime, setVideoEndTime] = useState<number>(0);
    const [showTrimModal, setShowTrimModal] = useState(false);
    const [tempVideoFile, setTempVideoFile] = useState<File | null>(null);
    const [tempVideoPreview, setTempVideoPreview] = useState<string | null>(null);
    const [isTrimming, setIsTrimming] = useState(false);
    const [trimProgress, setTrimProgress] = useState<string>("");
    const [isListening, setIsListening] = useState(false);
    const [selectedStyle, setSelectedStyle] = useState<string>("");
    const [negativePrompt, setNegativePrompt] = useState<string>("");
    const [showStyleDropdown, setShowStyleDropdown] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const videoPreviewRef = useRef<HTMLVideoElement>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognitionRef = useRef<any>(null);

    // Voice recognition handler using free Web Speech API
    const toggleVoiceInput = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('Voice recognition is not supported in your browser. Please use Chrome or Edge.');
            return;
        }

        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const win = window as any;
        const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;

        recognition.continuous = true;  // Keep listening until manually stopped
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (event: any) => {
            const transcript = Array.from(event.results)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .map((result: any) => result[0].transcript)
                .join('');
            setPrompt(transcript);
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            if (event.error !== 'no-speech') {
                setIsListening(false);
            }
        };

        // Don't auto-stop on end - only stop when user clicks button
        recognition.onend = () => {
            // If still supposed to be listening, restart (handles browser auto-stop)
            if (isListening && recognitionRef.current) {
                try {
                    recognitionRef.current.start();
                } catch (e) {
                    setIsListening(false);
                }
            }
        };

        recognition.start();
        setIsListening(true);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const remainingSlots = MAX_REFERENCE_IMAGES - referenceImages.length;
        const filesToAdd = Array.from(files).slice(0, remainingSlots);

        const newImages: ReferenceImage[] = filesToAdd
            .filter(file => file.type.startsWith('image/'))
            .map(file => ({
                file,
                preview: URL.createObjectURL(file),
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            }));

        setReferenceImages(prev => [...prev, ...newImages]);

        // Reset input so same file can be selected again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeReferenceImage = (id: string) => {
        setReferenceImages(prev => {
            const imageToRemove = prev.find(img => img.id === id);
            if (imageToRemove) {
                URL.revokeObjectURL(imageToRemove.preview);
            }
            return prev.filter(img => img.id !== id);
        });
    };

    const clearAllReferenceImages = () => {
        referenceImages.forEach(img => URL.revokeObjectURL(img.preview));
        setReferenceImages([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Handle video file selection (for video models)
    const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const videoFile = files[0];
        if (!videoFile.type.startsWith('video/')) {
            alert('Please select a video file');
            return;
        }

        const videoUrl = URL.createObjectURL(videoFile);

        // Get video duration to decide if we need trim modal
        const tempVideo = document.createElement('video');
        tempVideo.src = videoUrl;
        tempVideo.onloadedmetadata = () => {
            const duration = tempVideo.duration;

            // If video is under 30s, accept directly
            if (duration <= 30) {
                setReferenceVideo(videoFile);
                setReferenceVideoPreview(videoUrl);
                setVideoDuration(duration);
                setVideoStartTime(0);
                setVideoEndTime(duration);
            } else {
                // Video needs trimming - show modal for 30s selection
                setTempVideoFile(videoFile);
                setTempVideoPreview(videoUrl);
                setVideoDuration(duration);
                setVideoStartTime(0);
                setVideoEndTime(Math.min(30, duration));
                setShowTrimModal(true);
            }
        };
    };

    // Save trimmed video selection from modal - uses FFmpeg.wasm for actual trimming
    const handleSaveTrim = async () => {
        if (!tempVideoFile || !tempVideoPreview) return;

        // If video needs trimming (longer than 30s), use FFmpeg
        if (videoDuration > 30) {
            setIsTrimming(true);
            setTrimProgress("Initializing FFmpeg...");

            try {
                const duration = Math.min(30, videoDuration - videoStartTime);
                const trimmedFile = await trimVideo(
                    tempVideoFile,
                    videoStartTime,
                    duration,
                    (progress) => setTrimProgress(progress)
                );

                if (trimmedFile) {
                    // Create new preview URL for trimmed video
                    const trimmedUrl = URL.createObjectURL(trimmedFile);

                    setReferenceVideo(trimmedFile);
                    setReferenceVideoPreview(trimmedUrl);
                    setVideoDuration(duration);
                    setVideoStartTime(0);
                    setVideoEndTime(duration);

                    // Clean up old preview
                    URL.revokeObjectURL(tempVideoPreview);
                } else {
                    alert("❌ Failed to trim video. Please try a smaller video.");
                }
            } catch (error) {
                console.error("Trim error:", error);
                alert(`❌ Trim failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            } finally {
                setIsTrimming(false);
                setTrimProgress("");
            }
        } else {
            // Video is already under 30s, use as-is
            setReferenceVideo(tempVideoFile);
            setReferenceVideoPreview(tempVideoPreview);
        }

        setShowTrimModal(false);
        setTempVideoFile(null);
        setTempVideoPreview(null);
    };

    // Cancel trim modal
    const handleCancelTrim = () => {
        if (tempVideoPreview) {
            URL.revokeObjectURL(tempVideoPreview);
        }
        setShowTrimModal(false);
        setTempVideoFile(null);
        setTempVideoPreview(null);
        setVideoDuration(0);
        setVideoStartTime(0);
        setVideoEndTime(0);
    };

    const removeReferenceVideo = () => {
        if (referenceVideoPreview) {
            URL.revokeObjectURL(referenceVideoPreview);
        }
        setReferenceVideo(null);
        setReferenceVideoPreview(null);
        setVideoDuration(0);
        setVideoStartTime(0);
        setVideoEndTime(0);
    };

    // Format time as MM:SS
    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleGenerate = async () => {
        if (loading) return;
        setLoading(true);

        try {
            const formData = new FormData();

            // Route based on model type
            if (selectedModel.type === 'video') {
                // Video model generation
                formData.append("modelId", selectedModel.id);

                // Add image for motion control
                if (referenceImages.length > 0) {
                    formData.append("image", referenceImages[0].file);
                } else {
                    alert("Please upload a character/subject image");
                    setLoading(false);
                    return;
                }

                // Add video for motion reference
                if (referenceVideo) {
                    formData.append("video", referenceVideo);
                } else {
                    alert("Please upload a motion reference video");
                    setLoading(false);
                    return;
                }

                // Add other options
                formData.append("prompt", prompt);
                formData.append("negative_prompt", negativePrompt);
                formData.append("start_time", videoStartTime.toString());
                formData.append("end_time", videoEndTime.toString());
                formData.append("character_orientation", "video");
                formData.append("keep_original_sound", "true");

                const res = await fetch("/api/generate/video", {
                    method: "POST",
                    body: formData,
                });

                console.log("Video API response status:", res.status);
                const data = await res.json();
                console.log("Video API response data:", data);

                if (!res.ok) {
                    console.error("Video API error:", data);
                    alert(`❌ Error: ${data.error || 'Unknown error occurred'}`);
                } else if (data.requestId) {
                    // Got requestId - now poll for result
                    console.log("Video job submitted, polling for result...", data.requestId);

                    // Poll for result from client side
                    const pollForResult = async (requestId: string): Promise<string[]> => {
                        let attempt = 0;
                        while (true) {
                            attempt++;
                            console.log(`Polling attempt ${attempt}...`);

                            try {
                                const pollRes = await fetch(`/api/generate/video/poll?requestId=${requestId}`);
                                const pollData = await pollRes.json();

                                console.log(`Poll response:`, pollData);

                                if (pollData.status === 'completed') {
                                    return pollData.videoUrls || [];
                                } else if (pollData.status === 'failed') {
                                    throw new Error(pollData.error || 'Video generation failed');
                                } else if (pollData.status === 'error') {
                                    throw new Error(pollData.error || 'Polling error');
                                }
                                // Still processing - wait and retry
                            } catch (pollError) {
                                console.error("Poll error:", pollError);
                                throw pollError;
                            }

                            // Wait 5 seconds before next poll
                            await new Promise(resolve => setTimeout(resolve, 5000));
                        }
                    };

                    try {
                        const videoUrls = await pollForResult(data.requestId);
                        if (videoUrls.length > 0) {
                            setGeneratedVideo(videoUrls[0]);
                            alert("✅ Video generated successfully!");
                        } else {
                            alert("❌ No video output received.");
                        }
                    } catch (pollError) {
                        console.error("Polling failed:", pollError);
                        alert(`❌ ${pollError instanceof Error ? pollError.message : 'Video generation failed'}`);
                    }
                } else if (data.error) {
                    alert(`❌ ${data.error}`);
                } else {
                    console.error("Unexpected response:", data);
                    alert("❌ Video generation failed. Please try again.");
                }
            } else {
                // Image model generation (existing logic)
                if (!prompt.trim()) {
                    alert("Please enter a prompt");
                    setLoading(false);
                    return;
                }

                formData.append("prompt", prompt);
                formData.append("quality", quality.toLowerCase());
                formData.append("aspectRatio", aspectRatio);
                formData.append("outputFormat", "png");
                formData.append("stylePreset", selectedStyle);

                referenceImages.forEach((img, index) => {
                    formData.append(`referenceImage_${index}`, img.file);
                });
                formData.append("referenceImageCount", String(referenceImages.length));

                const res = await fetch("/api/generate", {
                    method: "POST",
                    body: formData,
                });
                const data = await res.json();

                if (data.imageUrls?.length) {
                    if (user?.id) {
                        let savedCount = 0;
                        for (const url of data.imageUrls) {
                            const saved = await saveImageToHistory(
                                user.id,
                                url,
                                prompt,
                                selectedStyle || undefined
                            );
                            if (saved) savedCount++;
                        }
                        console.log("Saved to Supabase gallery:", savedCount, "images");
                        alert(`✅ ${savedCount} image(s) generated and saved to Gallery!`);
                    } else {
                        console.warn("User not logged in, images not saved to gallery");
                        alert("⚠️ Image generated but not saved. Please sign in to save to gallery.");
                    }
                } else if (data.error) {
                    alert(`❌ ${data.error}`);
                } else {
                    console.warn("No imageUrls in API response:", data);
                    alert("❌ Generation failed. Please try again.");
                }
            }
        } catch (error) {
            console.error("Generation failed:", error);
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            alert(`❌ Generation failed: ${errorMessage}`);
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
            <div className="flex-1 flex flex-col items-center justify-center px-4 md:px-6 pt-20 md:pt-24 pb-48 md:pb-40">
                {/* Logo Icon */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mb-8"
                >
                    <div className="relative w-16 h-16 md:w-24 md:h-24 rounded-2xl md:rounded-3xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-white/10 flex items-center justify-center">
                        <ImageIcon className="w-7 h-7 md:w-10 md:h-10 text-purple-400" />
                        <Wand2 className="w-4 h-4 md:w-6 md:h-6 text-pink-400 absolute -top-1 -right-1" />
                        <div className="absolute -top-2 -right-2">
                            <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-primary animate-pulse" />
                        </div>
                    </div>
                </motion.div>

                {/* Title */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-2xl sm:text-4xl md:text-6xl font-extrabold tracking-tight text-center mb-3 md:mb-4"
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
            <div className="fixed bottom-0 left-0 right-0 p-3 md:p-6 pb-24 md:pb-6 bg-gradient-to-t from-background via-background to-transparent z-50">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-zinc-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-3 md:p-4 shadow-2xl shadow-black/50">

                        {/* Reference Images Preview - Only for image models */}
                        {selectedModel.type === 'image' && referenceImages.length > 0 && (
                            <div className="mb-3 p-2 bg-zinc-800/50 rounded-xl">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs text-white/70 font-medium">
                                        Reference Images ({referenceImages.length}/{MAX_REFERENCE_IMAGES})
                                    </p>
                                    <button
                                        onClick={clearAllReferenceImages}
                                        className="text-[10px] text-red-400 hover:text-red-300 transition-colors"
                                    >
                                        Clear all
                                    </button>
                                </div>
                                <div className="flex gap-2 overflow-x-auto pb-1">
                                    {referenceImages.map((img) => (
                                        <div key={img.id} className="relative shrink-0 group">
                                            <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg overflow-hidden border border-white/20">
                                                <img
                                                    src={img.preview}
                                                    alt="Reference"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <button
                                                onClick={() => removeReferenceImage(img.id)}
                                                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-3 h-3 text-white" />
                                            </button>
                                        </div>
                                    ))}
                                    {referenceImages.length < MAX_REFERENCE_IMAGES && (
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-12 h-12 md:w-14 md:h-14 rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center text-white/40 hover:text-white/60 hover:border-white/40 transition-colors shrink-0"
                                        >
                                            <Plus className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Compact Image & Video Preview Row (for video models) */}
                        {selectedModel.type === 'video' && (referenceImages.length > 0 || referenceVideoPreview) && (
                            <div className="mb-3 p-2 bg-zinc-800/50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    {/* Image Preview Square */}
                                    {referenceImages.length > 0 ? (
                                        <div className="relative group">
                                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 border-purple-500/50 bg-black">
                                                <img
                                                    src={referenceImages[0].preview}
                                                    alt="Character"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <button
                                                onClick={() => removeReferenceImage(referenceImages[0].id)}
                                                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-3 h-3 text-white" />
                                            </button>
                                            <p className="text-[9px] text-center text-purple-300 mt-1">Character</p>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-16 h-16 md:w-20 md:h-20 rounded-lg border-2 border-dashed border-purple-500/50 flex flex-col items-center justify-center text-purple-400 hover:border-purple-400 hover:text-purple-300 transition-colors"
                                        >
                                            <Plus className="w-5 h-5" />
                                            <span className="text-[9px] mt-1">Image</span>
                                        </button>
                                    )}

                                    {/* Video Preview Square */}
                                    {referenceVideoPreview ? (
                                        <div className="relative group">
                                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 border-pink-500/50 bg-black">
                                                <video
                                                    src={referenceVideoPreview}
                                                    className="w-full h-full object-cover"
                                                    muted
                                                />
                                            </div>
                                            <button
                                                onClick={removeReferenceVideo}
                                                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-3 h-3 text-white" />
                                            </button>
                                            <p className="text-[9px] text-center text-pink-300 mt-1">Motion</p>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => videoInputRef.current?.click()}
                                            className="w-16 h-16 md:w-20 md:h-20 rounded-lg border-2 border-dashed border-pink-500/50 flex flex-col items-center justify-center text-pink-400 hover:border-pink-400 hover:text-pink-300 transition-colors"
                                        >
                                            <Video className="w-5 h-5" />
                                            <span className="text-[9px] mt-1">Video</span>
                                        </button>
                                    )}

                                    {/* Info */}
                                    <div className="flex-1 text-xs text-white/50">
                                        {referenceVideoPreview && videoDuration > 0 && (
                                            <div className="space-y-1">
                                                <p>Duration: <span className="text-pink-300">{formatTime(videoDuration)}</span></p>
                                                <p>Selected: <span className="text-green-400">{formatTime(videoStartTime)} → {formatTime(Math.min(videoStartTime + 30, videoDuration))}</span></p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Hidden File Inputs */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                        <input
                            ref={videoInputRef}
                            type="file"
                            accept="video/*"
                            onChange={handleVideoSelect}
                            className="hidden"
                        />

                        {/* Controls Row - Always Visible */}
                        <div className="flex flex-wrap items-center justify-start gap-1.5 md:gap-2 mb-3 pb-1">
                            {/* Aspect Ratio */}
                            <div className="relative shrink-0">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowAspectDropdown(!showAspectDropdown);
                                    }}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800/80 border border-white/10 text-xs md:text-[11px] font-medium text-white/80 hover:bg-zinc-700/80 transition-colors"
                                >
                                    <Square className="w-4 h-4 md:w-3 md:h-3" />
                                    {aspectRatio}
                                    <ChevronDown className={cn("w-4 h-4 md:w-3 md:h-3 transition-transform", showAspectDropdown && "rotate-180")} />
                                </button>

                                {showAspectDropdown && (
                                    <>
                                        {/* Backdrop to close dropdown */}
                                        <div
                                            className="fixed inset-0 z-[60]"
                                            onClick={() => setShowAspectDropdown(false)}
                                        />
                                        {/* Dropdown Menu */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="absolute bottom-full mb-2 left-0 bg-zinc-900 border border-white/10 rounded-xl overflow-hidden min-w-[100px] z-[70] shadow-xl"
                                        >
                                            {aspectRatios.map((ar) => (
                                                <button
                                                    key={ar.value}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setAspectRatio(ar.value);
                                                        setShowAspectDropdown(false);
                                                    }}
                                                    className={cn(
                                                        "w-full px-3 py-2.5 text-xs text-left flex items-center gap-2 transition-colors",
                                                        aspectRatio === ar.value
                                                            ? "bg-purple-500/20 text-purple-400"
                                                            : "text-white/70 hover:bg-white/10"
                                                    )}
                                                >
                                                    <ar.icon className="w-3.5 h-3.5" />
                                                    {ar.label}
                                                </button>
                                            ))}
                                        </motion.div>
                                    </>
                                )}
                            </div>

                            {/* Quality */}
                            <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-zinc-800/80 border border-white/10 shrink-0">
                                {qualityOptions.map((q) => (
                                    <button
                                        key={q}
                                        onClick={() => setQuality(q)}
                                        className={cn(
                                            "px-2.5 py-1 rounded text-xs md:text-[11px] font-medium transition-colors",
                                            quality === q
                                                ? "bg-purple-500/30 text-purple-300"
                                                : "text-white/50 hover:text-white/80"
                                        )}
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>

                            {/* Voice Command */}
                            <button
                                onClick={toggleVoiceInput}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-2 rounded-lg border shrink-0 transition-all",
                                    isListening
                                        ? "bg-red-500/20 border-red-500/50 text-red-400 animate-pulse"
                                        : "bg-zinc-800/80 border-white/10 text-white/80 hover:bg-zinc-700/80"
                                )}
                                title={isListening ? "Stop listening" : "Voice input"}
                            >
                                {isListening ? (
                                    <MicOff className="w-4 h-4" />
                                ) : (
                                    <Mic className="w-4 h-4" />
                                )}
                            </button>

                            {/* Style Preset */}
                            <div className="relative shrink-0">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowStyleDropdown(!showStyleDropdown);
                                    }}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs md:text-[11px] font-medium transition-colors",
                                        selectedStyle
                                            ? "bg-purple-500/20 border-purple-500/50 text-purple-300"
                                            : "bg-zinc-800/80 border-white/10 text-white/80 hover:bg-zinc-700/80"
                                    )}
                                >
                                    <Palette className="w-4 h-4" />
                                    <span className="hidden md:inline max-w-[80px] truncate">
                                        {selectedStyle || "Style"}
                                    </span>
                                    <ChevronDown className={cn("hidden md:block w-3 h-3 transition-transform", showStyleDropdown && "rotate-180")} />
                                </button>

                                {showStyleDropdown && (
                                    <>
                                        {/* Backdrop */}
                                        <div
                                            className="fixed inset-0 z-[60] bg-black/50 md:bg-transparent"
                                            onClick={() => setShowStyleDropdown(false)}
                                        />
                                        {/* Mobile: Bottom Sheet | Desktop: Dropdown */}
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={cn(
                                                "bg-zinc-900 border border-white/10 overflow-hidden z-[70] shadow-xl",
                                                // Mobile: Fixed bottom sheet
                                                "fixed inset-x-4 bottom-4 rounded-2xl max-h-[70vh]",
                                                // Desktop: Absolute dropdown
                                                "md:absolute md:inset-auto md:bottom-full md:mb-2 md:right-0 md:w-[280px] md:max-h-[350px] md:rounded-xl"
                                            )}
                                            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
                                        >
                                            {/* Header - Mobile only */}
                                            <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/10 bg-zinc-800/50">
                                                <span className="text-sm font-semibold text-white">Select Style Preset</span>
                                                <button
                                                    onClick={() => setShowStyleDropdown(false)}
                                                    className="text-white/60 hover:text-white"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>
                                            <div className="overflow-y-auto max-h-[60vh] md:max-h-[350px]">
                                                {/* Clear Style Option */}
                                                {selectedStyle && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedStyle("");
                                                            setShowStyleDropdown(false);
                                                        }}
                                                        className="w-full px-4 py-3 md:px-3 md:py-2 text-sm md:text-xs text-left text-red-400 hover:bg-red-500/10 border-b border-white/10"
                                                    >
                                                        ✕ Clear Style
                                                    </button>
                                                )}
                                                {stylePresets.map((category) => (
                                                    <div key={category.category}>
                                                        <div className="px-4 py-2.5 md:px-3 md:py-2 text-xs md:text-[10px] font-bold text-purple-400 uppercase tracking-wider bg-zinc-800/50 sticky top-0">
                                                            {category.category}
                                                        </div>
                                                        {category.styles.map((style) => (
                                                            <button
                                                                key={style.label}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedStyle(style.label);
                                                                    if (!prompt.includes(style.value)) {
                                                                        setPrompt(prev => prev ? `${prev}, ${style.value}` : style.value);
                                                                    }
                                                                    setShowStyleDropdown(false);
                                                                }}
                                                                className={cn(
                                                                    "w-full px-4 py-3 md:px-3 md:py-2 text-sm md:text-xs text-left transition-colors",
                                                                    selectedStyle === style.label
                                                                        ? "bg-purple-500/20 text-purple-300"
                                                                        : "text-white/70 hover:bg-white/10"
                                                                )}
                                                            >
                                                                {style.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </div>

                            {/* Model Badge - Desktop only */}
                            <div className="hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-800/80 border border-white/10 text-[11px] font-medium text-white/80 shrink-0">
                                <div className="w-3.5 h-3.5 rounded bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-[7px] font-bold">A</div>
                                Antigravity Pro
                            </div>
                        </div>

                        {/* Input Row - Gemini Style */}
                        <div className="flex items-end gap-2 w-full max-w-full overflow-hidden">
                            <div className="flex items-end gap-2 flex-1 min-w-0 bg-zinc-800/50 rounded-2xl px-3 py-2.5 md:px-4 md:py-3">
                                {/* Upload Image Button */}
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className={cn(
                                        "p-1 md:p-1.5 rounded-lg transition-all hover:scale-110 shrink-0 mb-0.5",
                                        referenceImages.length > 0
                                            ? "text-purple-400 bg-purple-500/20"
                                            : "text-white/40 hover:text-white/70 hover:bg-white/10"
                                    )}
                                    title={`Upload reference images (${referenceImages.length}/${MAX_REFERENCE_IMAGES})`}
                                    disabled={referenceImages.length >= MAX_REFERENCE_IMAGES}
                                >
                                    <Plus className="w-4 h-4 md:w-5 md:h-5" />
                                </button>

                                {/* Upload Video Button - Only for video models */}
                                {selectedModel.type === 'video' && (
                                    <button
                                        onClick={() => videoInputRef.current?.click()}
                                        className={cn(
                                            "p-1 md:p-1.5 rounded-lg transition-all hover:scale-110 shrink-0 mb-0.5",
                                            referenceVideo
                                                ? "text-pink-400 bg-pink-500/20"
                                                : "text-white/40 hover:text-white/70 hover:bg-white/10"
                                        )}
                                        title="Upload motion reference video"
                                    >
                                        <Video className="w-4 h-4 md:w-5 md:h-5" />
                                    </button>
                                )}
                                <textarea
                                    ref={textareaRef}
                                    value={prompt}
                                    onChange={(e) => {
                                        setPrompt(e.target.value);
                                        // Auto-resize
                                        e.target.style.height = 'auto';
                                        e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleGenerate();
                                        }
                                    }}
                                    placeholder={selectedModel.type === 'video' ? "Describe the motion/action (optional)..." : "Describe the scene..."}
                                    className="flex-1 bg-transparent text-white placeholder:text-white/40 focus:outline-none text-base md:text-sm min-w-0 resize-none overflow-y-auto leading-relaxed"
                                    disabled={loading}
                                    rows={1}
                                    style={{ maxHeight: '150px' }}
                                />
                            </div>

                            {/* Negative Prompt Input - Only for video models */}
                            {selectedModel.type === 'video' && (
                                <div className="flex items-center gap-2 flex-1 min-w-0 bg-red-900/20 border border-red-500/30 rounded-2xl px-3 py-2 md:px-4 md:py-2">
                                    <input
                                        type="text"
                                        value={negativePrompt}
                                        onChange={(e) => setNegativePrompt(e.target.value)}
                                        placeholder="Negative prompt (what to avoid)..."
                                        className="flex-1 bg-transparent text-red-200 placeholder:text-red-400/50 focus:outline-none text-sm min-w-0"
                                        disabled={loading}
                                    />
                                </div>
                            )}

                            {/* Generate Button */}
                            <button
                                onClick={handleGenerate}
                                disabled={loading || (selectedModel.type === 'image' && !prompt.trim())}
                                className={cn(
                                    "px-4 md:px-6 py-3 md:py-3 rounded-2xl font-bold text-sm md:text-sm flex items-center gap-2 transition-all shrink-0",
                                    loading || (selectedModel.type === 'image' && !prompt.trim())
                                        ? "bg-zinc-700 text-white/50 cursor-not-allowed"
                                        : "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 md:hover:scale-105"
                                )}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-6 h-6 md:w-5 md:h-5 animate-spin" />
                                        <span className="hidden sm:inline">Generating...</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="hidden sm:inline">Generate</span>
                                        <Wand2 className="w-6 h-6 md:w-5 md:h-5" />
                                    </>
                                )}
                            </button>
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

                {/* Video Trim Modal */}
                {showTrimModal && tempVideoPreview && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
                        onClick={handleCancelTrim}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-xl bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-white/10">
                                <div>
                                    <h3 className="text-lg font-semibold text-white">Upload your video</h3>
                                    <p className="text-sm text-white/50">Select a 30-second segment for use in generation</p>
                                </div>
                                <button
                                    onClick={handleCancelTrim}
                                    className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Video Preview */}
                            <div className="p-4">
                                <div className="w-full aspect-video rounded-xl overflow-hidden bg-black mb-4">
                                    <video
                                        ref={videoPreviewRef}
                                        src={tempVideoPreview}
                                        className="w-full h-full object-contain"
                                        onTimeUpdate={() => {
                                            if (videoPreviewRef.current) {
                                                const currentTime = videoPreviewRef.current.currentTime;
                                                if (currentTime < videoStartTime || currentTime > videoStartTime + 30) {
                                                    videoPreviewRef.current.currentTime = videoStartTime;
                                                }
                                            }
                                        }}
                                    />
                                </div>

                                {/* Timeline Controls */}
                                <div className="flex items-center gap-3 mb-4">
                                    <button
                                        onClick={() => {
                                            if (videoPreviewRef.current) {
                                                if (videoPreviewRef.current.paused) {
                                                    videoPreviewRef.current.currentTime = videoStartTime;
                                                    videoPreviewRef.current.play();
                                                } else {
                                                    videoPreviewRef.current.pause();
                                                }
                                            }
                                        }}
                                        className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex-shrink-0"
                                    >
                                        <Play className="w-5 h-5 text-white" />
                                    </button>

                                    {/* Timeline Slider */}
                                    <div className="flex-1 relative">
                                        {/* Time labels */}
                                        <div className="flex items-center justify-between text-xs text-white/50 mb-2">
                                            <span className="font-mono text-green-400">{formatTime(videoStartTime)}</span>
                                            <span className="font-mono">{formatTime(videoDuration)}</span>
                                        </div>

                                        {/* Selection slider with visual track */}
                                        <div className="relative h-12 bg-zinc-800 rounded-lg overflow-hidden">
                                            {/* Selected 30s window highlight */}
                                            <div
                                                className="absolute top-0 bottom-0 bg-gradient-to-r from-purple-500/50 to-pink-500/50 border-x-4 border-yellow-400"
                                                style={{
                                                    left: `${(videoStartTime / videoDuration) * 100}%`,
                                                    width: `${(Math.min(30, videoDuration - videoStartTime) / videoDuration) * 100}%`
                                                }}
                                            />

                                            {/* Range input */}
                                            <input
                                                type="range"
                                                min={0}
                                                max={Math.max(0, videoDuration - 30)}
                                                step={0.5}
                                                value={videoStartTime}
                                                onChange={(e) => {
                                                    const start = parseFloat(e.target.value);
                                                    setVideoStartTime(start);
                                                    setVideoEndTime(Math.min(start + 30, videoDuration));
                                                    if (videoPreviewRef.current) {
                                                        videoPreviewRef.current.currentTime = start;
                                                    }
                                                }}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="text-center text-sm text-white/60 mb-4">
                                    Selected: <span className="text-pink-400 font-bold">{formatTime(videoStartTime)}</span>
                                    <span className="mx-2">→</span>
                                    <span className="text-pink-400 font-bold">{formatTime(Math.min(videoStartTime + 30, videoDuration))}</span>
                                    <span className="ml-2 text-green-400 font-medium">(30 seconds)</span>
                                </div>
                            </div>

                            {/* Footer with buttons */}
                            <div className="flex items-center justify-between gap-3 p-4 border-t border-white/10 bg-zinc-900/50">
                                {/* Progress indicator */}
                                <div className="flex-1">
                                    {isTrimming && (
                                        <div className="flex items-center gap-2 text-sm text-yellow-400">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>{trimProgress || "Processing..."}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={handleCancelTrim}
                                        disabled={isTrimming}
                                        className="px-6 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveTrim}
                                        disabled={isTrimming}
                                        className="px-6 py-2.5 rounded-lg text-sm font-bold bg-yellow-400 text-black hover:bg-yellow-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {isTrimming ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Trimming...
                                            </>
                                        ) : (
                                            "Save & Trim"
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
