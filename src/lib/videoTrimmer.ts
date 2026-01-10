"use client";

let ffmpeg: any = null;
let loaded = false;
let loading = false;

/**
 * Check if SharedArrayBuffer is available
 */
function isSharedArrayBufferAvailable(): boolean {
    try {
        return typeof SharedArrayBuffer !== 'undefined';
    } catch {
        return false;
    }
}

/**
 * Initialize FFmpeg.wasm - loads the WebAssembly modules from CDN
 * Uses single-threaded version to avoid SharedArrayBuffer requirement
 */
export async function initFFmpeg(
    onProgress?: (message: string) => void
): Promise<boolean> {
    if (loaded && ffmpeg) {
        return true;
    }

    if (loading) {
        // Wait for current loading to complete
        while (loading) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return loaded;
    }

    loading = true;

    try {
        onProgress?.("Loading FFmpeg...");

        // Dynamic import to avoid Next.js bundling issues
        const { FFmpeg } = await import("@ffmpeg/ffmpeg");
        const { toBlobURL } = await import("@ffmpeg/util");

        ffmpeg = new FFmpeg();

        // Set up logging
        ffmpeg.on("log", ({ message }: { message: string }) => {
            console.log("[FFmpeg]", message);
        });

        ffmpeg.on("progress", ({ progress }: { progress: number }) => {
            const percent = Math.round(progress * 100);
            onProgress?.(`Trimming: ${percent}%`);
        });

        onProgress?.("Downloading FFmpeg (first time only)...");

        // Use single-threaded core to avoid SharedArrayBuffer requirement
        // This works without COOP/COEP headers
        const coreBaseURL = "https://unpkg.com/@ffmpeg/core-st@0.12.6/dist/umd";

        await ffmpeg.load({
            coreURL: await toBlobURL(`${coreBaseURL}/ffmpeg-core.js`, "text/javascript"),
            wasmURL: await toBlobURL(`${coreBaseURL}/ffmpeg-core.wasm`, "application/wasm"),
        });

        loaded = true;
        loading = false;
        onProgress?.("FFmpeg ready!");
        return true;
    } catch (error) {
        console.error("Failed to load FFmpeg:", error);
        onProgress?.(`FFmpeg load failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        loading = false;
        return false;
    }
}

/**
 * Check if FFmpeg is loaded
 */
export function isFFmpegLoaded(): boolean {
    return loaded && ffmpeg !== null;
}

/**
 * Trim a video file to a specified duration
 * @param videoFile - The input video file
 * @param startTime - Start time in seconds
 * @param duration - Duration in seconds (default 30)
 * @param onProgress - Progress callback
 * @returns Trimmed video as a File object
 */
export async function trimVideo(
    videoFile: File,
    startTime: number,
    duration: number = 30,
    onProgress?: (message: string) => void
): Promise<File | null> {
    try {
        // Ensure FFmpeg is loaded
        if (!ffmpeg || !loaded) {
            const success = await initFFmpeg(onProgress);
            if (!success || !ffmpeg) {
                throw new Error("Failed to initialize FFmpeg");
            }
        }

        onProgress?.("Reading video...");

        // Dynamic import fetchFile
        const { fetchFile } = await import("@ffmpeg/util");

        // Use mp4 for output for maximum compatibility
        const inputFileName = `input_${Date.now()}.mp4`;
        const outputFileName = `output_${Date.now()}.mp4`;

        // Write input file to FFmpeg virtual file system
        const fileData = await fetchFile(videoFile);
        await ffmpeg.writeFile(inputFileName, fileData);

        onProgress?.("Trimming video...");

        // Run FFmpeg trim command
        // -ss: start time (before -i for fast seeking)
        // -t: duration
        // -c copy: copy codec (fast, no re-encoding)
        await ffmpeg.exec([
            "-ss", startTime.toFixed(2),
            "-i", inputFileName,
            "-t", duration.toFixed(2),
            "-c", "copy",
            "-avoid_negative_ts", "make_zero",
            "-movflags", "+faststart",
            outputFileName
        ]);

        onProgress?.("Saving trimmed video...");

        // Read the output file
        const data = await ffmpeg.readFile(outputFileName);

        // Clean up files from virtual file system
        try {
            await ffmpeg.deleteFile(inputFileName);
            await ffmpeg.deleteFile(outputFileName);
        } catch (e) {
            console.warn("Cleanup warning:", e);
        }

        // Create new File from the output
        let blobData: Uint8Array;
        if (data instanceof Uint8Array) {
            blobData = data;
        } else if (typeof data === 'string') {
            blobData = new TextEncoder().encode(data);
        } else {
            blobData = new Uint8Array(data as ArrayBuffer);
        }

        const trimmedBlob = new Blob([blobData], { type: 'video/mp4' });
        const trimmedFile = new File([trimmedBlob], `trimmed_video.mp4`, {
            type: 'video/mp4',
            lastModified: Date.now()
        });

        const originalSizeMB = (videoFile.size / (1024 * 1024)).toFixed(1);
        const trimmedSizeMB = (trimmedFile.size / (1024 * 1024)).toFixed(1);
        onProgress?.(`Done! ${originalSizeMB}MB → ${trimmedSizeMB}MB`);

        console.log(`[VideoTrimmer] Trimmed: ${originalSizeMB}MB → ${trimmedSizeMB}MB`);

        return trimmedFile;
    } catch (error) {
        console.error("Failed to trim video:", error);
        onProgress?.(`Trim error: ${error instanceof Error ? error.message : "Unknown error"}`);
        return null;
    }
}

/**
 * Get video duration
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
