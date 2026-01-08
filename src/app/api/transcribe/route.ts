import { NextResponse } from "next/server";

// Wavespeed.ai Whisper API Configuration
const WAVESPEED_API_KEY = process.env.WAVESPEED_API_KEY;
const WAVESPEED_WHISPER_URL = "https://api.wavespeed.ai/api/v3/wavespeed-ai/openai-whisper";
const WAVESPEED_RESULT_URL = "https://api.wavespeed.ai/api/v3/predictions";

// Helper function to poll for result
async function pollForResult(requestId: string, maxAttempts: number = 60): Promise<string> {
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
                // Return the transcribed text
                return data.outputs?.[0] || "";
            } else if (status === "failed") {
                throw new Error(`Whisper task failed: ${data.error || "Unknown error"}`);
            }
            console.log(`Whisper status: ${status}, attempt ${attempt + 1}/${maxAttempts}`);
        } else {
            throw new Error(`Whisper polling error: ${response.status} - ${JSON.stringify(result)}`);
        }

        // Wait 500ms before next poll
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    throw new Error("Whisper task timed out");
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
        const audioFile = formData.get("audio") as File | null;

        if (!audioFile) {
            return NextResponse.json(
                { error: "Audio file is required" },
                { status: 400 }
            );
        }

        // Convert audio file to base64 data URL
        const arrayBuffer = await audioFile.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        const audioDataUrl = `data:${audioFile.type};base64,${base64}`;

        // Build Whisper API payload
        const payload = {
            audio: audioDataUrl,
            enable_sync_mode: true,
            enable_timestamps: false,
            language: "auto",      // Auto-detect language
            prompt: "",
            task: "translate"      // Translate to English
        };

        console.log("Sending audio to Whisper API...");

        // Submit task to Wavespeed Whisper
        const response = await fetch(WAVESPEED_WHISPER_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${WAVESPEED_API_KEY}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Whisper API error:", response.status, errorText);
            throw new Error(`Whisper API error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();

        // Check if sync mode returned result directly
        if (result.data?.outputs?.[0]) {
            console.log("Whisper result (sync):", result.data.outputs[0]);
            return NextResponse.json({ text: result.data.outputs[0] });
        }

        // Otherwise poll for result
        const requestId = result.data?.id;
        if (!requestId) {
            throw new Error("No request ID returned from Whisper");
        }

        console.log(`Whisper task submitted. Request ID: ${requestId}`);

        // Poll for result
        const transcribedText = await pollForResult(requestId);

        if (!transcribedText) {
            throw new Error("No transcription returned from Whisper");
        }

        console.log("Whisper result:", transcribedText);

        return NextResponse.json({ text: transcribedText });

    } catch (error) {
        console.error("Error transcribing audio:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to transcribe audio" },
            { status: 500 }
        );
    }
}
