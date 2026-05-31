import type { PostProcessingSettings } from "../editor/types";
import type { RenderPipeline } from "./pipeline";

export const DEFAULT_POST_PROCESSING_SETTINGS: PostProcessingSettings = {
  fxaa: false,
  dof: false,
  dofFocus: 8,
  dofAperture: 0.025,
  dofMaxBlur: 0.012,
  bloom: false,
  bloomStrength: 0.42,
  bloomRadius: 0.22,
  bloomThreshold: 0.72,
  ssao: false,
  ssaoRadius: 8,
  ssaoMinDistance: 0.005,
  ssaoMaxDistance: 0.12,
  vignette: false,
  vignetteDarkness: 0.75,
  halftone: false,
  halftoneRadius: 3,
  halftoneScatter: 0.35
};

export function normalizePostProcessingSettings(value: unknown): PostProcessingSettings {
  const source = value && typeof value === "object" ? value as Partial<PostProcessingSettings> : {};
  return {
    fxaa: typeof source.fxaa === "boolean" ? source.fxaa : DEFAULT_POST_PROCESSING_SETTINGS.fxaa,
    dof: typeof source.dof === "boolean" ? source.dof : DEFAULT_POST_PROCESSING_SETTINGS.dof,
    dofFocus: finiteNumber(source.dofFocus, DEFAULT_POST_PROCESSING_SETTINGS.dofFocus, 0.1, 80),
    dofAperture: finiteNumber(source.dofAperture, DEFAULT_POST_PROCESSING_SETTINGS.dofAperture, 0, 0.2),
    dofMaxBlur: finiteNumber(source.dofMaxBlur, DEFAULT_POST_PROCESSING_SETTINGS.dofMaxBlur, 0, 0.08),
    bloom: typeof source.bloom === "boolean" ? source.bloom : DEFAULT_POST_PROCESSING_SETTINGS.bloom,
    bloomStrength: finiteNumber(source.bloomStrength, DEFAULT_POST_PROCESSING_SETTINGS.bloomStrength, 0, 2),
    bloomRadius: finiteNumber(source.bloomRadius, DEFAULT_POST_PROCESSING_SETTINGS.bloomRadius, 0, 1),
    bloomThreshold: finiteNumber(source.bloomThreshold, DEFAULT_POST_PROCESSING_SETTINGS.bloomThreshold, 0, 1),
    ssao: typeof source.ssao === "boolean" ? source.ssao : DEFAULT_POST_PROCESSING_SETTINGS.ssao,
    ssaoRadius: finiteNumber(source.ssaoRadius, DEFAULT_POST_PROCESSING_SETTINGS.ssaoRadius, 1, 32),
    ssaoMinDistance: finiteNumber(source.ssaoMinDistance, DEFAULT_POST_PROCESSING_SETTINGS.ssaoMinDistance, 0, 0.1),
    ssaoMaxDistance: finiteNumber(source.ssaoMaxDistance, DEFAULT_POST_PROCESSING_SETTINGS.ssaoMaxDistance, 0.01, 1),
    vignette: typeof source.vignette === "boolean" ? source.vignette : DEFAULT_POST_PROCESSING_SETTINGS.vignette,
    vignetteDarkness: finiteNumber(source.vignetteDarkness, DEFAULT_POST_PROCESSING_SETTINGS.vignetteDarkness, 0, 1.5),
    halftone: typeof source.halftone === "boolean" ? source.halftone : DEFAULT_POST_PROCESSING_SETTINGS.halftone,
    halftoneRadius: finiteNumber(source.halftoneRadius, DEFAULT_POST_PROCESSING_SETTINGS.halftoneRadius, 1, 12),
    halftoneScatter: finiteNumber(source.halftoneScatter, DEFAULT_POST_PROCESSING_SETTINGS.halftoneScatter, 0, 2)
  };
}

export function applyPostProcessingSettings(pipeline: RenderPipeline, settings: PostProcessingSettings): void {
  pipeline.setPixelBudget(postProcessingPixelBudget(settings));
  pipeline.fxaaPass.enabled = settings.fxaa;

  pipeline.bokehPass.enabled = settings.dof && pipeline.heavyPostProcessingSupported;
  const bokehUniforms = pipeline.bokehPass.uniforms as Record<"focus" | "aperture" | "maxblur", { value: number }>;
  bokehUniforms.focus.value = settings.dofFocus;
  bokehUniforms.aperture.value = settings.dofAperture;
  bokehUniforms.maxblur.value = settings.dofMaxBlur;

  pipeline.ssaoPass.enabled = settings.ssao && pipeline.heavyPostProcessingSupported;
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

  pipeline.halftonePass.enabled = settings.halftone;
  pipeline.halftonePass.uniforms.radius.value = settings.halftoneRadius;
  pipeline.halftonePass.uniforms.scatter.value = settings.halftoneScatter;
}

export function postProcessingLabel(settings: PostProcessingSettings): string {
  const active = [
    settings.fxaa ? "FXAA On" : "",
    settings.dof ? "DOF On" : "",
    settings.ssao ? "SSAO On" : "",
    settings.bloom ? "Bloom On" : "",
    settings.vignette ? "Vignette On" : "",
    settings.halftone ? "Comic Halftone On" : ""
  ].filter(Boolean);
  return active.length > 0 ? active.join(" + ") : "Post Off";
}

function postProcessingPixelBudget(settings: PostProcessingSettings): number {
  if (settings.dof || settings.ssao) return 640 * 360;
  if (settings.bloom || settings.halftone) return 1280 * 720;
  return 2560 * 1440;
}

function finiteNumber(value: unknown, fallback: number, min: number, max: number): number {
  const numeric = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.min(Math.max(numeric, min), max);
}
