import { NextResponse } from "next/server";

// Wavespeed.ai API Configuration
const WAVESPEED_API_KEY = process.env.WAVESPEED_API_KEY;
const WAVESPEED_API_URL = "https://api.wavespeed.ai/api/v3/alibaba/wan-2.6/image-edit";
const WAVESPEED_RESULT_URL = "https://api.wavespeed.ai/api/v3/predictions";

// Helper function to convert File to base64 data URL
async function fileToDataUrl(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    return `data:${file.type};base64,${base64}`;
}

// Helper function to poll for result
async function pollForResult(requestId: string, maxAttempts: number = 60): Promise<string[]> {
    const headers = {
        "Authorization": `Bearer ${WAVESPEED_API_KEY}`
    };

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const response = await fetch(`${WAVESPEED_RESULT_URL}/${requestId}/result`, { headers });
        const result = await response.json();

        if (response.ok) {
            const data = result.data;
            const status = data.status;

            if (status === "completed") {
                // Return array of output URLs
                return data.outputs || [];
            } else if (status === "failed") {
                throw new Error(`Wavespeed task failed: ${data.error || "Unknown error"}`);
            }
            // Still processing, continue polling
            console.log(`Wavespeed status: ${status}, attempt ${attempt + 1}/${maxAttempts}`);
        } else {
            throw new Error(`Wavespeed polling error: ${response.status} - ${JSON.stringify(result)}`);
        }

        // Wait 1 second before next poll
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    throw new Error("Wavespeed task timed out");
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
        const prompt = formData.get("prompt") as string;
        const stylePreset = formData.get("stylePreset") as string;
        const referenceImageCount = parseInt(formData.get("referenceImageCount") as string || "0");

        if (!prompt) {
            return NextResponse.json(
                { error: "Prompt is required" },
                { status: 400 }
            );
        }

        // Build full prompt with style preset
        let fullPrompt = prompt;
        if (stylePreset) {
            fullPrompt = `${prompt}, ${stylePreset} style`;
        }

        // Get reference images (convert to URLs or base64)
        const images: string[] = [];
        for (let i = 0; i < referenceImageCount; i++) {
            const file = formData.get(`referenceImage_${i}`) as File | null;
            if (file) {
                // Convert file to base64 data URL for Wavespeed API
                const dataUrl = await fileToDataUrl(file);
                images.push(dataUrl);
            }
        }

        // If no reference images, use a default placeholder or return error
        if (images.length === 0) {
            return NextResponse.json(
                { error: "At least one reference image is required for image editing" },
                { status: 400 }
            );
        }

        // Build Wavespeed API payload
        const payload = {
            enable_prompt_expansion: false,
            images: images,
            prompt: fullPrompt,
            seed: -1
        };

        console.log("Sending to Wavespeed:", { prompt: fullPrompt, imagesCount: images.length });

        // Submit task to Wavespeed
        const response = await fetch(WAVESPEED_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${WAVESPEED_API_KEY}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Wavespeed API error:", response.status, errorText);
            throw new Error(`Wavespeed API error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        const requestId = result.data?.id;

        if (!requestId) {
            throw new Error("No request ID returned from Wavespeed");
        }

        console.log(`Wavespeed task submitted. Request ID: ${requestId}`);

        // Poll for result
        const outputUrls = await pollForResult(requestId);

        if (outputUrls.length === 0) {
            throw new Error("No output images returned from Wavespeed");
        }

        console.log(`Wavespeed completed. Output URLs:`, outputUrls);

        return NextResponse.json({ imageUrls: outputUrls });

    } catch (error) {
        console.error("Error generating image:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to generate image" },
            { status: 500 }
        );
    }
}
