const FALLBACK_TEXT_DARK = "#111827";
const FALLBACK_TEXT_LIGHT = "#FFFFFF";

const TAG_COLOR_PALETTE = [
  "#0EA5E9",
  "#22C55E",
  "#F97316",
  "#8B5CF6",
  "#EC4899",
  "#EAB308",
  "#14B8A6",
  "#F43F5E",
  "#84CC16",
  "#06B6D4",
  "#3B82F6",
  "#A855F7",
];

function normalizeHexColor(color: string): string | null {
  const value = color.trim().replace("#", "");

  if (/^[0-9a-fA-F]{3}$/.test(value)) {
    const expanded = value
      .split("")
      .map((char) => `${char}${char}`)
      .join("");
    return `#${expanded}`;
  }

  if (/^[0-9a-fA-F]{6}$/.test(value)) {
    return `#${value}`;
  }

  return null;
}

export function getDeterministicTagColor(tagName: string): string {
  const input = tagName.trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }

  const index = Math.abs(hash) % TAG_COLOR_PALETTE.length;
  return TAG_COLOR_PALETTE[index];
}

export function getReadableTextColor(
  backgroundHex: string,
  darkColor = FALLBACK_TEXT_DARK,
  lightColor = FALLBACK_TEXT_LIGHT
): string {
  const normalized = normalizeHexColor(backgroundHex);
  if (!normalized) {
    return lightColor;
  }

  const r = Number.parseInt(normalized.slice(1, 3), 16);
  const g = Number.parseInt(normalized.slice(3, 5), 16);
  const b = Number.parseInt(normalized.slice(5, 7), 16);

  // Perceived luminance formula tuned for UI readability.
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? darkColor : lightColor;
}