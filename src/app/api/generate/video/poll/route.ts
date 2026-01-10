import { NextResponse } from "next/server";

// Wavespeed.ai API Configuration
const WAVESPEED_API_KEY = process.env.WAVESPEED_API_KEY;
const WAVESPEED_RESULT_URL = "https://api.wavespeed.ai/api/v3/predictions";

export async function GET(req: Request) {
    try {
        if (!WAVESPEED_API_KEY) {
            return NextResponse.json(
                { error: "Wavespeed API key not configured" },
                { status: 500 }
            );
        }

        const { searchParams } = new URL(req.url);
        const requestId = searchParams.get("requestId");

        if (!requestId) {
            return NextResponse.json(
                { error: "Request ID is required" },
                { status: 400 }
            );
        }

        // Fetch status from Wavespeed
        const response = await fetch(`${WAVESPEED_RESULT_URL}/${requestId}/result`, {
            headers: {
                "Authorization": `Bearer ${WAVESPEED_API_KEY}`
            }
        });

        const result = await response.json();

        if (!response.ok) {
            console.error("Poll error:", response.status, result);
            return NextResponse.json(
                { error: `Poll error: ${response.status}`, status: 'error' },
                { status: response.status }
            );
        }

        const data = result.data;
        const status = data.status;

        if (status === "completed") {
            console.log("Video completed:", data.outputs);
            return NextResponse.json({
                status: 'completed',
                videoUrls: data.outputs || []
            });
        } else if (status === "failed") {
            console.error("Video failed:", data.error);
            return NextResponse.json({
                status: 'failed',
                error: data.error || 'Video generation failed'
            });
        } else {
            // Still processing
            return NextResponse.json({
                status: 'processing',
                message: `Status: ${status}`
            });
        }

    } catch (error) {
        console.error("Error polling video status:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to poll status", status: 'error' },
            { status: 500 }
        );
    }
}
