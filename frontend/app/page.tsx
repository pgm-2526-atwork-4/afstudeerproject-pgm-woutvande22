"use client";

import { Navbar } from "./components/landing/Navbar";
import { Hero } from "./components/landing/Hero";
import { Features } from "./components/landing/Features";
import Link from "next/link";


export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">

      <Navbar></Navbar>

      <Hero></Hero>

      <Features />

      {/* CTA Section */}
      <section className="flex justify-center px-6 py-20">
        <div className="w-full max-w-2xl bg-linear-to-r from-brand-blue to-sky-700 rounded-2xl p-12 text-center text-white">
          
          <h2 className="text-4xl font-bold mb-4">
            Ready to Organize<br />Your Creative Work?
          </h2>
          
          <p className="text-white text-opacity-90 mb-8 text-lg">
            Join thousands of designers and creative professionals who organize
            their visual inspiration with Collections. Start free today.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-3 bg-white text-brand-blue font-medium rounded-lg hover:bg-gray-100 transition-colors"
            >
              Get Started Free
            </Link>
          </div>

        </div>
      </section>
    </main>
  );
}