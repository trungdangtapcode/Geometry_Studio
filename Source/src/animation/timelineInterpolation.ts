import type { TimelineInterpolation } from "../editor/types";

export const TIMELINE_INTERPOLATIONS: TimelineInterpolation[] = [
  "linear",
  "easeIn",
  "easeOut",
  "smooth",
  "backIn",
  "backOut",
  "hold"
];

export function isTimelineInterpolation(value: unknown): value is TimelineInterpolation {
  return typeof value === "string" && (TIMELINE_INTERPOLATIONS as string[]).includes(value);
}

export function timelineInterpolationLabel(interpolation: TimelineInterpolation): string {
  if (interpolation === "hold") return "Hold";
  if (interpolation === "easeIn") return "Ease In";
  if (interpolation === "easeOut") return "Ease Out";
  if (interpolation === "smooth") return "Easy Ease";
  if (interpolation === "backIn") return "Back In";
  if (interpolation === "backOut") return "Back Out";
  return "Linear";
}

export function timelineInterpolationPath(interpolation: TimelineInterpolation): string {
  if (interpolation === "hold") return "M4 28 H40 V6 H68";
  if (interpolation === "easeIn") return "M4 28 C30 28 46 18 68 6";
  if (interpolation === "easeOut") return "M4 28 C26 16 42 6 68 6";
  if (interpolation === "smooth") return "M4 28 C20 28 22 6 36 17 C50 28 52 6 68 6";
  if (interpolation === "backIn") return "M4 28 C20 34 34 34 68 6";
  if (interpolation === "backOut") return "M4 28 C38 0 52 0 68 6";
  return "M4 28 L68 6";
}

export function timelineInterpolationWeight(interpolation: TimelineInterpolation, value: number, easeStrength = 1): number {
  const t = clamp(value, 0, 1);
  const strength = clamp(easeStrength, 0, 2);
  if (interpolation === "hold" || interpolation === "linear") return t;
  const curved = interpolationCurve(interpolation, t);
  return t + (curved - t) * strength;
}

function interpolationCurve(interpolation: TimelineInterpolation, value: number): number {
  if (interpolation === "easeIn") return value * value;
  if (interpolation === "easeOut") return 1 - (1 - value) * (1 - value);
  if (interpolation === "smooth") return smoothstep(value);
  if (interpolation === "backIn") return backIn(value);
  if (interpolation === "backOut") return backOut(value);
  return value;
}

function smoothstep(value: number): number {
  return value * value * (3 - 2 * value);
}

function backIn(value: number): number {
  const overshoot = 1.70158;
  return value * value * ((overshoot + 1) * value - overshoot);
}

function backOut(value: number): number {
  const overshoot = 1.70158;
  const shifted = value - 1;
  return shifted * shifted * ((overshoot + 1) * shifted + overshoot) + 1;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
