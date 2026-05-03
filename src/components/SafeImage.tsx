import { useEffect, useRef, useState } from "react";
import { resolveImageUrl } from "@/lib/imageUrl";

// Renders an image WITHOUT exposing its URL to the user:
// - No <img src> in the DOM (uses CSS background-image on a div)
// - Right-click, drag, and selection disabled
// - Drive links auto-resolved to thumbnail URLs
type Props = {
  src?: string | null;
  alt?: string;
  className?: string;
  size?: number;
  /** When true, fetches as blob and uses object URL — fully hides original URL from DevTools network tab is impossible, but this prevents copy/share of the original link. */
  cloak?: boolean;
};

export const SafeImage = ({ src, alt = "", className = "", size = 1600, cloak = false }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const [bg, setBg] = useState<string>("");

  useEffect(() => {
    const resolved = resolveImageUrl(src, size);
    if (!resolved) { setBg(""); return; }
    let revoked: string | null = null;
    if (cloak) {
      let cancelled = false;
      fetch(resolved, { mode: "cors" })
        .then(r => r.blob())
        .then(b => {
          if (cancelled) return;
          const u = URL.createObjectURL(b);
          revoked = u;
          setBg(u);
        })
        .catch(() => setBg(resolved));
      return () => { cancelled = true; if (revoked) URL.revokeObjectURL(revoked); };
    }
    setBg(resolved);
  }, [src, size, cloak]);

  return (
    <div
      ref={ref}
      role="img"
      aria-label={alt}
      className={`bg-center bg-cover bg-no-repeat select-none ${className}`}
      style={{ backgroundImage: bg ? `url("${bg}")` : undefined }}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    />
  );
};
