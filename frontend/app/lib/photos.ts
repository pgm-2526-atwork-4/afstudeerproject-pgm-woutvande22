const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Photo {
  id: number;
  url: string;
  user_id: string;
  file_size_mb: number;
  order_id: number;
  title?: string;
}

export async function uploadPhoto(
  accessToken: string,
  file: File,
  collectionId?: number,
  title?: string
): Promise<Photo> {
  const formData = new FormData();
  formData.append("file", file);

  const params = new URLSearchParams({ access_token: accessToken });
  if (collectionId) params.append("collection_id", String(collectionId));
  if (title) params.append("title", title);

  const res = await fetch(`${API_URL}/api/photos/upload?${params}`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Upload failed");
  }

  return res.json();
}

export async function fetchPhotos(accessToken: string): Promise<Photo[]> {
  const res = await fetch(
    `${API_URL}/api/photos/?access_token=${encodeURIComponent(accessToken)}`
  );

  if (!res.ok) throw new Error("Failed to fetch photos");

  const data = await res.json();
  return data.photos;
}

export async function deletePhoto(
  accessToken: string,
  photoId: number
): Promise<void> {
  const res = await fetch(
    `${API_URL}/api/photos/${photoId}?access_token=${encodeURIComponent(accessToken)}`,
    { method: "DELETE" }
  );

  if (!res.ok) {
    let errorMessage = "Delete failed";
    try {
      const error = await res.json();
      errorMessage = error.detail || errorMessage;
    } catch {
      // Response may not have a body (e.g., for 204 or 5xx errors)
    }
    throw new Error(errorMessage);
  }
}

export async function reorderPhotos(
  accessToken: string,
  photos: { id: number; order_id: number }[]
): Promise<void> {
  const res = await fetch(
    `${API_URL}/api/photos/reorder?access_token=${encodeURIComponent(accessToken)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photos }),
    }
  );

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Reorder failed");
  }
}

export async function updatePhoto(
  accessToken: string,
  photoId: number,
  data: { title?: string }
): Promise<Photo> {
  const res = await fetch(
    `${API_URL}/api/photos/${photoId}?access_token=${encodeURIComponent(accessToken)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Update failed");
  }

  return res.json();
}