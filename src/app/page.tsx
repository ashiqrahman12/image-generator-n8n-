import { Navbar } from "@/components/Navbar";
import { ImageGenerator } from "@/components/ImageGenerator";

export default function Home() {
  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Navbar />
      <main className="flex-1">
        <ImageGenerator />
      </main>
    </div>
  );
}
