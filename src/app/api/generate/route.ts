import { NextResponse } from "next/server";

// n8n Webhook URL
const N8N_WEBHOOK_URL = "https://himel15003.app.n8n.cloud/webhook-test/ai-image-generator";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const prompt = formData.get("prompt") as string;
        const quality = formData.get("quality") as string;
        const aspectRatio = formData.get("aspectRatio") as string;
        const outputFormat = formData.get("outputFormat") as string;
        const referenceImageCount = parseInt(formData.get("referenceImageCount") as string || "0");

        if (!prompt) {
            return NextResponse.json(
                { error: "Prompt is required" },
                { status: 400 }
            );
        }

        // Build FormData to send to n8n with binary file support
        const n8nFormData = new FormData();
        n8nFormData.append("prompt", prompt);
        n8nFormData.append("quality", quality || "2k");
        n8nFormData.append("aspectRatio", aspectRatio || "1:1");
        n8nFormData.append("outputFormat", outputFormat || "png");

        // Append all reference images as binary files
        for (let i = 0; i < referenceImageCount; i++) {
            const file = formData.get(`referenceImage_${i}`) as File | null;
            if (file) {
                // Append each file with its original name
                n8nFormData.append(`referenceImage_${i}`, file, file.name);
            }
        }
        n8nFormData.append("referenceImageCount", String(referenceImageCount));

        // Send to n8n webhook
        const response = await fetch(N8N_WEBHOOK_URL, {
            method: "POST",
            body: n8nFormData, // FormData automatically sets multipart/form-data with boundary
        });

        if (!response.ok) {
            throw new Error(`n8n webhook error: ${response.statusText}`);
        }

        // Check content type to handle binary image response
        const contentType = response.headers.get("content-type");

        if (contentType?.includes("image/")) {
            // n8n returns binary image directly
            const imageBlob = await response.blob();
            const imageBuffer = await imageBlob.arrayBuffer();
            const base64 = Buffer.from(imageBuffer).toString("base64");
            const mimeType = contentType.split(";")[0];

            return NextResponse.json({
                imageUrl: `data:${mimeType};base64,${base64}`
            });
        } else {
            // n8n returns JSON with imageUrl
            const data = await response.json();
            return NextResponse.json(data);
        }

    } catch (error) {
        console.error("Error generating image:", error);
        return NextResponse.json(
            { error: "Failed to generate image" },
            { status: 500 }
        );
    }
}
