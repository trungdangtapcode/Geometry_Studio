import type { PostProcessingSettings } from "../editor/types";
import type { RenderPipeline } from "./pipeline";

export const DEFAULT_POST_PROCESSING_SETTINGS: PostProcessingSettings = {
  bloom: false,
  bloomStrength: 0.42,
  bloomRadius: 0.22,
  bloomThreshold: 0.72,
  ssao: false,
  ssaoRadius: 8,
  ssaoMinDistance: 0.005,
  ssaoMaxDistance: 0.12,
  vignette: false,
  vignetteDarkness: 0.75
};

export function normalizePostProcessingSettings(value: unknown): PostProcessingSettings {
  const source = value && typeof value === "object" ? value as Partial<PostProcessingSettings> : {};
  return {
    bloom: typeof source.bloom === "boolean" ? source.bloom : DEFAULT_POST_PROCESSING_SETTINGS.bloom,
    bloomStrength: finiteNumber(source.bloomStrength, DEFAULT_POST_PROCESSING_SETTINGS.bloomStrength, 0, 2),
    bloomRadius: finiteNumber(source.bloomRadius, DEFAULT_POST_PROCESSING_SETTINGS.bloomRadius, 0, 1),
    bloomThreshold: finiteNumber(source.bloomThreshold, DEFAULT_POST_PROCESSING_SETTINGS.bloomThreshold, 0, 1),
    ssao: typeof source.ssao === "boolean" ? source.ssao : DEFAULT_POST_PROCESSING_SETTINGS.ssao,
    ssaoRadius: finiteNumber(source.ssaoRadius, DEFAULT_POST_PROCESSING_SETTINGS.ssaoRadius, 1, 32),
    ssaoMinDistance: finiteNumber(source.ssaoMinDistance, DEFAULT_POST_PROCESSING_SETTINGS.ssaoMinDistance, 0, 0.1),
    ssaoMaxDistance: finiteNumber(source.ssaoMaxDistance, DEFAULT_POST_PROCESSING_SETTINGS.ssaoMaxDistance, 0.01, 1),
    vignette: typeof source.vignette === "boolean" ? source.vignette : DEFAULT_POST_PROCESSING_SETTINGS.vignette,
    vignetteDarkness: finiteNumber(source.vignetteDarkness, DEFAULT_POST_PROCESSING_SETTINGS.vignetteDarkness, 0, 1.5)
  };
}

export function applyPostProcessingSettings(pipeline: RenderPipeline, settings: PostProcessingSettings): void {
  pipeline.ssaoPass.enabled = settings.ssao;
  pipeline.ssaoPass.kernelRadius = settings.ssaoRadius;
  pipeline.ssaoPass.minDistance = settings.ssaoMinDistance;
  pipeline.ssaoPass.maxDistance = Math.max(settings.ssaoMaxDistance, settings.ssaoMinDistance + 0.001);

  pipeline.bloomPass.enabled = settings.bloom;
  pipeline.bloomPass.strength = settings.bloomStrength;
  pipeline.bloomPass.radius = settings.bloomRadius;
  pipeline.bloomPass.threshold = settings.bloomThreshold;

  pipeline.vignettePass.enabled = settings.vignette;
  pipeline.vignettePass.uniforms.offset.value = 1.05;
  pipeline.vignettePass.uniforms.darkness.value = settings.vignetteDarkness;
}

export function postProcessingLabel(settings: PostProcessingSettings): string {
  const active = [
    settings.ssao ? "SSAO On" : "",
    settings.bloom ? "Bloom On" : "",
    settings.vignette ? "Vignette On" : ""
  ].filter(Boolean);
  return active.length > 0 ? active.join(" + ") : "Post Off";
}

function finiteNumber(value: unknown, fallback: number, min: number, max: number): number {
  const numeric = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.min(Math.max(numeric, min), max);
}
