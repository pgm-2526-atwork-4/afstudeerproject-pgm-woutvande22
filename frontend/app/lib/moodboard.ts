const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface MoodboardData {
  id: number;
  collection_id: number;
  background_color: string;
}

export interface MoodboardItemRow {
  id: number;
  moodboard_id: number;
  type: string;
  photo_id: number | null;
  text_content: string | null;
  x_pos: number;
  y_pos: number;
  width: number;
  height: number;
  z_index: number;
  scale: number;
  border_radius: number;
  locked: boolean;
  hidden: boolean;
}

export interface MoodboardResponse {
  moodboard: MoodboardData | null;
  items: MoodboardItemRow[];
}

export async function fetchMoodboard(
  accessToken: string,
  collectionId: number
): Promise<MoodboardResponse> {
  const res = await fetch(
    `${API_URL}/api/moodboards/collection/${collectionId}?access_token=${encodeURIComponent(accessToken)}`
  );

  if (!res.ok) throw new Error("Failed to fetch moodboard");

  return res.json();
}

export interface SaveMoodboardItem {
  photo_id: number | null;
  type: string;
  text_content: string | null;
  x_pos: number;
  y_pos: number;
  width: number;
  height: number;
  z_index: number;
  scale: number;
  border_radius: number;
  locked: boolean;
  hidden: boolean;
}

export async function saveMoodboard(
  accessToken: string,
  collectionId: number,
  data: { background_color: string; items: SaveMoodboardItem[] }
): Promise<void> {
  const res = await fetch(
    `${API_URL}/api/moodboards/collection/${collectionId}?access_token=${encodeURIComponent(accessToken)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }
  );

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.detail || "Failed to save moodboard");
  }
}
