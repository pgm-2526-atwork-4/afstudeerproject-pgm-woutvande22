"use client";

import { useEffect } from "react";
import { PageHeader } from "@/app/components/dashboard/layout/PageHeader";
import { useAuth } from "@/app/context/AuthContext";
import { ProfileInfoSection } from "@/app/components/dashboard/settings/ProfileInfoSection";
import { StorageSection } from "@/app/components/dashboard/settings/StorageSection";

const formatMemberSince = (createdAt?: string) => {
  if (!createdAt) {
    return "Not available";
  }

  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
};

export const SettingsPage = () => {
  const { user, refreshUser } = useAuth();

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  return (
    <section className="pb-24">
      <div className="px-8 pt-8 pb-4">
        <PageHeader
          title="Settings"
          description="Manage your profile and account settings"
        />
      </div>

      <div className="px-8 mt-4 flex flex-col gap-8">
        <ProfileInfoSection
          name={user?.name ?? ""}
          email={user?.email ?? ""}
        />
        <StorageSection
          usedMb={user?.current_storage_mb ?? 0}
          totalMb={user?.storage_limit_mb ?? 10240}
        />
      </div>
    </section>
  );
};
