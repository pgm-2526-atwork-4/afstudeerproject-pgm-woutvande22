"use client";

interface ProfileInfoSectionProps {
  name: string;
  email: string;
}

export const ProfileInfoSection = ({
  name,
  email,
}: ProfileInfoSectionProps) => {
  return (
    <section className="border border-gray-200 rounded-xl p-6 bg-white" aria-labelledby="profile-heading">
      <h2 id="profile-heading" className="text-xl font-bold text-gray-900 mb-5">
        Profile Information
      </h2>

      <dl className="grid gap-5 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-4">
          <dt className="text-sm font-medium text-gray-500">Name</dt>
          <dd className="mt-2 text-base font-semibold text-gray-900">
            {name || "Not available"}
          </dd>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-4">
          <dt className="text-sm font-medium text-gray-500">Email</dt>
          <dd className="mt-2 break-all text-base font-semibold text-gray-900">
            {email || "Not available"}
          </dd>
        </div>

        
      </dl>
    </section>
  );
};
