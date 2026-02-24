"use client";

import { useState } from "react";

interface ProfileInfoSectionProps {
  initialName?: string;
  initialEmail?: string;
  memberSince?: string;
}

export const ProfileInfoSection = ({
  initialName = "John Doe",
  initialEmail = "john.doe@example.com",
  memberSince = "January 2024",
}: ProfileInfoSectionProps) => {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);

  return (
    <section className="border border-gray-200 rounded-xl p-6 bg-white" aria-labelledby="profile-heading">
      <h2 id="profile-heading" className="text-xl font-bold text-gray-900 mb-5">
        Profile Information
      </h2>

      <form className="flex flex-col gap-5" onSubmit={(e) => e.preventDefault()}>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="settings-name" className="text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            id="settings-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-shadow"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="settings-email" className="text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="settings-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition-shadow"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="settings-member-since" className="text-sm font-medium text-gray-700">
            Member Since
          </label>
          <input
            id="settings-member-since"
            type="text"
            value={memberSince}
            disabled
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-400 bg-gray-50 cursor-not-allowed"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 bg-sky-400 hover:bg-sky-500 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Save Changes
          </button>
        </div>
      </form>
    </section>
  );
};
