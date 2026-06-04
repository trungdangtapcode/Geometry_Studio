const MAX_LAYER_COMMENT_LENGTH = 160;

export function normalizeLayerComment(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, MAX_LAYER_COMMENT_LENGTH);
}
