const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Tag {
  id: number;
  name: string;
  color_hex: string;
}

export async function fetchBatchPhotoTags(
  accessToken: string,
  photoIds: number[]
): Promise<Record<string, Tag[]>> {
  if (photoIds.length === 0) return {};

  const params = new URLSearchParams({
    access_token: accessToken,
    photo_ids: photoIds.join(","),
  });

  const res = await fetch(`${API_URL}/api/tags/photos/batch?${params}`);
  if (!res.ok) throw new Error("Failed to fetch batch photo tags");

  const data = await res.json();
  return data.photo_tags;
}

export async function fetchTags(accessToken: string): Promise<Tag[]> {
  const res = await fetch(
    `${API_URL}/api/tags/?access_token=${encodeURIComponent(accessToken)}`
  );

  if (!res.ok) throw new Error("Failed to fetch tags");

  const data = await res.json();
  return data.tags;
}

export async function createTag(
  accessToken: string,
  name: string,
  colorHex: string
): Promise<Tag> {
  const url = `${API_URL}/api/tags/?access_token=${encodeURIComponent(accessToken)}`;
  console.log("createTag URL:", url);
  
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, color_hex: colorHex }),
    mode: "cors",
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Failed to create tag");
  }

  return res.json();
}

export async function updateTag(
  accessToken: string,
  tagId: number,
  data: { name?: string; color_hex?: string }
): Promise<Tag> {
  const res = await fetch(
    `${API_URL}/api/tags/${tagId}?access_token=${encodeURIComponent(accessToken)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Failed to update tag");
  }

  return res.json();
}

export async function deleteTag(
  accessToken: string,
  tagId: number
): Promise<void> {
  const res = await fetch(
    `${API_URL}/api/tags/${tagId}?access_token=${encodeURIComponent(accessToken)}`,
    { method: "DELETE" }
  );

  if (!res.ok) {
    let errorMessage = "Failed to delete tag";
    try {
      const error = await res.json();
      errorMessage = error.detail || errorMessage;
    } catch {
      // Response may not have a body
    }
    throw new Error(errorMessage);
  }
}

export async function getPhotoTags(
  accessToken: string,
  photoId: number
): Promise<Tag[]> {
  const res = await fetch(
    `${API_URL}/api/tags/photo/${photoId}?access_token=${encodeURIComponent(accessToken)}`
  );

  if (!res.ok) throw new Error("Failed to fetch photo tags");

  const data = await res.json();
  return data.tags;
}

export async function addTagToPhoto(
  accessToken: string,
  photoId: number,
  tagId: number
): Promise<void> {
  const res = await fetch(
    `${API_URL}/api/tags/photo/${photoId}/tag/${tagId}?access_token=${encodeURIComponent(accessToken)}`,
    { method: "POST" }
  );

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Failed to add tag to photo");
  }
}

export async function removeTagFromPhoto(
  accessToken: string,
  photoId: number,
  tagId: number
): Promise<void> {
  const res = await fetch(
    `${API_URL}/api/tags/photo/${photoId}/tag/${tagId}?access_token=${encodeURIComponent(accessToken)}`,
    { method: "DELETE" }
  );

  if (!res.ok) {
    let errorMessage = "Failed to remove tag from photo";
    try {
      const error = await res.json();
      errorMessage = error.detail || errorMessage;
    } catch {
      // Response may not have a body
    }
    throw new Error(errorMessage);
  }
}
