import * as THREE from "three";
import { cloneTimelineDocument, createDefaultTimeline, normalizeTimelineDocument } from "../animation/timelineSchema";
import type { LightRig, SceneDocument, SceneEntry, SerializedLight, SerializedObject, StageRig } from "./types";

export interface DocumentContext {
  entries: Iterable<SceneEntry>;
  selectedId: string | null;
  playing: boolean;
  camera: THREE.PerspectiveCamera;
  target: THREE.Vector3;
  stage: StageRig;
  statsVisible: boolean;
  frustumVisible: boolean;
  motionPathVisible: boolean;
  lightRig: LightRig;
  timeline?: SceneDocument["timeline"];
}

export function createSceneDocument(context: DocumentContext): SceneDocument {
  return {
    version: 2,
    savedAt: new Date().toISOString(),
    selectedId: context.selectedId,
    playing: context.playing,
    camera: {
      position: vectorToArray(context.camera.position),
      target: vectorToArray(context.target),
      fov: context.camera.fov,
      near: context.camera.near,
      far: context.camera.far
    },
    display: {
      grid: context.stage.grid.visible,
      axes: context.stage.axes.visible,
      stats: context.statsVisible,
      frustum: context.frustumVisible,
      motionPath: context.motionPathVisible
    },
    lights: {
      active: context.lightRig.active,
      helpers: context.lightRig.helpers,
      shadows: context.lightRig.shadows,
      sweep: context.lightRig.sweep,
      ambientIntensity: context.lightRig.ambient.intensity,
      directional: serializeLight(context.lightRig.directional),
      point: serializeLight(context.lightRig.point),
      spot: serializeLight(context.lightRig.spot)
    },
    objects: Array.from(context.entries).map(serializeEntry),
    timeline: cloneTimelineDocument(context.timeline ?? createDefaultTimeline())
  };
}

export function validateSceneDocument(value: unknown): SceneDocument {
  if (!value || typeof value !== "object") throw new Error("Scene file is not an object.");
  const document = value as SceneDocument & { timeline?: unknown };
  if (document.version !== 1 && document.version !== 2) throw new Error("Unsupported scene document version.");
  if (!Array.isArray(document.objects)) throw new Error("Scene file is missing objects.");
  return {
    ...document,
    version: 2,
    timeline: normalizeTimelineDocument(document.timeline, new Set(document.objects.map((object) => object.id)))
  };
}

function serializeEntry(entry: SceneEntry): SerializedObject {
  return {
    id: entry.id,
    name: entry.name,
    kind: entry.kind,
    type: entry.type,
    renderMode: entry.renderMode,
    materialMode: entry.materialMode,
    color: `#${entry.color.getHexString()}`,
    opacity: entry.opacity,
    roughness: entry.roughness,
    metalness: entry.metalness,
    visible: entry.root.visible,
    textureName: entry.textureName === "uploaded" ? "none" : entry.textureName,
    textureRepeat: [entry.textureRepeat.x, entry.textureRepeat.y],
    textureOffset: [entry.textureOffset.x, entry.textureOffset.y],
    textureRotation: entry.textureRotation,
    animation: entry.animation,
    position: vectorToArray(entry.root.position),
    rotation: [entry.root.rotation.x, entry.root.rotation.y, entry.root.rotation.z],
    scale: vectorToArray(entry.root.scale)
  };
}

function serializeLight(light: THREE.DirectionalLight | THREE.PointLight | THREE.SpotLight): SerializedLight {
  return {
    color: `#${light.color.getHexString()}`,
    intensity: light.intensity,
    position: vectorToArray(light.position)
  };
}

function vectorToArray(vector: THREE.Vector3): [number, number, number] {
  return [round(vector.x), round(vector.y), round(vector.z)];
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
