import type { LayerLabelId } from "./types";

export interface LayerLabelPreset {
  id: LayerLabelId;
  name: string;
  color: string | null;
}

export const layerLabelPresets: LayerLabelPreset[] = [
  { id: "none", name: "Source", color: null },
  { id: "red", name: "Red", color: "#df5b69" },
  { id: "orange", name: "Orange", color: "#f08c3c" },
  { id: "yellow", name: "Yellow", color: "#f4c542" },
  { id: "green", name: "Green", color: "#54b86a" },
  { id: "cyan", name: "Cyan", color: "#2fb6c3" },
  { id: "blue", name: "Blue", color: "#4f8df7" },
  { id: "purple", name: "Purple", color: "#8d72e1" },
  { id: "pink", name: "Pink", color: "#df6b9c" }
];

const layerLabelIds = new Set<LayerLabelId>(layerLabelPresets.map((preset) => preset.id));

export function normalizeLayerLabel(value: unknown): LayerLabelId {
  return typeof value === "string" && layerLabelIds.has(value as LayerLabelId) ? value as LayerLabelId : "none";
}

export function layerLabelName(id: LayerLabelId): string {
  return layerLabelPresets.find((preset) => preset.id === id)?.name ?? "Source";
}

export function layerLabelColor(id: LayerLabelId, fallbackColor: string): string {
  return layerLabelPresets.find((preset) => preset.id === id)?.color ?? fallbackColor;
}

export function nextLayerLabel(id: LayerLabelId): LayerLabelId {
  const index = Math.max(0, layerLabelPresets.findIndex((preset) => preset.id === id));
  return layerLabelPresets[(index + 1) % layerLabelPresets.length].id;
}
