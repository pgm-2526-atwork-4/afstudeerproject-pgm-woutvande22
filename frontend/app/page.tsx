"use client";

import Link from "next/link";
import { Navbar } from "./components/landing/Navbar";
import { Hero } from "./components/landing/Hero";

const moodboards = [
  { label: "Serif Elegance", color: "bg-[#1e3a30]" },
  { label: "Gradient Burst", color: "bg-[#c5dff0]" },
  { label: "Grid System", color: "bg-[#d9a090]" },
  { label: "Brand Kit", color: "bg-[#c9a96e]" },
  { label: "Ink Botanicals", color: "bg-[#1e3a30]" },
  { label: "Desert Light", color: "bg-[#8b7355]" },
  { label: "Mono Type", color: "bg-[#4a86b5]" },
  { label: "Woven Linen", color: "bg-[#5a5a52]" },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Navbar */}
      <Navbar></Navbar>

      {/* Hero */}
      <Hero></Hero>

      {/* App mockup */}
      <section className="flex justify-center px-6 pb-20">
        <div className="w-full max-w-3xl bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
          {/* Browser traffic lights */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
            <span className="w-3 h-3 rounded-full bg-red-400" />
            <span className="w-3 h-3 rounded-full bg-yellow-400" />
            <span className="w-3 h-3 rounded-full bg-green-400" />
          </div>

          {/* Moodboard grid */}
          <div className="grid grid-cols-4 gap-4 p-6">
            {moodboards.map((board) => (
              <div key={board.label} className="flex flex-col gap-2">
                <div className={`${board.color} rounded-lg aspect-[4/3]`} />
                <span className="text-xs text-gray-600">{board.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}