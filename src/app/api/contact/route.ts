import { Resend } from 'resend';
import { NextRequest, NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
    try {
        const { fullName, email, details } = await req.json();

        // Validate input
        if (!fullName || !email || !details) {
            return NextResponse.json(
                { error: 'All fields are required' },
                { status: 400 }
            );
        }

        // Send email using Resend
        const { data, error } = await resend.emails.send({
            from: 'Antigravity AI <onboarding@resend.dev>',
            to: 'ashiq461@gmail.com',
            replyTo: email,
            subject: `New Contact Form Submission from ${fullName}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">New Contact Form Submission</h2>
                    <hr style="border: 1px solid #eee;" />
                    <p><strong>Name:</strong> ${fullName}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Message:</strong></p>
                    <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-top: 10px;">
                        ${details.replace(/\n/g, '<br />')}
                    </div>
                    <hr style="border: 1px solid #eee; margin-top: 20px;" />
                    <p style="color: #666; font-size: 12px;">This message was sent from the Antigravity AI contact form.</p>
                </div>
            `,
        });

        if (error) {
            console.error('Resend error:', error);
            return NextResponse.json(
                { error: 'Failed to send email' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true, messageId: data?.id });
    } catch (error) {
        console.error('Contact API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
