export const TIMELINE_TEXTURE_SOURCES = ["none", "checker", "uv", "grid"] as const;

export type TimelineTextureSource = typeof TIMELINE_TEXTURE_SOURCES[number];

export function textureSourceValue(textureName: string): [number, number, number] {
  return [textureSourceIndex(textureName), 0, 0];
}

export function textureSourceIndex(textureName: string): number {
  const index = TIMELINE_TEXTURE_SOURCES.indexOf(textureName as TimelineTextureSource);
  return index >= 0 ? index : 0;
}

export function textureSourceFromValue(value: number): TimelineTextureSource {
  const index = Math.min(Math.max(Math.round(value), 0), TIMELINE_TEXTURE_SOURCES.length - 1);
  return TIMELINE_TEXTURE_SOURCES[index];
}

export function textureSourceLabelFromValue(value: number): string {
  const source = textureSourceFromValue(value);
  if (source === "none") return "None";
  if (source === "uv") return "UV";
  return source.charAt(0).toUpperCase() + source.slice(1);
}
