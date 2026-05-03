import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, RotateCw, Settings, X } from "lucide-react";
import { getProgress, setProgress } from "@/lib/library";

type Props = {
  src: string;
  movieId: string;
  title: string;
  onClose?: () => void;
  resume?: boolean;
};

const QUALITIES = ["Auto", "1080p", "720p", "480p"];

function extractDriveId(url: string): string | null {
  if (!url) return null;
  const m1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (m1) return m1[1];
  const m2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m2) return m2[1];
  return null;
}

function isDriveUrl(url: string): boolean {
  return /drive\.google\.com/.test(url || "");
}

const DEMO_DRIVE_ID = "1vpnBvMffAeIDbyTY_s0-qYc8LwJOl2b2";

export const VideoPlayer = ({ src, movieId, title, onClose, resume = true }: Props) => {
  const driveId = extractDriveId(src) || (!src ? DEMO_DRIVE_ID : null);
  const useDrive = !!driveId;

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [quality, setQuality] = useState("Auto");
  const [showSettings, setShowSettings] = useState(false);
  const [rotateFallback, setRotateFallback] = useState(false);

  const hideTimer = useRef<number | null>(null);

  // ✅ Landscape + fullscreen (NOW WORKS FOR ALL VIDEO)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const isMobile =
      /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.maxTouchPoints > 1 && /Mac/i.test(navigator.platform));

    if (!isMobile) return;

    let locked = false;

    const enter = async () => {
      try {
        if (!document.fullscreenElement && el.requestFullscreen) {
          await el.requestFullscreen();
        }

        const orient: any = (screen as any).orientation;
        if (orient?.lock) {
          await orient.lock("landscape").then(() => {
            locked = true;
          }).catch(() => {});
        }
      } catch {}

      const portrait = window.matchMedia("(orientation: portrait)").matches;
      if (portrait && !locked) setRotateFallback(true);
    };

    const t = setTimeout(enter, 300);

    return () => {
      clearTimeout(t);
      try { (screen as any).orientation?.unlock?.(); } catch {}
    };
  }, []);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play();
    else v.pause();
  }, []);

  const skip = (s: number) => {
    const v = videoRef.current;
    if (v) v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + s));
  };

  const fmt = (s: number) => {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // ✅ Better hide timing
  const armHide = () => {
    setShowControls(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      if (playing) setShowControls(false);
    }, 4000);
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onLoaded = () => {
      setDuration(v.duration);
      if (resume) {
        const p = getProgress(movieId);
        if (p && p < v.duration - 5) v.currentTime = p;
      }
    };

    const onTime = () => {
      setCurrent(v.currentTime);
      setProgress(movieId, v.currentTime);
    };

    const onPlay = () => {
      setPlaying(true);
      armHide();
    };

    const onPause = () => {
      setPlaying(false);
      setShowControls(true);
    };

    v.addEventListener("loadedmetadata", onLoaded);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);

    return () => {
      v.removeEventListener("loadedmetadata", onLoaded);
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
    };
  }, [movieId, resume]);

  const fullscreen = () => {
    const el = containerRef.current;
    if (!document.fullscreenElement) el?.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black"
      onMouseMove={armHide}
      onClick={() => setShowControls(s => !s)} // ✅ tap toggle
      style={rotateFallback ? {
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        width: "100vh",
        height: "100vw",
        transform: "rotate(90deg) translateY(-100%)",
        transformOrigin: "top left",
      } : {}}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain"
        playsInline
        autoPlay
        muted
        onClick={togglePlay}
      />

      {/* ✅ YouTube-style center controls */}
      {showControls && (
        <div className="absolute inset-0 flex items-center justify-center gap-6">
          <button onClick={() => skip(-10)} className="p-3 rounded-full bg-black/50">
            <RotateCcw className="w-6 h-6 text-white" />
          </button>

          <button onClick={togglePlay} className="p-5 rounded-full bg-white text-black">
            {playing ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
          </button>

          <button onClick={() => skip(10)} className="p-3 rounded-full bg-black/50">
            <RotateCw className="w-6 h-6 text-white" />
          </button>
        </div>
      )}

      {/* Bottom controls */}
      <div className={`absolute bottom-0 w-full p-4 bg-black/70 ${showControls ? "block" : "hidden"}`}>
        <div className="flex items-center gap-2 text-white text-sm">
          <span>{fmt(current)}</span>
          <input type="range" min={0} max={duration || 0} value={current} onChange={(e) => {
            const v = videoRef.current;
            if (v) v.currentTime = Number(e.target.value);
          }} className="flex-1" />
          <span>{fmt(duration)}</span>
        </div>

        <div className="flex items-center justify-between mt-2">
          <button onClick={togglePlay}>
            {playing ? <Pause /> : <Play />}
          </button>

          <button onClick={fullscreen}>
            <Maximize />
          </button>
        </div>
      </div>
    </div>
  );
};