/**
 * Lightweight custom-event helpers so components can signal data changes
 * without needing a global store.  Any component can call
 * `dispatchCollectionsChanged()` and any listener (e.g. the Sidebar)
 * will re-fetch automatically.
 */

export const COLLECTIONS_CHANGED = "collections-changed";

export function dispatchCollectionsChanged() {
  window.dispatchEvent(new Event(COLLECTIONS_CHANGED));
}
