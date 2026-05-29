import type { TimelineTrackKind } from "../editor/types";

export const OBJECT_TRACKS: TimelineTrackKind[] = [
  "position",
  "rotation",
  "scale",
  "objectColor",
  "objectOpacity",
  "objectRoughness",
  "objectMetalness",
  "objectTextureRepeat",
  "objectTextureOffset",
  "objectTextureRotation",
  "objectVisibility"
];

export const CAMERA_TRACKS: TimelineTrackKind[] = ["cameraPosition", "cameraTarget", "cameraLens"];

export const LIGHT_TRACKS: TimelineTrackKind[] = [
  "directionalPosition",
  "directionalColor",
  "directionalIntensity",
  "pointPosition",
  "pointColor",
  "pointIntensity",
  "spotPosition",
  "spotColor",
  "spotIntensity",
  "ambientIntensity"
];

export const OBJECT_AXIS_TRACKS = new Set<TimelineTrackKind>(["position", "rotation", "scale"]);

export const TRACK_COLORS: Record<TimelineTrackKind, string> = {
  position: "#20bfa9",
  rotation: "#f4ad2f",
  scale: "#7c70f4",
  objectColor: "#df6b80",
  objectOpacity: "#64748b",
  objectRoughness: "#8b5cf6",
  objectMetalness: "#0f766e",
  objectTextureRepeat: "#d97706",
  objectTextureOffset: "#0891b2",
  objectTextureRotation: "#be123c",
  objectVisibility: "#16a34a",
  cameraPosition: "#4f8df7",
  cameraTarget: "#a86de8",
  cameraLens: "#df6b80",
  directionalPosition: "#f7bd4b",
  directionalColor: "#f39c12",
  directionalIntensity: "#d98f00",
  pointPosition: "#60c0ff",
  pointColor: "#2f9de8",
  pointIntensity: "#1479b8",
  spotPosition: "#fb7185",
  spotColor: "#df6b80",
  spotIntensity: "#b8394e",
  ambientIntensity: "#8393a2"
};

export const TRACK_LABELS: Record<TimelineTrackKind, string> = {
  position: "Position",
  rotation: "Rotation",
  scale: "Scale",
  objectColor: "Color",
  objectOpacity: "Opacity",
  objectRoughness: "Roughness",
  objectMetalness: "Metalness",
  objectTextureRepeat: "Texture Repeat",
  objectTextureOffset: "Texture Offset",
  objectTextureRotation: "Texture Rotation",
  objectVisibility: "Visibility",
  cameraPosition: "Camera Position",
  cameraTarget: "Camera Target",
  cameraLens: "Camera Lens",
  directionalPosition: "Sun Position",
  directionalColor: "Sun Color",
  directionalIntensity: "Sun Intensity",
  pointPosition: "Point Position",
  pointColor: "Point Color",
  pointIntensity: "Point Intensity",
  spotPosition: "Spot Position",
  spotColor: "Spot Color",
  spotIntensity: "Spot Intensity",
  ambientIntensity: "Ambient Intensity"
};

export function isCameraTrack(kind: TimelineTrackKind): kind is "cameraPosition" | "cameraTarget" | "cameraLens" {
  return kind === "cameraPosition" || kind === "cameraTarget" || kind === "cameraLens";
}

export function isLightTrack(kind: TimelineTrackKind): boolean {
  return LIGHT_TRACKS.includes(kind);
}

export function isObjectTrack(kind: TimelineTrackKind): boolean {
  return OBJECT_TRACKS.includes(kind);
}

export function trackLabel(kind: TimelineTrackKind, axis?: string): string {
  return axis ? `${TRACK_LABELS[kind]} ${axis.toUpperCase()}` : TRACK_LABELS[kind];
}
