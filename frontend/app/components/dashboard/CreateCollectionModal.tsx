"use client";

import { useState } from "react";
import { Modal } from "@/app/components/ui/Modal";
import { FormInput } from "@/app/components/ui/FormInput";
import { Button } from "@/app/components/ui/Button";
import { createCollection, type Collection } from "@/app/lib/collections";

interface CreateCollectionModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (collection: Collection) => void;
}

export const CreateCollectionModal = ({
  open,
  onClose,
  onCreated,
}: CreateCollectionModalProps) => {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    const token = localStorage.getItem("access_token");
    if (!token) {
      setError("You must be logged in");
      return;
    }

    setLoading(true);
    try {
      const collection = await createCollection(token, {
        title: title.trim(),
      });
      onCreated(collection);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create collection");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitle("");
    setError("");
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Create Collection">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormInput
          id="collection-title"
          label="Title"
          placeholder="e.g. Brand Assets 2024"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        <Button type="submit" disabled={loading}>
          {loading ? "Creating…" : "Create Collection"}
        </Button>
      </form>
    </Modal>
  );
};
