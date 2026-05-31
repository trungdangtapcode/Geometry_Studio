import type { TimelineTrackDocument } from "../editor/types";
import { timelineInterpolationWeight } from "./timelineInterpolation";

export function evaluateTimelineTrack(track: TimelineTrackDocument, time: number): [number, number, number] | null {
  if (!track.enabled) return null;
  const keyframes = [...track.keyframes].sort((left, right) => left.time - right.time);
  if (keyframes.length === 0) return null;
  const exact = keyframes.find((keyframe) => Math.abs(keyframe.time - time) < 0.001);
  if (exact) return [...exact.value] as [number, number, number];
  if (time <= keyframes[0].time) return [...keyframes[0].value] as [number, number, number];
  const last = keyframes[keyframes.length - 1];
  if (time >= last.time) return [...last.value] as [number, number, number];
  const rightIndex = keyframes.findIndex((keyframe) => keyframe.time >= time);
  const left = keyframes[rightIndex - 1];
  const right = keyframes[rightIndex];
  if (!left || !right) return [...last.value] as [number, number, number];
  if (left.interpolation === "hold") return [...left.value] as [number, number, number];
  const span = Math.max(right.time - left.time, 0.001);
  const rawT = clamp((time - left.time) / span, 0, 1);
  const t = timelineInterpolationWeight(left.interpolation, rawT);
  return [
    left.value[0] + (right.value[0] - left.value[0]) * t,
    left.value[1] + (right.value[1] - left.value[1]) * t,
    left.value[2] + (right.value[2] - left.value[2]) * t
  ];
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
