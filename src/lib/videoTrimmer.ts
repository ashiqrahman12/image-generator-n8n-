"use client";

// Video trimming utility
// Note: Client-side FFmpeg.wasm has compatibility issues with Next.js/Vercel
// Using file size limits with server-side start_time/end_time instead

/**
 * Get video duration from a file
 */
export function getVideoDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
        const video = document.createElement("video");
        video.preload = "metadata";

        video.onloadedmetadata = () => {
            URL.revokeObjectURL(video.src);
            resolve(video.duration);
        };

        video.onerror = () => {
            URL.revokeObjectURL(video.src);
            reject(new Error("Failed to load video metadata"));
        };

        video.src = URL.createObjectURL(file);
    });
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * Check if video file is within acceptable limits
 * Returns error message if invalid, null if valid
 */
export function validateVideoFile(file: File, maxSizeMB: number = 10): string | null {
    const sizeMB = file.size / (1024 * 1024);

    if (sizeMB > maxSizeMB) {
        return `Video file is too large (${sizeMB.toFixed(1)}MB). Maximum allowed: ${maxSizeMB}MB. Please compress your video or use a shorter clip.`;
    }

    return null;
}
