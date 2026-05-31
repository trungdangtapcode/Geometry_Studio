import * as THREE from "three";
import type { SceneEntry } from "../editor/types";
import type { ResourceTracker } from "../utils/resourceTracker";

const OUTLINE_THICKNESS = 0.035;

export function createToonMaterial(entry: SceneEntry, tracker?: ResourceTracker, sourceMaterial?: THREE.Material): THREE.MeshToonMaterial {
  const source = materialRecord(sourceMaterial);
  const map = cloneTexture((source.map as THREE.Texture | undefined) ?? entry.texture ?? null, tracker);
  const alphaMap = cloneTexture(source.alphaMap as THREE.Texture | undefined, tracker);
  const normalMap = cloneTexture(source.normalMap as THREE.Texture | undefined, tracker);
  const params: THREE.MeshToonMaterialParameters = {
    color: sourceColor(sourceMaterial, entry.color),
    gradientMap: createToonGradientMap(tracker),
    side: THREE.DoubleSide,
    transparent: sourceTransparent(sourceMaterial, entry.opacity),
    opacity: sourceOpacity(sourceMaterial, entry.opacity)
  };
  if (map) params.map = map;
  if (alphaMap) params.alphaMap = alphaMap;
  if (normalMap) params.normalMap = normalMap;
  const material = new THREE.MeshToonMaterial(params);
  copyNormalScale(material, sourceMaterial);
  return tracker?.track(material) ?? material;
}

export function cloneReadableSourceMaterial(material: THREE.Material, tracker?: ResourceTracker): THREE.Material {
  if (isUnlitMaterial(material)) return createLitSourceMaterial(material, tracker);
  const clone = material.clone();
  cloneTextureSlots(clone, tracker);
  return tracker?.track(clone) ?? clone;
}

export function cloneToonSourceMaterial(material: THREE.Material, entry: SceneEntry, tracker?: ResourceTracker): THREE.Material {
  return createToonMaterial(entry, tracker, material);
}

export function createToonOutlineMesh(geometry: THREE.BufferGeometry, tracker?: ResourceTracker): THREE.Mesh {
  if (!geometry.getAttribute("normal")) geometry.computeVertexNormals();
  const outlineGeometry = tracker?.track(geometry.clone()) ?? geometry.clone();
  const outlineMaterial = new THREE.ShaderMaterial({
    uniforms: {
      outlineColor: { value: new THREE.Color("#07090d") },
      outlineAlpha: { value: 1 },
      outlineThickness: { value: OUTLINE_THICKNESS }
    },
    vertexShader: `
      uniform float outlineThickness;
      void main() {
        vec3 expanded = position + normalize(normal) * outlineThickness;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(expanded, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 outlineColor;
      uniform float outlineAlpha;
      void main() {
        gl_FragColor = vec4(outlineColor, outlineAlpha);
      }
    `,
    side: THREE.BackSide,
    transparent: true,
    depthWrite: false
  });
  const material = tracker?.track(outlineMaterial) ?? outlineMaterial;
  const outline = new THREE.Mesh(outlineGeometry, material);
  outline.name = "Ink Outline";
  outline.userData.stylizedOutline = true;
  outline.castShadow = false;
  outline.receiveShadow = false;
  outline.renderOrder = -1;
  return outline;
}

function createLitSourceMaterial(material: THREE.Material, tracker?: ResourceTracker): THREE.MeshStandardMaterial {
  const source = materialRecord(material);
  const params: THREE.MeshStandardMaterialParameters = {
    color: sourceColor(material, new THREE.Color("#d8dadf")),
    roughness: typeof source.roughness === "number" ? source.roughness : 0.55,
    metalness: typeof source.metalness === "number" ? source.metalness : 0.02,
    side: material.side,
    transparent: sourceTransparent(material, 1),
    opacity: sourceOpacity(material, 1)
  };
  const map = cloneTexture(source.map as THREE.Texture | undefined, tracker);
  const alphaMap = cloneTexture(source.alphaMap as THREE.Texture | undefined, tracker);
  const normalMap = cloneTexture(source.normalMap as THREE.Texture | undefined, tracker);
  const emissiveMap = cloneTexture(source.emissiveMap as THREE.Texture | undefined, tracker);
  if (map) params.map = map;
  if (alphaMap) params.alphaMap = alphaMap;
  if (normalMap) params.normalMap = normalMap;
  if (emissiveMap) params.emissiveMap = emissiveMap;
  const readable = new THREE.MeshStandardMaterial(params);
  if (source.emissive instanceof THREE.Color) readable.emissive.copy(source.emissive);
  copyNormalScale(readable, material);
  return tracker?.track(readable) ?? readable;
}

function createToonGradientMap(tracker?: ResourceTracker): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = 4;
  canvas.height = 1;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas textures are unavailable.");
  ["#242424", "#666666", "#b4b4b4", "#ffffff"].forEach((color, index) => {
    ctx.fillStyle = color;
    ctx.fillRect(index, 0, 1, 1);
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return tracker?.track(texture) ?? texture;
}

function cloneTexture(texture: THREE.Texture | null | undefined, tracker?: ResourceTracker): THREE.Texture | null {
  if (!texture) return null;
  const clone = texture.clone();
  clone.needsUpdate = true;
  return tracker?.track(clone) ?? clone;
}

function cloneTextureSlots(material: THREE.Material, tracker?: ResourceTracker): void {
  const textureSlots = [
    "alphaMap",
    "aoMap",
    "bumpMap",
    "clearcoatMap",
    "clearcoatNormalMap",
    "clearcoatRoughnessMap",
    "displacementMap",
    "emissiveMap",
    "envMap",
    "lightMap",
    "map",
    "metalnessMap",
    "normalMap",
    "roughnessMap",
    "sheenColorMap",
    "sheenRoughnessMap",
    "specularColorMap",
    "specularIntensityMap",
    "transmissionMap"
  ];
  const record = materialRecord(material);
  textureSlots.forEach((slot) => {
    const value = record[slot];
    if (value instanceof THREE.Texture) record[slot] = cloneTexture(value, tracker);
  });
}

function copyNormalScale(target: THREE.Material, source?: THREE.Material): void {
  const sourceScale = materialRecord(source).normalScale;
  const targetScale = materialRecord(target).normalScale;
  if (sourceScale instanceof THREE.Vector2 && targetScale instanceof THREE.Vector2) {
    targetScale.copy(sourceScale);
  }
}

function sourceColor(material: THREE.Material | undefined, fallback: THREE.Color): THREE.Color {
  const color = materialRecord(material).color;
  return color instanceof THREE.Color ? color.clone() : fallback.clone();
}

function sourceOpacity(material: THREE.Material | undefined, fallback: number): number {
  const opacity = materialRecord(material).opacity;
  return typeof opacity === "number" ? opacity : fallback;
}

function sourceTransparent(material: THREE.Material | undefined, fallbackOpacity: number): boolean {
  return Boolean(material?.transparent) || sourceOpacity(material, fallbackOpacity) < 1;
}

function isUnlitMaterial(material: THREE.Material): boolean {
  return Boolean((material as THREE.MeshBasicMaterial).isMeshBasicMaterial);
}

function materialRecord(material?: THREE.Material): Record<string, unknown> {
  return (material ?? {}) as Record<string, unknown>;
}
