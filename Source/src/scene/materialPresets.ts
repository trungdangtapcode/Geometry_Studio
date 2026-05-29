import type { MaterialMode, SceneEntry } from "../editor/types";

export type MaterialPresetId =
  | "basic"
  | "lambert"
  | "phong"
  | "texture"
  | "ceramic"
  | "metal"
  | "plastic"
  | "glass"
  | "clay";

export interface MaterialPreset {
  id: MaterialPresetId;
  label: string;
  materialMode: MaterialMode;
  color?: string;
  opacity?: number;
  roughness?: number;
  metalness?: number;
  textureName?: string;
}

export const MATERIAL_PRESETS: MaterialPreset[] = [
  { id: "ceramic", label: "Ceramic", materialMode: "standard", color: "#f2eee6", opacity: 1, roughness: 0.24, metalness: 0, textureName: "none" },
  { id: "metal", label: "Metal", materialMode: "standard", color: "#b7c0ca", opacity: 1, roughness: 0.18, metalness: 1, textureName: "none" },
  { id: "plastic", label: "Plastic", materialMode: "standard", color: "#f06c4f", opacity: 1, roughness: 0.36, metalness: 0.03, textureName: "none" },
  { id: "glass", label: "Glass", materialMode: "standard", color: "#a8e7ff", opacity: 0.42, roughness: 0.04, metalness: 0, textureName: "none" },
  { id: "clay", label: "Clay", materialMode: "standard", color: "#b96d50", opacity: 1, roughness: 0.86, metalness: 0, textureName: "none" },
  { id: "basic", label: "Basic", materialMode: "basic" },
  { id: "lambert", label: "Lambert", materialMode: "lambert" },
  { id: "phong", label: "Phong", materialMode: "phong", roughness: 0.32, metalness: 0 },
  { id: "texture", label: "Texture", materialMode: "standard", color: "#ffffff", opacity: 1, roughness: 0.38, metalness: 0.05, textureName: "uv" }
];

export function materialPresetById(id: string): MaterialPreset | null {
  return MATERIAL_PRESETS.find((preset) => preset.id === id) ?? null;
}

export function applyMaterialPresetValues(entry: SceneEntry, preset: MaterialPreset): void {
  entry.materialMode = preset.materialMode;
  if (preset.color) entry.color.set(preset.color);
  if (typeof preset.opacity === "number") entry.opacity = preset.opacity;
  if (typeof preset.roughness === "number") entry.roughness = preset.roughness;
  if (typeof preset.metalness === "number") entry.metalness = preset.metalness;
}

export function entryMatchesMaterialPreset(entry: SceneEntry, preset: MaterialPreset): boolean {
  if (entry.materialMode !== preset.materialMode) return false;
  if (preset.textureName && entry.textureName !== preset.textureName) return false;
  if (preset.color && `#${entry.color.getHexString()}` !== preset.color.toLowerCase()) return false;
  if (typeof preset.opacity === "number" && Math.abs(entry.opacity - preset.opacity) > 0.001) return false;
  if (typeof preset.roughness === "number" && Math.abs(entry.roughness - preset.roughness) > 0.001) return false;
  if (typeof preset.metalness === "number" && Math.abs(entry.metalness - preset.metalness) > 0.001) return false;
  return true;
}
