function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function galleryImageIndex(filenameOrPath: string, articleSlug: string, type: string): number | null {
  const filename = filenameOrPath.split("/").pop() || filenameOrPath;
  const re = new RegExp(`^${escapeRegExp(articleSlug)}-${escapeRegExp(type)}-(\\d+)\\.jpg$`, "i");
  const match = filename.match(re);
  if (!match) return null;
  const index = Number.parseInt(match[1], 10);
  return Number.isFinite(index) ? index : null;
}

export function nextGalleryImageIndex(existingNames: string[], articleSlug: string, type: string): number {
  const maxIndex = existingNames.reduce((max, name) => {
    const index = galleryImageIndex(name, articleSlug, type);
    return index === null ? max : Math.max(max, index);
  }, 0);
  return maxIndex + 1;
}

export function isStorageCollisionError(error: unknown): boolean {
  const value = error as { message?: string; statusCode?: string | number; error?: string } | null;
  const text = `${value?.message || ""} ${value?.error || ""}`.toLowerCase();
  return value?.statusCode === 409 || value?.statusCode === "409" || /already exists|duplicate|conflict/.test(text);
}