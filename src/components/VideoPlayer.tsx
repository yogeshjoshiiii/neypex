import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

type Props = {
  src: string;
  title: string;
  onClose?: () => void;
};

function extractDriveId(url: string) {
  if (!url) return null;

  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];

  const match2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match2) return match2[1];

  return null;
}

export const VideoPlayer = ({ src, title, onClose }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const driveId = extractDriveId(src);

  const [rotate, setRotate] = useState(false);

  // AUTO LANDSCAPE + FULLSCREEN
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);

    const enter = async () => {
      try {
        if (el.requestFullscreen) {
          await el.requestFullscreen();
        }

        const orientation: any = (screen as any).orientation;
        if (orientation?.lock) {
          await orientation.lock("landscape").catch(() => {});
        }
      } catch {}

      const isPortrait = window.innerHeight > window.innerWidth;
      setRotate(isMobile && isPortrait);
    };

    enter();

    const update = () => {
      const isPortrait = window.innerHeight > window.innerWidth;
      setRotate(isPortrait);
    };

    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black overflow-hidden select-none"
      onContextMenu={(e) => e.preventDefault()}
      style={
        rotate
          ? {
              transform: "rotate(90deg)",
              transformOrigin: "center",
              width: "100vh",
              height: "100vw",
            }
          : {}
      }
    >
      {/* DRIVE PLAYER */}
      {driveId && (
        <iframe
          src={`https://drive.google.com/file/d/${driveId}/preview`}
          className="absolute inset-0 w-full h-full"
          allow="autoplay; fullscreen"
          allowFullScreen
          frameBorder="0"
          sandbox="allow-scripts allow-same-origin allow-presentation"
        />
      )}

      {/* BLOCK UI OVERLAY (hide Drive UI + share buttons) */}
      <div className="absolute top-0 left-0 w-full h-14 bg-black z-10" />
      <div className="absolute bottom-0 right-0 w-40 h-14 bg-black z-10" />

      {/* DISABLE CLICK LEAKS */}
      <div className="absolute inset-0 z-[5]" />

      {/* CLOSE BUTTON */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 bg-black/70 p-2 rounded-full text-white"
        >
          <X />
        </button>
      )}
    </div>
  );
};