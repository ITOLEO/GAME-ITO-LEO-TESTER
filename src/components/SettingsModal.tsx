/**
 * Aetheria: Resonant Horizon - Settings, Controls & Save Management
 */

import React, { useState } from "react";
import {
  X,
  Settings,
  Save,
  Download,
  Upload,
  Cloud,
  Volume2,
  VolumeX,
  Keyboard,
  RotateCcw,
  Check,
} from "lucide-react";
import { audio } from "../game/audio";

interface SettingsModalProps {
  onManualSave: (slot: number) => void;
  onManualLoad: (slot: number) => void;
  onExportSave: () => void;
  onImportSave: (fileContent: string) => void;
  onCloudSync: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  graphicsQuality: "Low" | "Medium" | "High" | "Ultra";
  onChangeGraphics: (quality: "Low" | "Medium" | "High" | "Ultra") => void;
  screenShake: boolean;
  onToggleScreenShake: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  onManualSave,
  onManualLoad,
  onExportSave,
  onImportSave,
  onCloudSync,
  isMuted,
  onToggleMute,
  graphicsQuality,
  onChangeGraphics,
  screenShake,
  onToggleScreenShake,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"controls" | "graphics" | "audio" | "save">("controls");
  const [saveSlot, setSaveSlot] = useState(1);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const handleSave = (slot: number) => {
    onManualSave(slot);
    setSaveStatus(`Saved successfully to Slot ${slot}!`);
    audio.playFanfare();
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          onImportSave(text);
          setSaveStatus("Imported save file successfully!");
          audio.playFanfare();
          setTimeout(() => setSaveStatus(null), 3000);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 pointer-events-auto">
      <div className="w-full max-w-3xl bg-neutral-950/95 border border-neutral-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-neutral-900/40">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
              <Settings className="w-5 h-5 text-cyan-400" />
              Game Settings & Profiles
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-100 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-neutral-800 bg-neutral-900/30 px-6 pt-2">
          {[
            { id: "controls", label: "Controls & Keybindings", icon: Keyboard },
            { id: "graphics", label: "Graphics & Display", icon: RotateCcw },
            { id: "audio", label: "Audio & Accessibility", icon: Volume2 },
            { id: "save", label: "Save & Storage", icon: Save },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all ${
                  activeTab === tab.id
                    ? "border-cyan-400 text-cyan-300"
                    : "border-transparent text-neutral-400 hover:text-neutral-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {saveStatus && (
            <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
              <Check className="w-4 h-4" />
              {saveStatus}
            </div>
          )}

          {/* Tab 1: Controls */}
          {activeTab === "controls" && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Combat & Exploration Keys</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {[
                  { key: "W, A, S, D", desc: "Move Character" },
                  { key: "Mouse Move / Drag", desc: "Orbit & Look Camera" },
                  { key: "Left Click", desc: "Normal Attack (3-Hit Combo)" },
                  { key: "Right Click", desc: "Dodge / Dash (I-Frames & Perfect Dodge)" },
                  { key: "Space", desc: "Jump" },
                  { key: "Shift (Hold)", desc: "Sprint (Consumes Stamina)" },
                  { key: "Q", desc: "Character Elemental Skill" },
                  { key: "R", desc: "Elemental Burst / Ultimate" },
                  { key: "1, 2, 3", desc: "Switch Active Character" },
                  { key: "E", desc: "Interact (Talk, Gather, Chest, Waystone)" },
                  { key: "C", desc: "Character Roster & Ascension" },
                  { key: "B", desc: "Inventory & Equipment" },
                  { key: "J", desc: "Quest Journal" },
                  { key: "K", desc: "Alchemy & Hearth" },
                  { key: "O", desc: "Ancient Oracle (Gemini 3.1 Pro)" },
                  { key: "M", desc: "World Atlas & Fast Travel" },
                  { key: "ESC", desc: "Pause Menu & Settings" },
                ].map((binding, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-neutral-900/60 border border-neutral-800"
                  >
                    <span className="font-bold text-neutral-200">{binding.desc}</span>
                    <kbd className="px-2 py-1 rounded bg-neutral-800 border border-neutral-700 text-cyan-300 font-mono text-[11px] shadow-sm">
                      {binding.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: Graphics & Display */}
          {activeTab === "graphics" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Graphics Quality Preset</h3>
                <div className="grid grid-cols-4 gap-2">
                  {(["Low", "Medium", "High", "Ultra"] as const).map((q) => (
                    <button
                      key={q}
                      onClick={() => {
                        onChangeGraphics(q);
                        audio.playButtonClickSound();
                      }}
                      className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all ${
                        graphicsQuality === q
                          ? "bg-cyan-950 border-cyan-400 text-cyan-200 ring-2 ring-cyan-500/30"
                          : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200"
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-neutral-200">Screen Shake on Impact</div>
                    <div className="text-[10px] text-neutral-400">Camera rumble during boss strikes and explosions</div>
                  </div>
                  <button
                    onClick={onToggleScreenShake}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      screenShake
                        ? "bg-cyan-950 border border-cyan-500 text-cyan-300"
                        : "bg-neutral-800 border border-neutral-700 text-neutral-400"
                    }`}
                  >
                    {screenShake ? "Enabled" : "Disabled"}
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-neutral-800/60">
                  <div>
                    <div className="text-xs font-bold text-neutral-200">Target Framerate</div>
                    <div className="text-[10px] text-neutral-400">Desktop Target: 60 FPS (Hardware Synchronized)</div>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-neutral-800 text-emerald-400 font-mono text-xs font-bold">
                    60 FPS
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800 text-xs text-neutral-400 leading-relaxed font-sans">
                Render quality scales terrain LOD, dynamic shadow maps, and particle densities for high visual fidelity on desktop and smooth framerates on laptops.
              </div>
            </div>
          )}

          {/* Tab 3: Save Management */}
          {activeTab === "save" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">Multi-Slot Profiles</h3>
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3].map((slot) => (
                    <div
                      key={slot}
                      className={`p-4 rounded-xl border flex flex-col justify-between ${
                        saveSlot === slot ? "bg-cyan-950/40 border-cyan-400" : "bg-neutral-900/50 border-neutral-800"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm text-neutral-100">Slot {slot}</span>
                        <span className="text-[10px] text-cyan-400 font-mono">Local Data</span>
                      </div>
                      <div className="space-y-1.5 mt-2">
                        <button
                          onClick={() => handleSave(slot)}
                          className="w-full py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow transition-all active:scale-95 flex items-center justify-center gap-1.5"
                        >
                          <Save className="w-3.5 h-3.5" /> Save
                        </button>
                        <button
                          onClick={() => {
                            onManualLoad(slot);
                            audio.playFanfare();
                          }}
                          className="w-full py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs transition-all active:scale-95 flex items-center justify-center gap-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Load
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">Cloud Sync & File Backup</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={onCloudSync}
                    className="p-4 rounded-xl bg-neutral-900/60 hover:bg-cyan-950/60 border border-neutral-800 hover:border-cyan-500/50 flex flex-col items-center gap-2 text-neutral-200 transition-all active:scale-95"
                  >
                    <Cloud className="w-6 h-6 text-cyan-400" />
                    <span className="font-bold text-xs">Sync to Cloud Server</span>
                    <span className="text-[10px] text-neutral-500 text-center">Auto-sync with backend /api/save</span>
                  </button>

                  <button
                    onClick={onExportSave}
                    className="p-4 rounded-xl bg-neutral-900/60 hover:bg-cyan-950/60 border border-neutral-800 hover:border-cyan-500/50 flex flex-col items-center gap-2 text-neutral-200 transition-all active:scale-95"
                  >
                    <Download className="w-6 h-6 text-emerald-400" />
                    <span className="font-bold text-xs">Export Save File</span>
                    <span className="text-[10px] text-neutral-500 text-center">Download JSON profile</span>
                  </button>

                  <label className="p-4 rounded-xl bg-neutral-900/60 hover:bg-cyan-950/60 border border-neutral-800 hover:border-cyan-500/50 flex flex-col items-center gap-2 text-neutral-200 transition-all active:scale-95 cursor-pointer">
                    <Upload className="w-6 h-6 text-amber-400" />
                    <span className="font-bold text-xs">Import Save File</span>
                    <span className="text-[10px] text-neutral-500 text-center">Load JSON profile from disk</span>
                    <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Audio & Preferences */}
          {activeTab === "audio" && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Audio Synthesizer Engine</h3>

              <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-neutral-100">Master Audio</div>
                  <div className="text-xs text-neutral-400">Procedural 8-Voice Web Audio Synthesis</div>
                </div>
                <button
                  onClick={onToggleMute}
                  className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                    isMuted
                      ? "bg-rose-950/80 border border-rose-600 text-rose-300"
                      : "bg-emerald-950/80 border border-emerald-600 text-emerald-300"
                  }`}
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  {isMuted ? "Muted" : "Active"}
                </button>
              </div>

              <div className="p-4 rounded-xl bg-neutral-900/40 border border-neutral-800 text-xs text-neutral-400 leading-relaxed">
                Aetheria uses a dynamic harmonic Web Audio synthesizer for all weapon clangs, elemental spells, ambient wind pads, fanfares, and boss music. No external sound assets are required, ensuring zero loading lag and crisp responsive audio!
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
