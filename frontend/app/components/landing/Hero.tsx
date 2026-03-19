import Link from "next/link";
import { WatchDemoModal } from "@/app/components/landing/WatchDemoModal";

export const Hero = () => (
    <header className="flex flex-col items-center text-center px-6 pt-16 pb-20">
        <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-sky-50 rounded-full border border-sky-200">
          <span className="text-xs font-medium text-brand-blue">✨ New with AI-powered collections</span>
        </div>
        
        <h1 className="text-6xl font-bold text-gray-900 leading-tight max-w-3xl">
          Organize Your Creative<br />
          <span className="bg-linear-to-r from-brand-blue to-sky-700 bg-clip-text text-transparent">
            Inspiration in One Place
          </span>
        </h1>
        
        <p className="mt-6 text-gray-600 text-lg max-w-2xl">
          A powerful image collection tool for designers, photographers, and creative
          professionals. Upload, organize, and create beautiful moodboards effortlessly.
        </p>
        
        <div className="mt-10 flex gap-4">
          <Link
            href="/register"
            className="px-8 py-3 bg-brand-blue text-white font-medium rounded-lg transition-colors"
          >
            Get Started Free →
          </Link>
          <WatchDemoModal videoSrc="/video/demo.mp4" />
        </div>

      </header>
);