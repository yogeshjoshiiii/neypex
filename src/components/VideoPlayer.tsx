import { useEffect, useRef } from "react";
import { X } from "lucide-react";

type Props = {
  src: string;
  title: string;
  onClose?: () => void;
};

function extractDriveId(url: string) {
  const m = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

export const VideoPlayer = ({ src, onClose }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const driveId = extractDriveId(src);
  const isDrive = !!driveId;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const enterFullscreen = async () => {
      try {
        await el.requestFullscreen();
        // try lock landscape
        const orient: any = screen.orientation;
        await orient?.lock?.("landscape").catch(() => {});
      } catch {}
    };

    enterFullscreen();

    // BACK BUTTON = close / home
    const onBack = () => {
      onClose?.();
    };

    window.addEventListener("popstate", onBack);
    return () => window.removeEventListener("popstate", onBack);
  }, [onClose]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black flex items-center justify-center"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* GOOGLE DRIVE PLAYER */}
      {isDrive ? (
        <iframe
          src={`https://drive.google.com/file/d/${driveId}/preview`}
          className="w-full h-full"
          allow="autoplay; fullscreen"
          allowFullScreen
        />
      ) : (
        <video
          src={src}
          autoPlay
          controls={false}
          className="w-full h-full object-contain"
        />
      )}

      {/* ONLY ONE BUTTON (close) */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-3 right-3 bg-black/60 p-2 rounded-full text-white"
        >
          <X />
        </button>
      )}
    </div>
  );
};