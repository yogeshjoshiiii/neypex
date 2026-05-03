// Convert any Google Drive share link into a direct image thumbnail URL.
// Works for posters/backdrops uploaded by admins as Drive links.
export function resolveImageUrl(url?: string | null, size = 1600): string {
  if (!url) return "";
  // /file/d/FILE_ID/view  OR  ?id=FILE_ID
  const m = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (url.includes("drive.google.com") && m) {
    return `https://drive.google.com/thumbnail?id=${m[1]}&sz=w${size}`;
  }
  return url;
}
