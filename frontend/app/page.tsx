// frontend/src/app/page.tsx
"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
      <div className="text-center p-8">
        <h1 className="text-4xl font-bold text-blue-600">AI Image Tagger</h1>
        <p className="mt-4 text-gray-600 text-lg">
          Tag afbeeldingen automatisch met AI en maak moodboards.
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
          >
            Inloggen
          </Link>
          <Link
            href="/register"
            className="px-6 py-3 border border-blue-600 text-blue-600 rounded-xl hover:bg-blue-50"
          >
            Registreren
          </Link>
        </div>
      </div>
    </main>
  );
}
