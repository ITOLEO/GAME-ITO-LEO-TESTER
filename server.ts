import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;

// In-memory player profile store for server sync backup
const serverSaveVault: Record<string, any> = {};

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "5mb" }));

  // Shared GenAI client lazy setup
  let aiClient: GoogleGenAI | null = null;
  function getGenAI() {
    if (!aiClient && process.env.GEMINI_API_KEY) {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
    return aiClient;
  }

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      game: "Aetheria: Resonant Horizon",
      version: "1.0.0",
      timestamp: Date.now(),
    });
  });

  // Ancient Aether Oracle / Chronicle with High Thinking
  app.post("/api/oracle", async (req, res) => {
    const { query, playerContext } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    try {
      const ai = getGenAI();
      if (!ai) {
        // Fallback simulated response if no key configured in environment
        return res.json({
          response: `[Echoes of the Aether Archive]\n\n"Seeker of the Horizon, the ley-lines of Sunvale whisper of the ancient elemental harmonies: When Ember meets Bloom, ignite a Conflagration! When Tide meets Volt, unleash the Chain Discharge. Guard your stamina for the Perfect Dodge, for time bends to those who harmonize with the Aether."`,
          isFallback: true,
        });
      }

      const systemPrompt = `You are the Ancient Aether Oracle, an omniscient resonating intelligence residing within the world of Aetheria.
The player is exploring "Aetheria: Resonant Horizon", a third-person 3D anime action RPG.
World Context:
- Aether Elements: Ember (Fire), Tide (Water), Gale (Wind), Stone (Earth), Bloom (Nature/Flora), Volt (Lightning).
- Elemental Reactions:
  * Ember + Bloom = Conflagration (High AoE fiery detonation and burning)
  * Tide + Volt = Chain Discharge (Forked lightning arcing between enemies)
  * Stone + Gale = Dust Barrier (Damage absorption shield & blinding whirl)
  * Tide + Bloom = Verdant Surge (Healing aura & rooting vines)
  * Ember + Volt = Overcharge Stagger (Rapid stagger bar depletion)
- Regions: Starter region is "The Sunvale Plateau / Emerald Reach" leading to the "Sunken Aether Crypt" and the world boss "Resonant Colossus: Ignis-Titan".
- Playable Heroes: Kaelen the Windblade (Gale Swordsman), Lyra the Sunfire (Ember Greatsword), Zephyr the Frostbloom (Bloom/Tide Catalyst).
- Core mechanics: Light combo attack chain, Charged attack, Dodge & Perfect Dodge (time slowdown), Character Skill (Q), Ultimate Burst (R), Stagger vulnerability system.

Provide thoughtful, deeply lore-rich, strategic, and poetic advice. Format with clean sections when explaining combat strategy or secrets.`;

      const contents = `Player asks: "${query}"\n${playerContext ? `Current Player Context: ${JSON.stringify(playerContext)}` : ""}`;

      const aiResponse = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents,
        config: {
          systemInstruction: systemPrompt,
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.HIGH,
          },
        },
      });

      return res.json({
        response: aiResponse.text || "The Aether frequencies remain still...",
        isFallback: false,
      });
    } catch (err: any) {
      console.error("Oracle invocation error:", err);
      return res.status(500).json({
        error: "Failed to consult the Ancient Oracle",
        details: err?.message || String(err),
      });
    }
  });

  // Server-side save sync
  app.post("/api/save", (req, res) => {
    const { userId, saveData } = req.body;
    if (!userId || !saveData) {
      return res.status(400).json({ error: "userId and saveData required" });
    }
    serverSaveVault[userId] = {
      ...saveData,
      lastSaved: Date.now(),
    };
    return res.json({ success: true, savedAt: Date.now() });
  });

  app.get("/api/save/:userId", (req, res) => {
    const { userId } = req.params;
    const save = serverSaveVault[userId];
    if (!save) {
      return res.status(404).json({ error: "Save profile not found" });
    }
    return res.json({ success: true, saveData: save });
  });

  // Vite middleware for dev or static server for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Aetheria Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
