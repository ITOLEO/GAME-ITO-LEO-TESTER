/**
 * Aetheria: Resonant Horizon - Ancient Aether Oracle (Powered by Gemini 3.1 Pro Thinking Mode)
 */

import React, { useState } from "react";
import { X, Brain, Sparkles, Send, Compass, Flame, Shield, HelpCircle } from "lucide-react";
import { PlayableCharacter, Quest } from "../types/game";

interface OracleModalProps {
  party: PlayableCharacter[];
  activeQuest: Quest | null;
  onClose: () => void;
}

export const OracleModal: React.FC<OracleModalProps> = ({ party, activeQuest, onClose }) => {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{ role: "user" | "oracle"; text: string }[]>([
    {
      role: "oracle",
      text: "Greetings, Resonance Bearer. I am the Ancient Aether Oracle, attuned to the cosmic ley lines of Aetheria. Inquire of deep elemental synergies, boss combat tactics, ancient lore, or optimal party resonance.",
    },
  ]);

  const presetQueries = [
    "What is the optimal elemental rotation between Kaelen (Gale), Lyra (Ember), and Zephyr (Volt)?",
    "How do I stagger and defeat the Resonant Colossus: Ignis-Titan during Phase 2?",
    "How do I activate the 3 elemental totems in the Ancient Ruins and what does the sealed chest contain?",
    "Explain the lore behind the Aether Calamity and the Sundered Spire.",
  ];

  const handleAskOracle = async (queryText: string) => {
    if (!queryText.trim() || loading) return;

    const userMessage = queryText.trim();
    setHistory((prev) => [...prev, { role: "user", text: userMessage }]);
    setPrompt("");
    setLoading(true);
    setResponse("");

    try {
      const res = await fetch("/api/oracle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userMessage,
          context: {
            party: party.map((c) => ({ name: c.name, element: c.element, level: c.level })),
            activeQuest: activeQuest ? activeQuest.title : "None",
          },
        }),
      });

      if (!res.body) {
        throw new Error("No response stream");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        fullText += chunk;
        setResponse(fullText);
      }

      setHistory((prev) => [...prev, { role: "oracle", text: fullText }]);
    } catch (err: any) {
      console.error("Oracle query error:", err);
      const errText = "The cosmic resonance fluctuates... Please ensure your Gemini API key is configured or try again.";
      setHistory((prev) => [...prev, { role: "oracle", text: errText }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 pointer-events-auto">
      <div className="w-full max-w-3xl bg-neutral-950/95 border-2 border-cyan-500/50 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.3)] overflow-hidden flex flex-col h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-cyan-900/50 bg-gradient-to-r from-cyan-950/80 via-neutral-900 to-indigo-950/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300">
              <Brain className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-100 flex items-center gap-2">
                Ancient Aether Oracle
                <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/60 text-cyan-300 font-mono tracking-wider">
                  Gemini 3.1 Pro • Thinking Mode HIGH
                </span>
              </h2>
              <p className="text-xs text-cyan-400/80">Deep strategic reasoning & encyclopedic Aetherian insight</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-100 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat / Thought Stream */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {history.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "oracle" && (
                <div className="w-8 h-8 rounded-full bg-cyan-950 border border-cyan-400/40 flex items-center justify-center flex-shrink-0 text-cyan-300">
                  <Sparkles className="w-4 h-4" />
                </div>
              )}
              <div
                className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-cyan-600 text-white font-medium rounded-tr-none shadow-md"
                    : "bg-neutral-900/80 border border-neutral-800 text-neutral-200 rounded-tl-none shadow-inner font-sans space-y-2"
                }`}
              >
                {msg.text.split("\n\n").map((para, pIdx) => (
                  <p key={pIdx}>{para}</p>
                ))}
              </div>
            </div>
          ))}

          {/* Current Streaming Message */}
          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-cyan-950 border border-cyan-400/40 flex items-center justify-center flex-shrink-0 text-cyan-300">
                <Brain className="w-4 h-4 animate-spin" />
              </div>
              <div className="max-w-[80%] p-4 rounded-2xl bg-neutral-900/80 border border-cyan-500/30 text-neutral-200 rounded-tl-none space-y-2">
                <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  Reasoning through Aether matrices & combat vectors...
                </div>
                {response && (
                  <div className="text-sm leading-relaxed">
                    {response.split("\n\n").map((para, pIdx) => (
                      <p key={pIdx}>{para}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Preset Query Chips */}
        <div className="px-6 py-2 border-t border-neutral-800/80 bg-neutral-900/40 flex gap-2 overflow-x-auto">
          {presetQueries.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleAskOracle(q)}
              className="text-xs px-3 py-1.5 rounded-full bg-neutral-900 hover:bg-cyan-950/80 border border-neutral-800 hover:border-cyan-500/50 text-neutral-300 hover:text-cyan-200 whitespace-nowrap transition-all flex items-center gap-1.5 flex-shrink-0"
            >
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
              {q.length > 40 ? q.slice(0, 40) + "..." : q}
            </button>
          ))}
        </div>

        {/* Input Field */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-900/60">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAskOracle(prompt);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask the Oracle about combat rotations, boss weaknesses, or lore..."
              className="flex-1 bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-3 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-cyan-400 transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="px-5 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white font-bold text-sm shadow-md transition-all active:scale-95 flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Inquire
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
