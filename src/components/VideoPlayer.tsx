import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, Maximize, Minimize, RotateCcw, RotateCw, Settings, X } from "lucide-react";
import { getProgress, setProgress } from "@/lib/library";

type Props = {
  src: string;
  movieId: string;
  title: string;
  onClose?: () => void;
  resume?: boolean;
};

const QUALITIES = ["Auto", "1080p", "720p", "480p"];

export const VideoPlayer = ({ src, movieId, title, onClose, resume = true }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [quality, setQuality] = useState("Auto");
  const [isFullscreen, setIsFullscreen] = useState(false);

  const hideTimer = useRef<number | null>(null);

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

  const armHide = () => {
    setShowControls(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      if (playing) setShowControls(false);
    }, 4000);
  };

  // ✅ FULLSCREEN TOGGLE (REAL)
  const toggleFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;

    if (!document.fullscreenElement) {
      await el.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // ✅ Track fullscreen state
  useEffect(() => {
    const handler = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // ✅ AUTO LANDSCAPE + FULLSCREEN (MOBILE)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const isMobile =
      /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) ||
      navigator.maxTouchPoints > 1;

    if (!isMobile) return;

    const enter = async () => {
      try {
        if (!document.fullscreenElement) {
          await el.requestFullscreen();
        }

        const orient: any = screen.orientation;
        if (orient?.lock) {
          await orient.lock("landscape").catch(() => {});
        }
      } catch {}
    };

    const t = setTimeout(enter, 500);
    return () => clearTimeout(t);
  }, []);

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

  const onSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (v) v.currentTime = Number(e.target.value);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black"
      onMouseMove={armHide}
      onClick={() => setShowControls(s => !s)}
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

      {/* Top Bar */}
      <div className={`absolute top-0 w-full p-4 flex justify-between bg-gradient-to-b from-black/80 ${showControls ? "opacity-100" : "opacity-0"}`}>
        <span className="text-white">{title}</span>
        {onClose && (
          <button onClick={onClose}>
            <X className="text-white" />
          </button>
        )}
      </div>

      {/* Center Controls */}
      {showControls && (
        <div className="absolute inset-0 flex items-center justify-center gap-10">
          <button onClick={() => skip(-10)} className="bg-black/50 p-4 rounded-full">
            <RotateCcw className="w-7 h-7 text-white" />
          </button>

          <button onClick={togglePlay} className="bg-white p-6 rounded-full">
            {playing ? <Pause className="w-10 h-10 text-black" /> : <Play className="w-10 h-10 text-black ml-1" />}
          </button>

          <button onClick={() => skip(10)} className="bg-black/50 p-4 rounded-full">
            <RotateCw className="w-7 h-7 text-white" />
          </button>
        </div>
      )}

      {/* Bottom Controls */}
      <div className={`absolute bottom-0 w-full p-4 bg-black/70 ${showControls ? "block" : "hidden"}`}>
        <div className="flex items-center gap-2 text-white text-sm">
          <span>{fmt(current)}</span>

          <input
            type="range"
            min={0}
            max={duration || 0}
            value={current}
            step={0.1}
            onChange={onSeek}
            className="flex-1 h-1"
            style={{
              background: `linear-gradient(to right, red ${(current / duration) * 100}%, rgba(255,255,255,0.3) ${(current / duration) * 100}%)`
            }}
          />

          <span>{fmt(duration)}</span>
        </div>

        <div className="flex items-center justify-between mt-2">
          <button onClick={togglePlay}>
            {playing ? <Pause /> : <Play />}
          </button>

          {/* Settings */}
          <div className="relative">
            <button onClick={() => setShowSettings(s => !s)}>
              <Settings className="text-white" />
            </button>

            {showSettings && (
              <div className="absolute bottom-10 right-0 bg-black p-2 rounded">
                {QUALITIES.map(q => (
                  <button key={q} onClick={() => setQuality(q)} className="block text-white">
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* FULLSCREEN BUTTON */}
          <button onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize /> : <Maximize />}
          </button>
        </div>
      </div>
    </div>
  );
};