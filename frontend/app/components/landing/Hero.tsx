import Link from "next/link";

export const Hero = () => (
    <header className="flex flex-col items-center text-center px-6 pt-20 pb-12">
        <h1 className="text-5xl font-bold text-gray-900 leading-tight max-w-2xl">
          Organize Your Creative<br />Inspiration in One Place
        </h1>
        <p className="mt-5 text-gray-500 text-base max-w-md">
          A powerful image collection tool for designers, photographers, and creative
          professionals. Upload, organize, and create beautiful moodboards effortlessly.
        </p>
        <Link
          href="/register"
          className="mt-8 px-6 py-3 bg-sky-400 hover:bg-sky-500 text-white text-sm font-medium rounded-full transition-colors"
        >
          Get Started Free →
        </Link>
      </header>
);