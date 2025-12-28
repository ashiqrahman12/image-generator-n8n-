import { NextResponse } from "next/server";

// n8n Webhook URL
const N8N_WEBHOOK_URL = "https://himel15003.app.n8n.cloud/webhook/ai-image-generator";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const prompt = formData.get("prompt") as string;
        const quality = formData.get("quality") as string;
        const aspectRatio = formData.get("aspectRatio") as string;
        const outputFormat = formData.get("outputFormat") as string;
        const stylePreset = formData.get("stylePreset") as string;
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
        n8nFormData.append("stylePreset", stylePreset || "");

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
            // n8n returns binary image directly - convert to array
            const imageBlob = await response.blob();
            const imageBuffer = await imageBlob.arrayBuffer();
            const base64 = Buffer.from(imageBuffer).toString("base64");
            const mimeType = contentType.split(";")[0];

            return NextResponse.json({
                imageUrls: [`data:${mimeType};base64,${base64}`]
            });
        } else if (contentType?.includes("application/json")) {
            // n8n returns JSON
            const data = await response.json();

            // Check if it's an array of images or object with images
            let images: string[] = [];

            if (Array.isArray(data)) {
                // Handle array response [ "base64/url", "base64/url" ] or [ {url: "..."} ]
                images = data.map(item => typeof item === 'string' ? item : item.url || item.image || item.output).filter(Boolean);
            } else if (data.images && Array.isArray(data.images)) {
                // Handle { images: [...] }
                images = data.images;
            } else if (data.imageUrl || data.image || data.output) {
                // Handle single image object { imageUrl: "..." }
                images = [data.imageUrl || data.image || data.output];
            } else {
                // Try to find any property that looks like an image
                const values = Object.values(data);
                images = values.filter(val => typeof val === 'string' && (val.startsWith('http') || val.startsWith('data:image'))).map(String);
            }

            return NextResponse.json({ imageUrls: images });
        } else {
            // Fallback
            return NextResponse.json({ error: "Unknown response format from n8n" }, { status: 500 });
        }

    } catch (error) {
        console.error("Error generating image:", error);
        return NextResponse.json(
            { error: "Failed to generate image" },
            { status: 500 }
        );
    }
}
