import * as THREE from "three";
import type { LightRig, RenderSettings, RenderToneMappingMode, ShadowQuality } from "../editor/types";
import { isEnvironmentPreset } from "./environment";
import { DEFAULT_POST_PROCESSING_SETTINGS, normalizePostProcessingSettings } from "./postProcessing";

export const DEFAULT_RENDER_SETTINGS: RenderSettings = {
  toneMapping: "aces",
  exposure: 1.05,
  shadowQuality: "high",
  environment: "studio",
  postProcessing: { ...DEFAULT_POST_PROCESSING_SETTINGS }
};

const SHADOW_QUALITY: Record<ShadowQuality, { directional: number; local: number; type: THREE.ShadowMapType }> = {
  low: { directional: 512, local: 512, type: THREE.BasicShadowMap },
  medium: { directional: 1024, local: 1024, type: THREE.PCFShadowMap },
  high: { directional: 2048, local: 1024, type: THREE.PCFSoftShadowMap },
  ultra: { directional: 4096, local: 2048, type: THREE.PCFSoftShadowMap }
};

export function createDefaultRenderSettings(): RenderSettings {
  return {
    ...DEFAULT_RENDER_SETTINGS,
    postProcessing: { ...DEFAULT_RENDER_SETTINGS.postProcessing }
  };
}

export function normalizeRenderSettings(value: unknown): RenderSettings {
  const source = value && typeof value === "object" ? value as Partial<RenderSettings> : {};
  return {
    toneMapping: isToneMappingMode(source.toneMapping) ? source.toneMapping : DEFAULT_RENDER_SETTINGS.toneMapping,
    exposure: finiteNumber(source.exposure, DEFAULT_RENDER_SETTINGS.exposure, 0.1, 3),
    shadowQuality: isShadowQuality(source.shadowQuality) ? source.shadowQuality : DEFAULT_RENDER_SETTINGS.shadowQuality,
    environment: isEnvironmentPreset(source.environment) ? source.environment : DEFAULT_RENDER_SETTINGS.environment,
    postProcessing: normalizePostProcessingSettings(source.postProcessing)
  };
}

export function applyRenderSettings(renderer: THREE.WebGLRenderer, lightRig: LightRig, settings: RenderSettings): void {
  renderer.toneMapping = toneMappingConstant(settings.toneMapping);
  renderer.toneMappingExposure = settings.exposure;
  renderer.shadowMap.type = SHADOW_QUALITY[settings.shadowQuality].type;
  applyShadowQuality(lightRig, settings.shadowQuality);
}

export function toneMappingLabel(mode: RenderToneMappingMode): string {
  if (mode === "aces") return "ACES";
  if (mode === "linear") return "Linear";
  if (mode === "reinhard") return "Reinhard";
  return "None";
}

export function shadowQualityLabel(quality: ShadowQuality): string {
  if (quality === "low") return "Low";
  if (quality === "medium") return "Medium";
  if (quality === "ultra") return "Ultra";
  return "High";
}

function applyShadowQuality(lightRig: LightRig, quality: ShadowQuality): void {
  const config = SHADOW_QUALITY[quality];
  setShadowMapSize(lightRig.directional, config.directional);
  setShadowMapSize(lightRig.point, config.local);
  setShadowMapSize(lightRig.spot, config.local);
}

function setShadowMapSize(light: THREE.Light & { shadow: THREE.LightShadow }, size: number): void {
  if (light.shadow.mapSize.x === size && light.shadow.mapSize.y === size) return;
  light.shadow.map?.dispose();
  light.shadow.map = null;
  light.shadow.mapSize.set(size, size);
  light.shadow.needsUpdate = true;
}

function toneMappingConstant(mode: RenderToneMappingMode): THREE.ToneMapping {
  if (mode === "linear") return THREE.LinearToneMapping;
  if (mode === "reinhard") return THREE.ReinhardToneMapping;
  if (mode === "none") return THREE.NoToneMapping;
  return THREE.ACESFilmicToneMapping;
}

function isToneMappingMode(value: unknown): value is RenderToneMappingMode {
  return value === "aces" || value === "linear" || value === "reinhard" || value === "none";
}

function isShadowQuality(value: unknown): value is ShadowQuality {
  return value === "low" || value === "medium" || value === "high" || value === "ultra";
}

function finiteNumber(value: unknown, fallback: number, min: number, max: number): number {
  const numeric = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.min(Math.max(numeric, min), max);
}
