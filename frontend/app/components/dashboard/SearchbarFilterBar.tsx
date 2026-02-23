"use client";

export const SearchFilterBar = () => (
  <div className="flex items-center gap-4 mt-6">
    <div className="relative flex-1">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        type="text"
        placeholder="Search images..."
        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-shadow"
      />
    </div>

    <select className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent cursor-pointer">
      <option>All tags</option>
      <option>typography</option>
      <option>branding</option>
      <option>color</option>
      <option>ui</option>
      <option>layout</option>
      <option>illustration</option>
      <option>texture</option>
      <option>photography</option>
    </select>
  </div>
);