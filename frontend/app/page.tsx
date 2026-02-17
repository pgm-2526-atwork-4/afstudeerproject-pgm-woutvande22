// frontend/src/app/page.tsx
"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [message, setMessage] = useState("Laden...");

  useEffect(() => {
    // Fetch data van de FastAPI backend
    fetch("http://localhost:8000/api/status")
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch(() => setMessage("Fout: Backend niet bereikbaar"));
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="p-8 bg-white shadow-xl rounded-2xl">
        <h1 className="text-2xl font-bold text-blue-600">Frontend Status: Online</h1>
        <p className="mt-4 text-gray-700">
          Backend bericht: <span className="font-mono font-bold">{message}</span>
        </p>
      </div>
    </main>
  );
}
