import type { TimelineTrackKind } from "../editor/types";
import { trackLabel } from "./timelineTrackMetadata";
import type { TimelineAxis } from "./timelineValueGraph";

const TRACK_SEARCH_ALIASES: Record<TimelineTrackKind, string[]> = {
  position: ["transform", "translate", "move", "trs"],
  rotation: ["transform", "rotate", "orientation", "trs"],
  scale: ["transform", "size", "trs"],
  objectColor: ["material", "appearance", "shader", "toon", "anime", "comic", "style"],
  objectOpacity: ["material", "appearance", "alpha", "transparency", "transparent"],
  objectRoughness: ["material", "appearance", "pbr", "surface", "shader"],
  objectMetalness: ["material", "appearance", "pbr", "metal", "metallic", "shader"],
  objectTextureSource: ["material", "texture", "map", "image", "source", "checker", "uv", "grid"],
  objectTextureRepeat: ["material", "texture", "uv", "mapping", "tile", "repeat"],
  objectTextureOffset: ["material", "texture", "uv", "mapping", "pan", "offset"],
  objectTextureRotation: ["material", "texture", "uv", "mapping", "rotate"],
  objectVisibility: ["layer", "visible", "visibility", "show", "hide"],
  cameraPosition: ["camera", "projection", "view"],
  cameraTarget: ["camera", "projection", "view", "look at", "focus"],
  cameraLens: ["camera", "projection", "fov", "near", "far", "clip", "clipping"],
  directionalPosition: ["light", "lighting", "sun", "directional"],
  directionalColor: ["light", "lighting", "sun", "directional"],
  directionalIntensity: ["light", "lighting", "sun", "directional", "brightness"],
  pointPosition: ["light", "lighting", "point"],
  pointColor: ["light", "lighting", "point"],
  pointIntensity: ["light", "lighting", "point", "brightness"],
  spotPosition: ["light", "lighting", "spot", "spotlight"],
  spotColor: ["light", "lighting", "spot", "spotlight"],
  spotIntensity: ["light", "lighting", "spot", "spotlight", "brightness"],
  ambientIntensity: ["light", "lighting", "ambient", "global", "brightness"]
};

export function timelineRowMatchesSearch(targetName: string, kind: TimelineTrackKind, axis: TimelineAxis | undefined, search: string): boolean {
  const query = normalizeSearch(search);
  if (!query) return true;
  const haystack = timelineRowSearchText(targetName, kind, axis);
  const axisTokens = timelineAxisSearchTokens(kind, axis);
  return query.split(" ").every((part) =>
    SINGLE_TOKEN_AXIS_QUERIES.has(part)
      ? axisTokens.has(part)
      : haystack.includes(part)
  );
}

function timelineRowSearchText(targetName: string, kind: TimelineTrackKind, axis?: TimelineAxis): string {
  return normalizeSearch([
    targetName,
    trackLabel(kind, axis),
    kind,
    axis ?? "",
    ...TRACK_SEARCH_ALIASES[kind]
  ].join(" "));
}

function timelineAxisSearchTokens(kind: TimelineTrackKind, axis?: TimelineAxis): Set<string> {
  return new Set(normalizeSearch([
    trackLabel(kind, axis),
    axis ?? ""
  ].join(" ")).split(" ").filter(Boolean));
}

const SINGLE_TOKEN_AXIS_QUERIES = new Set(["x", "y", "z", "r", "g", "b", "u", "v"]);

function normalizeSearch(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}
