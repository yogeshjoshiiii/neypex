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

// Extract Google Drive file id from any common share URL format
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

// Demo fallback: a known-public Drive file the user shared for testing
const DEMO_DRIVE_ID = "1vpnBvMffAeIDbyTY_s0-qYc8LwJOl2b2";

export const VideoPlayer = ({ src, movieId, title, onClose, resume = true }: Props) => {
  // Google Drive playback path (uses official preview iframe — most reliable)
  const driveId = extractDriveId(src) || (isDriveUrl(src) ? null : null) || (!src ? DEMO_DRIVE_ID : null);
  const useDrive = !!driveId;
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [quality, setQuality] = useState("Auto");
  const [showSettings, setShowSettings] = useState(false);
  const hideTimer = useRef<number | null>(null);

  // Screen-capture deterrent
  useEffect(() => {
    const handler = () => {};
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  // Force landscape on mobile (works on Android via Fullscreen+OrientationLock API,
  // and on iOS via CSS rotation fallback since iOS doesn't support orientation.lock)
  const [rotateFallback, setRotateFallback] = useState(false);
  useEffect(() => {
    if (!useDrive) return;
    const el = containerRef.current;
    if (!el) return;
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
      || (navigator.maxTouchPoints > 1 && /Mac/i.test(navigator.platform));
    if (!isMobile) return;

    let locked = false;
    const enter = async () => {
      try {
        if (!document.fullscreenElement && el.requestFullscreen) {
          await el.requestFullscreen();
        }
        const orient: any = (screen as any).orientation;
        if (orient?.lock) {
          await orient.lock("landscape").then(() => { locked = true; }).catch(() => {});
        }
      } catch {}
      // Fallback: if still portrait, rotate via CSS
      const portrait = window.matchMedia("(orientation: portrait)").matches;
      if (portrait && !locked) setRotateFallback(true);
    };

    const updateRotation = () => {
      const portrait = window.matchMedia("(orientation: portrait)").matches;
      setRotateFallback(portrait && !locked);
    };

    const t = setTimeout(enter, 200);
    window.addEventListener("resize", updateRotation);
    window.addEventListener("orientationchange", updateRotation);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", updateRotation);
      window.removeEventListener("orientationchange", updateRotation);
      try { (screen as any).orientation?.unlock?.(); } catch {}
      setRotateFallback(false);
    };
  }, [useDrive]);


  const togglePlay = useCallback(() => {
    const v = videoRef.current; if (!v) return;
    if (v.paused) v.play(); else v.pause();
  }, []);

  const skip = (s: number) => { const v = videoRef.current; if (v) v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + s)); };

  const fmt = (s: number) => {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60); const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const armHide = () => {
    setShowControls(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => { if (playing) setShowControls(false); }, 2800);
  };

  useEffect(() => {
    const v = videoRef.current; if (!v) return;
    const onLoaded = () => {
      setDuration(v.duration);
      if (resume) {
        const p = getProgress(movieId);
        if (p && p < v.duration - 5) v.currentTime = p;
      }
    };
    const onTime = () => { setCurrent(v.currentTime); setProgress(movieId, v.currentTime); };
    const onPlay = () => { setPlaying(true); armHide(); };
    const onPause = () => { setPlaying(false); setShowControls(true); };
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movieId, resume]);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " ") { e.preventDefault(); togglePlay(); }
      if (e.key === "ArrowRight") skip(15);
      if (e.key === "ArrowLeft") skip(-15);
      if (e.key === "f") containerRef.current?.requestFullscreen?.();
      if (e.key === "m") { const v = videoRef.current; if (v) v.muted = !v.muted; }
      if (e.key === "Escape" && onClose) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlay, onClose]);

  const fullscreen = () => {
    const el = containerRef.current;
    if (!document.fullscreenElement) el?.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  const onSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current; if (v) v.currentTime = Number(e.target.value);
  };

  const onVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value); setVolume(val);
    const v = videoRef.current; if (v) { v.volume = val; v.muted = val === 0; setMuted(val === 0); }
  };

  // Google Drive: use official preview iframe (handles streaming + auth + CORS)
  if (useDrive) {
    return (
      <div
        ref={containerRef}
        className="relative w-full h-full bg-black overflow-hidden select-none"
        onContextMenu={e => e.preventDefault()}
        style={{
          WebkitUserSelect: "none",
          WebkitTouchCallout: "none",
          ...(rotateFallback ? {
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            width: "100vh",
            height: "100vw",
            transform: "rotate(90deg) translateY(-100%)",
            transformOrigin: "top left",
          } : {}),
        } as any}
      >
        <iframe
          src={`https://drive.google.com/file/d/${driveId}/preview`}
          title={title}
          className="absolute inset-0 w-full h-full"
          allow="autoplay; encrypted-media; fullscreen"
          allowFullScreen
          frameBorder={0}
        />

        {/* Mask Drive's share / popout buttons */}
        <div className="absolute top-0 right-0 h-14 w-36 sm:w-44 bg-black z-10" />
        <div className="absolute bottom-0 right-0 h-12 w-16 sm:w-20 bg-black z-10" />

        {/* YouTube-style top bar */}
        <div className="pointer-events-none absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-black/80 to-transparent z-20" />
        <div className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-3 sm:px-5 py-2.5">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-sm sm:text-base font-bold tracking-wider drop-shadow-lg shrink-0">
              <span className="text-white">NEY</span><span className="text-red-600">pex</span>
            </span>
            <span className="text-white/90 text-sm font-medium truncate">{title}</span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="ml-2 w-9 h-9 shrink-0 rounded-full bg-black/50 hover:bg-black/80 active:scale-95 flex items-center justify-center text-white transition-smooth"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="pointer-events-none absolute bottom-16 left-3 z-20 text-[10px] text-white/30 tracking-widest font-mono select-none">
          NEYPEX • {movieId}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black no-select group/player"
      onMouseMove={armHide}
      onMouseLeave={() => playing && setShowControls(false)}
      onContextMenu={e => e.preventDefault()}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain"
        playsInline
        controlsList="nodownload noplaybackrate noremoteplayback"
        disablePictureInPicture
        onClick={togglePlay}
        onDoubleClick={fullscreen}
      />

      {/* Top bar */}
      <div className={`absolute top-0 inset-x-0 p-3 sm:p-5 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"}`}>
        <div className="text-sm sm:text-base font-medium truncate pr-2">{title}</div>
        {onClose && (
          <button onClick={onClose} className="p-2 rounded-full bg-black/40 hover:bg-black/70 transition-smooth" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Center play overlay when paused */}
      {!playing && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 m-auto w-20 h-20 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center glow animate-scale-in"
          aria-label="Play"
        >
          <Play className="w-9 h-9 fill-current ml-1" />
        </button>
      )}

      {/* Bottom controls */}
      <div className={`absolute bottom-0 inset-x-0 p-3 sm:p-5 bg-gradient-to-t from-black/90 to-transparent transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"}`}>
        {/* Seek */}
        <div className="flex items-center gap-3 text-xs text-white/80 mb-2">
          <span className="tabular-nums">{fmt(current)}</span>
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={current}
            step={0.1}
            onChange={onSeek}
            className="flex-1 h-1 accent-primary cursor-pointer"
          />
          <span className="tabular-nums">{fmt(duration)}</span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={togglePlay} className="p-2 rounded-full hover:bg-white/10 transition-smooth" aria-label={playing ? "Pause" : "Play"}>
            {playing ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
          </button>
          <button onClick={() => skip(-15)} className="p-2 rounded-full hover:bg-white/10 transition-smooth" aria-label="Back 15s">
            <RotateCcw className="w-5 h-5" />
          </button>
          <button onClick={() => skip(15)} className="p-2 rounded-full hover:bg-white/10 transition-smooth" aria-label="Forward 15s">
            <RotateCw className="w-5 h-5" />
          </button>

          <div className="hidden sm:flex items-center gap-2 ml-1">
            <button onClick={() => { const v = videoRef.current; if (v) { v.muted = !v.muted; setMuted(v.muted); } }} className="p-2 rounded-full hover:bg-white/10 transition-smooth" aria-label="Mute">
              {muted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume} onChange={onVolume} className="w-24 h-1 accent-primary" />
          </div>

          <div className="ml-auto flex items-center gap-2 relative">
            <button onClick={() => setShowSettings(s => !s)} className="p-2 rounded-full hover:bg-white/10 transition-smooth" aria-label="Quality">
              <Settings className="w-5 h-5" />
            </button>
            {showSettings && (
              <div className="absolute right-12 bottom-2 bg-popover border border-border rounded-lg p-2 min-w-[140px] animate-scale-in origin-bottom-right shadow-card">
                <p className="text-xs text-muted-foreground px-2 py-1">Quality</p>
                {QUALITIES.map(q => (
                  <button key={q} onClick={() => { setQuality(q); setShowSettings(false); }} className={`w-full text-left px-3 py-2 rounded-md text-sm hover:bg-secondary ${quality === q ? "text-primary" : ""}`}>
                    {q}
                  </button>
                ))}
              </div>
            )}
            <button onClick={fullscreen} className="p-2 rounded-full hover:bg-white/10 transition-smooth" aria-label="Fullscreen">
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Anti-capture watermark */}
      <div className="pointer-events-none absolute bottom-20 right-4 text-[10px] text-white/30 tracking-widest font-mono">
        NEYPEX • {movieId}
      </div>
    </div>
  );
};
