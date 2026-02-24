"use client";

import { PageHeader } from "@/app/components/dashboard/PageHeader";
import { ProfileInfoSection } from "@/app/components/dashboard/ProfileInfoSection";
import { StorageSection } from "@/app/components/dashboard/StorageSection";

export const SettingsPage = () => (
  <section className="pb-24">
    <div className="px-8 pt-8 pb-4">
      <PageHeader
        title="Settings"
        description="Manage your profile and account settings"
      />
    </div>

    <div className="px-8 mt-4 flex flex-col gap-8">
      <ProfileInfoSection />
      <StorageSection />
    </div>
  </section>
);
