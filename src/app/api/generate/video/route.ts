import { NextResponse } from "next/server";

// Wavespeed.ai API Configuration
const WAVESPEED_API_KEY = process.env.WAVESPEED_API_KEY;

// Helper function to convert File to base64 data URL
async function fileToDataUrl(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    return `data:${file.type};base64,${base64}`;
}

export async function POST(req: Request) {
    try {
        if (!WAVESPEED_API_KEY) {
            return NextResponse.json(
                { error: "Wavespeed API key not configured" },
                { status: 500 }
            );
        }

        const formData = await req.formData();
        const modelId = formData.get("modelId") as string;

        if (!modelId) {
            return NextResponse.json(
                { error: "Model ID is required" },
                { status: 400 }
            );
        }

        // Handle different video models
        if (modelId === "kling-2.6-motion-control") {
            return await handleKlingMotionControl(formData);
        }

        return NextResponse.json(
            { error: `Unknown model: ${modelId}` },
            { status: 400 }
        );

    } catch (error) {
        console.error("Error generating video:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to generate video" },
            { status: 500 }
        );
    }
}

// Kling 2.6 Motion Control Handler - Returns immediately with requestId
async function handleKlingMotionControl(formData: FormData) {
    const imageFile = formData.get("image") as File | null;
    const videoFile = formData.get("video") as File | null;
    const prompt = formData.get("prompt") as string || "";
    const negativePrompt = formData.get("negative_prompt") as string || "";
    const startTime = parseFloat(formData.get("start_time") as string || "0");
    const endTime = parseFloat(formData.get("end_time") as string || "0");
    const characterOrientation = formData.get("character_orientation") as string || "video";
    const keepOriginalSound = formData.get("keep_original_sound") === "true";

    console.log(`Video duration selection: ${startTime}s - ${endTime}s (${endTime - startTime}s total)`);

    if (!imageFile) {
        return NextResponse.json(
            { error: "Character image is required" },
            { status: 400 }
        );
    }

    if (!videoFile) {
        return NextResponse.json(
            { error: "Motion reference video is required" },
            { status: 400 }
        );
    }

    // Convert files to base64 data URLs
    const imageDataUrl = await fileToDataUrl(imageFile);
    const videoDataUrl = await fileToDataUrl(videoFile);

    const payload = {
        image: imageDataUrl,
        video: videoDataUrl,
        prompt: prompt,
        negative_prompt: negativePrompt,
        character_orientation: characterOrientation,
        keep_original_sound: keepOriginalSound
    };

    console.log("Kling Motion Control payload:", {
        imageSize: imageDataUrl.length,
        videoSize: videoDataUrl.length,
        prompt: prompt,
        negative_prompt: negativePrompt,
        character_orientation: characterOrientation,
        keep_original_sound: keepOriginalSound
    });
    console.log("Sending to Kling Motion Control API...");

    const response = await fetch(
        "https://api.wavespeed.ai/api/v3/kwaivgi/kling-v2.6-std/motion-control",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${WAVESPEED_API_KEY}`
            },
            body: JSON.stringify(payload)
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Kling API error:", response.status, errorText);
        throw new Error(`Kling API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const requestId = result.data?.id;

    if (!requestId) {
        throw new Error("No request ID returned from Kling");
    }

    console.log(`Kling video task submitted. Request ID: ${requestId}`);

    // Return immediately with requestId - client will poll for result
    return NextResponse.json({
        requestId: requestId,
        status: 'processing',
        message: 'Video generation started. Polling for result...'
    });
}
