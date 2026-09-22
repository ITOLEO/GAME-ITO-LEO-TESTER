/**
 * Aetheria: Resonant Horizon - Photography & Capture Studio
 */

import React, { useState } from "react";
import { Camera, Eye, EyeOff, Download, Sparkles, Sliders, X, Check } from "lucide-react";
import { EmoteType } from "../types/game";

interface PhotoModeModalProps {
  onClose: () => void;
  onSetCameraParams: (fov: number, distance: number, heightOffset: number, yawDelta: number) => void;
  onTriggerPose: (pose: EmoteType) => void;
  onCapture: () => string;
}

export const PhotoModeModal: React.FC<PhotoModeModalProps> = ({
  onClose,
  onSetCameraParams,
  onTriggerPose,
  onCapture,
}) => {
  const [fov, setFov] = useState(58);
  const [distance, setDistance] = useState(5.5);
  const [height, setHeight] = useState(1.8);
  const [yaw, setYaw] = useState(0);
  const [activeFilter, setActiveFilter] = useState<"none" | "vibrant" | "noir" | "sunset" | "cyber" | "sepia">("none");
  const [hideUI, setHideUI] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const filters = [
    { id: "none", name: "Natural", class: "" },
    { id: "vibrant", name: "Vibrant Anime", class: "saturate-150 contrast-110" },
    { id: "sunset", name: "Golden Hour", class: "sepia-[0.35] hue-rotate-[-15deg] saturate-125" },
    { id: "cyber", name: "Astral Glow", class: "hue-rotate-[160deg] contrast-125" },
    { id: "noir", name: "Twilight Noir", class: "grayscale contrast-125" },
    { id: "sepia", name: "Ancient Chrono", class: "sepia contrast-95 brightness-95" },
  ] as const;

  const poses: { id: EmoteType; label: string }[] = [
    { id: "wave", label: "Cheerful Wave" },
    { id: "victory", label: "Heroic Victory" },
    { id: "dance", label: "Resonant Dance" },
    { id: "sit", label: "Resting Stance" },
    { id: "bow", label: "Respectful Bow" },
    { id: "laugh", label: "Joyful Chuckle" },
  ];

  const handleSliderChange = (
    newFov: number,
    newDist: number,
    newHeight: number,
    newYaw: number
  ) => {
    setFov(newFov);
    setDistance(newDist);
    setHeight(newHeight);
    setYaw(newYaw);
    onSetCameraParams(newFov, newDist, newHeight, (newYaw * Math.PI) / 180);
  };

  const handleTakeSnapshot = () => {
    const dataUrl = onCapture();
    setCapturedImage(dataUrl);
  };

  return (
    <>
      {/* Visual Filter Overlay on Canvas */}
      <div
        className={`fixed inset-0 pointer-events-none z-30 transition-all duration-300 ${
          filters.find((f) => f.id === activeFilter)?.class || ""
        }`}
      />

      {/* When Hide UI is active, show only a tiny restore hint */}
      {hideUI ? (
        <button
          onClick={() => setHideUI(false)}
          className="fixed bottom-6 right-6 z-50 px-4 py-2 bg-neutral-950/80 hover:bg-neutral-900 border border-cyan-500/40 rounded-full text-xs font-semibold text-cyan-300 shadow-xl backdrop-blur-md flex items-center gap-2 pointer-events-auto transition-all"
        >
          <Eye className="w-4 h-4" />
          <span>Show Photo Controls</span>
        </button>
      ) : (
        <div className="fixed inset-0 z-40 pointer-events-none flex flex-col justify-between p-6">
          {/* Top Bar */}
          <div className="flex items-center justify-between pointer-events-auto">
            <div className="bg-neutral-950/85 backdrop-blur-md border border-cyan-500/30 rounded-2xl px-5 py-3 shadow-2xl flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-neutral-100 uppercase tracking-wider">Aetheria Photo Studio</h2>
                <p className="text-[11px] text-neutral-400">Capture pristine scenic vistas and heroic moments</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setHideUI(true)}
                className="px-4 py-2.5 bg-neutral-950/80 hover:bg-neutral-900 border border-neutral-700/60 rounded-xl text-xs font-medium text-neutral-200 backdrop-blur-md flex items-center gap-2 transition-all"
              >
                <EyeOff className="w-4 h-4 text-cyan-400" />
                <span>Hide UI</span>
              </button>
              <button
                onClick={onClose}
                className="p-2.5 bg-neutral-950/80 hover:bg-neutral-900 border border-neutral-700/60 rounded-xl text-neutral-300 hover:text-white backdrop-blur-md transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Bottom Floating Control Panel */}
          <div className="w-full max-w-4xl mx-auto bg-neutral-950/90 backdrop-blur-xl border border-cyan-500/40 rounded-3xl p-5 shadow-[0_0_50px_rgba(6,182,212,0.15)] pointer-events-auto flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 1. Camera Framing Sliders */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-300 uppercase tracking-wider border-b border-neutral-800/80 pb-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Optics & Framing</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-neutral-400">
                    <span>Field of View</span>
                    <span className="text-cyan-400 font-mono">{fov}°</span>
                  </div>
                  <input
                    type="range"
                    min="35"
                    max="85"
                    value={fov}
                    onChange={(e) => handleSliderChange(Number(e.target.value), distance, height, yaw)}
                    className="w-full accent-cyan-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                  />

                  <div className="flex justify-between text-neutral-400 pt-1">
                    <span>Focal Distance</span>
                    <span className="text-cyan-400 font-mono">{distance.toFixed(1)}m</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="11"
                    step="0.2"
                    value={distance}
                    onChange={(e) => handleSliderChange(fov, Number(e.target.value), height, yaw)}
                    className="w-full accent-cyan-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                  />

                  <div className="flex justify-between text-neutral-400 pt-1">
                    <span>Elevation</span>
                    <span className="text-cyan-400 font-mono">{height.toFixed(1)}m</span>
                  </div>
                  <input
                    type="range"
                    min="0.6"
                    max="3.5"
                    step="0.1"
                    value={height}
                    onChange={(e) => handleSliderChange(fov, distance, Number(e.target.value), yaw)}
                    className="w-full accent-cyan-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                  />

                  <div className="flex justify-between text-neutral-400 pt-1">
                    <span>Orbit Angle</span>
                    <span className="text-cyan-400 font-mono">{yaw}°</span>
                  </div>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    value={yaw}
                    onChange={(e) => handleSliderChange(fov, distance, height, Number(e.target.value))}
                    className="w-full accent-cyan-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* 2. Visual Filters */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-cyan-300 uppercase tracking-wider border-b border-neutral-800/80 pb-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Color Grading</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {filters.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setActiveFilter(f.id)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium text-left transition-all border ${
                        activeFilter === f.id
                          ? "bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                          : "bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
                      }`}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Character Poses & Capture */}
              <div className="flex flex-col gap-3 justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-cyan-300 uppercase tracking-wider border-b border-neutral-800/80 pb-1.5 mb-2">
                    <span>Character Poses</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {poses.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => onTriggerPose(p.id)}
                        className="px-2.5 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-cyan-500/40 rounded-lg text-[11px] text-neutral-300 hover:text-cyan-200 transition-all text-left"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleTakeSnapshot}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-sky-600 hover:from-cyan-400 hover:to-sky-500 text-neutral-950 font-bold text-sm rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  <Camera className="w-4 h-4" />
                  <span>Capture Snapshot</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Snapshot Preview Modal */}
      {capturedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-6">
          <div className="max-w-2xl w-full bg-neutral-950 border border-cyan-500/40 rounded-2xl p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
                <Check className="w-4 h-4" />
                <span>Snapshot Captured!</span>
              </div>
              <button
                onClick={() => setCapturedImage(null)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-xl overflow-hidden border border-neutral-800 bg-black flex items-center justify-center">
              <img
                src={capturedImage}
                alt="Aetheria Capture"
                className={`max-h-[60vh] object-contain ${
                  filters.find((f) => f.id === activeFilter)?.class || ""
                }`}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setCapturedImage(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800"
              >
                Discard
              </button>
              <a
                href={capturedImage}
                download={`Aetheria_Resonance_${Date.now()}.png`}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-neutral-950 bg-cyan-400 hover:bg-cyan-300 flex items-center gap-2 shadow-lg shadow-cyan-500/20"
              >
                <Download className="w-4 h-4" />
                <span>Save to Device</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
