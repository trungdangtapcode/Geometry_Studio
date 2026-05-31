import type { SceneTimelineDocument, TimelineKeyframeDocument, TimelineTrackDocument } from "../editor/types";
import { createTimelineKeyframe, ensureTimelineTrack, sortTimelineKeyframes } from "./timelineSchema";

export interface AutoOrientResult {
  oriented: number;
  skipped: number;
  keyframeIds: string[];
}

const EPSILON = 0.0001;
const RAD_TO_DEG = 180 / Math.PI;

export function autoOrientObjectAlongPath(timeline: SceneTimelineDocument, objectId: string): AutoOrientResult {
  const objectTimeline = timeline.objects.find((candidate) => candidate.objectId === objectId);
  const positionTrack = objectTimeline?.tracks.find((track) => track.kind === "position");
  if (!objectTimeline || !positionTrack || positionTrack.keyframes.length < 2) {
    return { oriented: 0, skipped: 0, keyframeIds: [] };
  }

  const rotationTrack = ensureTimelineTrack(objectTimeline, "rotation");
  const positionKeys = [...positionTrack.keyframes].sort((left, right) => left.time - right.time);
  const keyframeIds: string[] = [];
  let skipped = 0;

  positionKeys.forEach((keyframe, index) => {
    const direction = orientationDirection(positionKeys, index);
    if (!direction) {
      skipped += 1;
      return;
    }

    const rotation = rotationFromDirection(direction);
    keyframeIds.push(upsertRotationKey(rotationTrack, keyframe.time, rotation).id);
  });

  sortTimelineKeyframes(rotationTrack);
  return { oriented: keyframeIds.length, skipped, keyframeIds };
}

function orientationDirection(keyframes: TimelineKeyframeDocument[], index: number): [number, number, number] | null {
  const current = keyframes[index];
  const previous = keyframes[index - 1] ?? null;
  const next = keyframes[index + 1] ?? null;
  const direction = next && previous
    ? subtract(next.value, previous.value)
    : next
      ? subtract(next.value, current.value)
      : previous
        ? subtract(current.value, previous.value)
        : null;

  if (!direction || lengthSquared(direction) < EPSILON) return fallbackDirection(keyframes, index);
  return direction;
}

function fallbackDirection(keyframes: TimelineKeyframeDocument[], index: number): [number, number, number] | null {
  for (let offset = 1; offset < keyframes.length; offset += 1) {
    const next = keyframes[index + offset];
    if (next) {
      const direction = subtract(next.value, keyframes[index].value);
      if (lengthSquared(direction) >= EPSILON) return direction;
    }

    const previous = keyframes[index - offset];
    if (previous) {
      const direction = subtract(keyframes[index].value, previous.value);
      if (lengthSquared(direction) >= EPSILON) return direction;
    }
  }
  return null;
}

function rotationFromDirection(direction: [number, number, number]): [number, number, number] {
  const [x, y, z] = direction;
  const horizontalLength = Math.hypot(x, z);
  const pitch = -Math.atan2(y, horizontalLength) * RAD_TO_DEG;
  const yaw = Math.atan2(x, z) * RAD_TO_DEG;
  return [roundAngle(pitch), roundAngle(yaw), 0];
}

function upsertRotationKey(track: TimelineTrackDocument, time: number, value: [number, number, number]): TimelineKeyframeDocument {
  const existing = track.keyframes.find((keyframe) => Math.abs(keyframe.time - time) < 0.001);
  if (existing) {
    existing.value = value;
    return existing;
  }

  const keyframe = createTimelineKeyframe(time, value);
  track.keyframes.push(keyframe);
  return keyframe;
}

function subtract(right: [number, number, number], left: [number, number, number]): [number, number, number] {
  return [right[0] - left[0], right[1] - left[1], right[2] - left[2]];
}

function lengthSquared(value: [number, number, number]): number {
  return value[0] * value[0] + value[1] * value[1] + value[2] * value[2];
}

function roundAngle(value: number): number {
  return Math.round(value * 1000) / 1000;
}
