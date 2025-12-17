import type { Metadata } from "next";
import { Roboto, Playfair_Display } from "next/font/google";
import "./globals.css";
import { GoogleOAuthProvider } from "@react-oauth/google";

const roboto = Roboto({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
});

const playfair = Playfair_Display({
  weight: ['700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair'
})

export const metadata: Metadata = {
  title: "AI Image Generator",
  description: "Create stunning AI art in seconds",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${roboto.variable} ${playfair.variable} antialiased bg-background text-foreground`}>
        <GoogleOAuthProvider clientId="204783801813-ak9hl515i8n91k52kcpak6meadbd9ejk.apps.googleusercontent.com">
          {children}
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
