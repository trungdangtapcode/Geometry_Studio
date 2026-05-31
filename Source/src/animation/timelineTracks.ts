import { MathUtils } from "three";
import type { AnimationMode, LightKind, SceneEntry, TimelineTrackKind } from "../editor/types";
import { textureSourceValue } from "./textureSourceTrack";

export type CameraTimelineTrackKind = "cameraPosition" | "cameraTarget" | "cameraLens";
export type ObjectTransformTrackKind = "position" | "rotation" | "scale";
export type ObjectPropertyTrackKind =
  | "objectColor"
  | "objectOpacity"
  | "objectRoughness"
  | "objectMetalness"
  | "objectTextureSource"
  | "objectTextureRepeat"
  | "objectTextureOffset"
  | "objectTextureRotation"
  | "objectVisibility";
export type LightTimelineTrackKind =
  | "directionalPosition"
  | "directionalColor"
  | "directionalIntensity"
  | "pointPosition"
  | "pointColor"
  | "pointIntensity"
  | "spotPosition"
  | "spotColor"
  | "spotIntensity"
  | "ambientIntensity";

export function timelineValueForEntry(entry: SceneEntry, kind: TimelineTrackKind): [number, number, number] {
  if (kind === "position") return [entry.root.position.x, entry.root.position.y, entry.root.position.z];
  if (kind === "scale") return [entry.root.scale.x, entry.root.scale.y, entry.root.scale.z];
  if (kind === "rotation") {
    return [
      MathUtils.radToDeg(entry.root.rotation.x),
      MathUtils.radToDeg(entry.root.rotation.y),
      MathUtils.radToDeg(entry.root.rotation.z)
    ];
  }
  if (kind === "objectColor") return [entry.color.r, entry.color.g, entry.color.b];
  if (kind === "objectOpacity") return [entry.opacity, 0, 0];
  if (kind === "objectRoughness") return [entry.roughness, 0, 0];
  if (kind === "objectMetalness") return [entry.metalness, 0, 0];
  if (kind === "objectTextureSource") return textureSourceValue(entry.textureName);
  if (kind === "objectTextureRepeat") return [entry.textureRepeat.x, entry.textureRepeat.y, 0];
  if (kind === "objectTextureOffset") return [entry.textureOffset.x, entry.textureOffset.y, 0];
  if (kind === "objectTextureRotation") return [entry.textureRotation, 0, 0];
  if (kind === "objectVisibility") return [entry.root.visible ? 1 : 0, 0, 0];
  return [0, 0, 0];
}

export function primaryTrackForAnimationMode(mode: AnimationMode): ObjectTransformTrackKind {
  if (mode === "spin") return "rotation";
  if (mode === "pulse") return "scale";
  return "position";
}

export function cameraTrackForGroup(group: "position" | "target" | "camera"): CameraTimelineTrackKind {
  if (group === "position") return "cameraPosition";
  if (group === "target") return "cameraTarget";
  return "cameraLens";
}

export function lightPositionTrackForKind(kind: LightKind): LightTimelineTrackKind {
  if (kind === "directional") return "directionalPosition";
  if (kind === "point") return "pointPosition";
  return "spotPosition";
}

export function lightColorTrackForKind(kind: LightKind): LightTimelineTrackKind {
  if (kind === "directional") return "directionalColor";
  if (kind === "point") return "pointColor";
  return "spotColor";
}

export function lightIntensityTrackForKind(kind: LightKind): LightTimelineTrackKind {
  if (kind === "directional") return "directionalIntensity";
  if (kind === "point") return "pointIntensity";
  return "spotIntensity";
}

export function isCameraTrackKind(kind: TimelineTrackKind): kind is CameraTimelineTrackKind {
  return kind === "cameraPosition" || kind === "cameraTarget" || kind === "cameraLens";
}

export function isObjectTransformTrackKind(kind: TimelineTrackKind): kind is ObjectTransformTrackKind {
  return kind === "position" || kind === "rotation" || kind === "scale";
}

export function isObjectPropertyTrackKind(kind: TimelineTrackKind): kind is ObjectPropertyTrackKind {
  return kind === "objectColor" ||
    kind === "objectOpacity" ||
    kind === "objectRoughness" ||
    kind === "objectMetalness" ||
    kind === "objectTextureSource" ||
    kind === "objectTextureRepeat" ||
    kind === "objectTextureOffset" ||
    kind === "objectTextureRotation" ||
    kind === "objectVisibility";
}

export function isLightTrackKind(kind: TimelineTrackKind): kind is LightTimelineTrackKind {
  return kind === "directionalPosition" ||
    kind === "directionalColor" ||
    kind === "directionalIntensity" ||
    kind === "pointPosition" ||
    kind === "pointColor" ||
    kind === "pointIntensity" ||
    kind === "spotPosition" ||
    kind === "spotColor" ||
    kind === "spotIntensity" ||
    kind === "ambientIntensity";
}

export function cameraTrackLabel(kind: TimelineTrackKind): string {
  if (kind === "cameraPosition") return "Camera position";
  if (kind === "cameraTarget") return "Camera target";
  if (kind === "cameraLens") return "Camera lens";
  return labelFromKind(kind);
}

export function objectTrackLabel(kind: TimelineTrackKind): string {
  if (kind === "position") return "Position";
  if (kind === "rotation") return "Rotation";
  if (kind === "scale") return "Scale";
  if (kind === "objectColor") return "Object color";
  if (kind === "objectOpacity") return "Object opacity";
  if (kind === "objectRoughness") return "Object roughness";
  if (kind === "objectMetalness") return "Object metalness";
  if (kind === "objectTextureSource") return "Texture source";
  if (kind === "objectTextureRepeat") return "Texture repeat";
  if (kind === "objectTextureOffset") return "Texture offset";
  if (kind === "objectTextureRotation") return "Texture rotation";
  if (kind === "objectVisibility") return "Object visibility";
  return labelFromKind(kind);
}

export function lightTrackLabel(kind: TimelineTrackKind): string {
  if (kind === "directionalPosition") return "Sun position";
  if (kind === "directionalColor") return "Sun color";
  if (kind === "directionalIntensity") return "Sun intensity";
  if (kind === "pointPosition") return "Point light position";
  if (kind === "pointColor") return "Point light color";
  if (kind === "pointIntensity") return "Point light intensity";
  if (kind === "spotPosition") return "Spot light position";
  if (kind === "spotColor") return "Spot light color";
  if (kind === "spotIntensity") return "Spot light intensity";
  if (kind === "ambientIntensity") return "Ambient intensity";
  return labelFromKind(kind);
}

function labelFromKind(kind: string): string {
  return kind.charAt(0).toUpperCase() + kind.slice(1);
}
