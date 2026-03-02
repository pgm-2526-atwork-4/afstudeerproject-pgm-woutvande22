const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Collection {
  id: number;
  title: string;
  user_id: string;
  order_id: number;
  image_count: number;
}

export async function fetchCollections(
  accessToken: string
): Promise<Collection[]> {
  const res = await fetch(
    `${API_URL}/api/collections/?access_token=${encodeURIComponent(accessToken)}`
  );

  if (!res.ok) throw new Error("Failed to fetch collections");

  const data = await res.json();
  return data.collections;
}

export async function fetchCollection(
  accessToken: string,
  collectionId: number
): Promise<Collection> {
  const res = await fetch(
    `${API_URL}/api/collections/${collectionId}?access_token=${encodeURIComponent(accessToken)}`
  );

  if (!res.ok) throw new Error("Failed to fetch collection");

  return res.json();
}

export async function createCollection(
  accessToken: string,
  data: { title: string }
): Promise<Collection> {
  const res = await fetch(
    `${API_URL}/api/collections/?access_token=${encodeURIComponent(accessToken)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Failed to create collection");
  }

  return res.json();
}

export async function updateCollection(
  accessToken: string,
  collectionId: number,
  data: { title?: string }
): Promise<Collection> {
  const res = await fetch(
    `${API_URL}/api/collections/${collectionId}?access_token=${encodeURIComponent(accessToken)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Failed to update collection");
  }

  return res.json();
}

export async function deleteCollection(
  accessToken: string,
  collectionId: number
): Promise<void> {
  const res = await fetch(
    `${API_URL}/api/collections/${collectionId}?access_token=${encodeURIComponent(accessToken)}`,
    { method: "DELETE" }
  );

  if (!res.ok) {
    let errorMessage = "Delete failed";
    try {
      const error = await res.json();
      errorMessage = error.detail || errorMessage;
    } catch {
      // 204 responses may not have a body
    }
    throw new Error(errorMessage);
  }
}

export interface CollectionPhoto {
  id: number;
  url: string;
  user_id: string;
  file_size_mb: number;
  order_id: number;
  title?: string;
}

export async function fetchCollectionPhotos(
  accessToken: string,
  collectionId: number
): Promise<CollectionPhoto[]> {
  const res = await fetch(
    `${API_URL}/api/collections/${collectionId}/photos?access_token=${encodeURIComponent(accessToken)}`
  );

  if (!res.ok) throw new Error("Failed to fetch collection photos");

  const data = await res.json();
  return data.photos;
}

export async function removePhotoFromCollection(
  accessToken: string,
  collectionId: number,
  photoId: number
): Promise<void> {
  const res = await fetch(
    `${API_URL}/api/collections/${collectionId}/photos/${photoId}?access_token=${encodeURIComponent(accessToken)}`,
    { method: "DELETE" }
  );

  if (!res.ok) {
    let errorMessage = "Failed to remove photo from collection";
    try {
      const error = await res.json();
      errorMessage = error.detail || errorMessage;
    } catch {
      // 204 responses may not have a body
    }
    throw new Error(errorMessage);
  }
}
