import * as THREE from "three";

export type PrimitiveType =
  | "cube"
  | "sphere"
  | "cone"
  | "cylinder"
  | "torus"
  | "teapot"
  | "torusKnot"
  | "tetrahedron"
  | "octahedron"
  | "dodecahedron"
  | "icosahedron"
  | "tube"
  | "parametric"
  | "extrude";

export type RenderMode = "solid" | "points" | "lines";
export type MaterialMode = "standard" | "basic" | "phong" | "normal" | "lambert";
export type AnimationMode = "none" | "spin" | "orbit" | "bounce" | "pulse";
export type LightKind = "directional" | "point" | "spot";
export type ObjectKind = "primitive" | "model" | "sampleModel";
export type ToastTone = "good" | "bad";

export interface SceneEntry {
  id: string;
  name: string;
  kind: ObjectKind;
  type: PrimitiveType | "model";
  root: THREE.Group;
  sourceGeometry?: THREE.BufferGeometry;
  sourceObject?: THREE.Object3D;
  renderMode: RenderMode;
  materialMode: MaterialMode;
  color: THREE.Color;
  texture: THREE.Texture | null;
  textureName: string;
  textureRepeat: THREE.Vector2;
  animation: AnimationMode;
  basePosition: THREE.Vector3;
  baseScale: THREE.Vector3;
  phase: number;
}

export interface LightRig {
  ambient: THREE.AmbientLight;
  directional: THREE.DirectionalLight;
  point: THREE.PointLight;
  spot: THREE.SpotLight;
  directionalHelper: THREE.DirectionalLightHelper;
  pointHelper: THREE.PointLightHelper;
  spotHelper: THREE.SpotLightHelper;
  active: LightKind;
  helpers: boolean;
  shadows: boolean;
  sweep: boolean;
}

export interface StageRig {
  ground: THREE.Mesh;
  grid: THREE.GridHelper;
  axes: THREE.AxesHelper;
}

export interface LoadingStatus {
  phase: "idle" | "loading" | "complete" | "error";
  label: string;
  progress: number;
}

export interface SceneDocument {
  version: 1;
  savedAt: string;
  selectedId: string | null;
  playing: boolean;
  camera: {
    position: [number, number, number];
    target: [number, number, number];
    fov: number;
    near: number;
    far: number;
  };
  display: {
    grid: boolean;
    axes: boolean;
    stats: boolean;
    frustum: boolean;
  };
  lights: {
    active: LightKind;
    helpers: boolean;
    shadows: boolean;
    sweep: boolean;
    ambientIntensity: number;
    directional: SerializedLight;
    point: SerializedLight;
    spot: SerializedLight;
  };
  objects: SerializedObject[];
}

export interface SerializedLight {
  color: string;
  intensity: number;
  position: [number, number, number];
}

export interface SerializedObject {
  id: string;
  name: string;
  kind: ObjectKind;
  type: PrimitiveType | "model";
  renderMode: RenderMode;
  materialMode: MaterialMode;
  color: string;
  textureName: string;
  textureRepeat: [number, number];
  animation: AnimationMode;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}
