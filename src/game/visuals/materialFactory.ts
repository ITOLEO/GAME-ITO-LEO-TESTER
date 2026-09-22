/**
 * MaterialFactory - Stylized Anime Fantasy Materials & Procedural Textures.
 * Provides rich, hand-crafted canvas textures and high-performance stylized PBR materials.
 */

import * as THREE from "three";

export class MaterialFactory {
  private static instance: MaterialFactory;
  private textureCache = new Map<string, THREE.CanvasTexture>();

  private constructor() {}

  public static getInstance(): MaterialFactory {
    if (!MaterialFactory.instance) {
      MaterialFactory.instance = new MaterialFactory();
    }
    return MaterialFactory.instance;
  }

  // --- 1. PROCEDURAL TEXTURES ---

  /**
   * Stylized Cobblestone Road Texture (hand-painted anime RPG style)
   */
  public getCobblestoneTexture(): THREE.CanvasTexture {
    const key = "cobblestone_road";
    if (this.textureCache.has(key)) return this.textureCache.get(key)!;

    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;

    // Earthy mortar base
    ctx.fillStyle = "#a89f91";
    ctx.fillRect(0, 0, 512, 512);

    // Draw stylized rounded cobblestones
    const stoneColors = ["#d5cdc4", "#bfb5a9", "#cdc3b6", "#a3988b", "#e2dad1"];
    const rows = 12;
    const cols = 12;
    const stepX = 512 / cols;
    const stepY = 512 / rows;

    for (let r = 0; r < rows; r++) {
      const offsetX = (r % 2) * (stepX * 0.5);
      for (let c = 0; c < cols; c++) {
        const x = c * stepX + offsetX - stepX * 0.2 + (Math.sin(r * 2 + c) * 4);
        const y = r * stepY + (Math.cos(c * 2 + r) * 4);
        const w = stepX * 0.82 + (Math.sin(r + c * 3) * 6);
        const h = stepY * 0.78 + (Math.cos(r * 3 + c) * 6);

        ctx.fillStyle = stoneColors[(r * 5 + c * 7) % stoneColors.length];
        ctx.beginPath();
        // Rounded stone
        ctx.roundRect ? ctx.roundRect(x, y, w, h, 8) : ctx.rect(x, y, w, h);
        ctx.fill();

        // Top highlight
        ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
        ctx.beginPath();
        ctx.ellipse(x + w * 0.4, y + h * 0.3, w * 0.35, h * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Edge shadow
        ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
        ctx.beginPath();
        ctx.ellipse(x + w * 0.5, y + h * 0.85, w * 0.35, h * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Moss specks
    ctx.fillStyle = "rgba(101, 163, 13, 0.4)";
    for (let m = 0; m < 60; m++) {
      const mx = (m * 47) % 512;
      const my = (m * 89) % 512;
      ctx.fillRect(mx, my, 4 + (m % 6), 4 + (m % 5));
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(6, 6);
    this.textureCache.set(key, tex);
    return tex;
  }

  /**
   * Stylized Half-Timber Wood Plank Texture
   */
  public getWoodPlankTexture(): THREE.CanvasTexture {
    const key = "wood_plank";
    if (this.textureCache.has(key)) return this.textureCache.get(key)!;

    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = "#78350f";
    ctx.fillRect(0, 0, 512, 512);

    const plankColors = ["#92400e", "#853b0c", "#78350f", "#6b2f0a"];
    const plankHeight = 512 / 8;

    for (let p = 0; p < 8; p++) {
      ctx.fillStyle = plankColors[p % plankColors.length];
      ctx.fillRect(0, p * plankHeight + 2, 512, plankHeight - 4);

      // Wood grain lines
      ctx.strokeStyle = "rgba(254, 215, 170, 0.18)";
      ctx.lineWidth = 1.5;
      for (let g = 0; g < 4; g++) {
        ctx.beginPath();
        const gy = p * plankHeight + 10 + g * 12;
        ctx.moveTo(0, gy);
        ctx.bezierCurveTo(150, gy + (g % 2 === 0 ? 6 : -6), 350, gy + (g % 2 === 0 ? -4 : 6), 512, gy);
        ctx.stroke();
      }

      // Plank seam shadow
      ctx.fillStyle = "rgba(24, 10, 4, 0.6)";
      ctx.fillRect(0, (p + 1) * plankHeight - 3, 512, 4);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    this.textureCache.set(key, tex);
    return tex;
  }

  /**
   * Stylized Slate / Terracotta Roof Tile Texture
   */
  public getRoofTileTexture(isTerracotta = false): THREE.CanvasTexture {
    const key = isTerracotta ? "roof_terracotta" : "roof_slate";
    if (this.textureCache.has(key)) return this.textureCache.get(key)!;

    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;

    const baseColor = isTerracotta ? "#991b1b" : "#1e293b";
    const highlightColor = isTerracotta ? "#b91c1c" : "#334155";
    const darkColor = isTerracotta ? "#7f1d1d" : "#0f172a";

    ctx.fillStyle = darkColor;
    ctx.fillRect(0, 0, 512, 512);

    const rows = 16;
    const cols = 8;
    const tileH = 512 / rows;
    const tileW = 512 / cols;

    for (let r = 0; r < rows; r++) {
      const offsetX = (r % 2) * (tileW * 0.5);
      for (let c = -1; c <= cols; c++) {
        const x = c * tileW + offsetX;
        const y = r * tileH;

        ctx.fillStyle = (r + c) % 2 === 0 ? baseColor : highlightColor;
        ctx.beginPath();
        // Scalloped / rounded tile edge
        ctx.moveTo(x + 2, y + 2);
        ctx.lineTo(x + tileW - 2, y + 2);
        ctx.lineTo(x + tileW - 2, y + tileH - 4);
        ctx.quadraticCurveTo(x + tileW * 0.5, y + tileH + 4, x + 2, y + tileH - 4);
        ctx.closePath();
        ctx.fill();

        // Tile edge bevel
        ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    this.textureCache.set(key, tex);
    return tex;
  }

  /**
   * Stylized Masonry Stone Wall Texture
   */
  public getStoneWallTexture(): THREE.CanvasTexture {
    const key = "stone_wall";
    if (this.textureCache.has(key)) return this.textureCache.get(key)!;

    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = "#52525b"; // Dark mortar
    ctx.fillRect(0, 0, 512, 512);

    const rows = 8;
    const cols = 6;
    const h = 512 / rows;
    const w = 512 / cols;
    const stoneTones = ["#71717a", "#a1a1aa", "#64748b", "#94a3b8", "#78716c"];

    for (let r = 0; r < rows; r++) {
      const offset = (r % 2) * (w * 0.5);
      for (let c = -1; c <= cols; c++) {
        const x = c * w + offset + 3;
        const y = r * h + 3;
        const sw = w - 6;
        const sh = h - 6;

        ctx.fillStyle = stoneTones[(r * 4 + c * 3 + 10) % stoneTones.length];
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(x, y, sw, sh, 4) : ctx.rect(x, y, sw, sh);
        ctx.fill();

        // Edge highlights
        ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    this.textureCache.set(key, tex);
    return tex;
  }

  /**
   * Expressive Anime Eye Canvas Texture
   */
  public getAnimeEyeTexture(irisHex = "#38bdf8", pupilHex = "#0c4a6e"): THREE.CanvasTexture {
    const key = `eye_${irisHex}_${pupilHex}`;
    if (this.textureCache.has(key)) return this.textureCache.get(key)!;

    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;

    // Sclera
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(128, 128, 100, 75, 0, 0, Math.PI * 2);
    ctx.fill();

    // Iris Gradient
    const irisGrad = ctx.createRadialGradient(128, 136, 10, 128, 128, 70);
    irisGrad.addColorStop(0, "#e0f2fe");
    irisGrad.addColorStop(0.35, irisHex);
    irisGrad.addColorStop(1, pupilHex);

    ctx.fillStyle = irisGrad;
    ctx.beginPath();
    ctx.ellipse(128, 128, 55, 68, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pupil
    ctx.fillStyle = pupilHex;
    ctx.beginPath();
    ctx.ellipse(128, 134, 25, 36, 0, 0, Math.PI * 2);
    ctx.fill();

    // Primary Anime Specular Sparkle (large upper-left star)
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(108, 104, 18, 22, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Secondary Highlight (lower right dot)
    ctx.beginPath();
    ctx.ellipse(146, 150, 9, 11, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Upper eyelash curve
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 14;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(128, 160, 90, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(canvas);
    this.textureCache.set(key, tex);
    return tex;
  }

  /**
   * Water displacement and ripple normal map
   */
  public getWaterNormalTexture(): THREE.CanvasTexture {
    const key = "water_normal";
    if (this.textureCache.has(key)) return this.textureCache.get(key)!;

    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = "rgb(128, 128, 255)"; // Neutral normal
    ctx.fillRect(0, 0, 256, 256);

    for (let i = 0; i < 28; i++) {
      const cx = (i * 73) % 256;
      const cy = (i * 127) % 256;
      const rad = 20 + (i % 25);
      const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, rad);
      grad.addColorStop(0, "rgba(180, 180, 255, 0.7)");
      grad.addColorStop(0.5, "rgba(128, 128, 255, 0.4)");
      grad.addColorStop(1, "rgba(128, 128, 255, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    this.textureCache.set(key, tex);
    return tex;
  }

  // --- 2. MATERIAL PRESETS ---

  public getCobblestoneMaterial(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      map: this.getCobblestoneTexture(),
      roughness: 0.75,
      metalness: 0.1,
    });
  }

  public getTimberMaterial(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      map: this.getWoodPlankTexture(),
      roughness: 0.85,
      metalness: 0.05,
    });
  }

  public getStoneWallMaterial(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      map: this.getStoneWallTexture(),
      roughness: 0.8,
      metalness: 0.15,
    });
  }

  public getRoofMaterial(isTerracotta = false): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      map: this.getRoofTileTexture(isTerracotta),
      roughness: 0.65,
      metalness: 0.1,
    });
  }

  public getStylizedMetalMaterial(color = 0xffffff, emissive = 0x000000): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color,
      emissive,
      emissiveIntensity: 0.4,
      roughness: 0.25,
      metalness: 0.85,
    });
  }

  public getAnimeClothMaterial(color: THREE.ColorRepresentation, roughness = 0.75): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color,
      roughness,
      metalness: 0.05,
    });
  }

  public getStylizedFoliageMaterial(colorHex: number): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.7,
      metalness: 0.05,
      flatShading: true,
    });
  }

  public getGoldTrimMaterial(): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xd97706,
      emissiveIntensity: 0.25,
      roughness: 0.3,
      metalness: 0.9,
    });
  }
}
