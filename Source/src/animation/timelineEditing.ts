import type {
  SceneTimelineDocument,
  TimelineInterpolation,
  TimelineKeyframeDocument,
  TimelineTrackDocument,
  TimelineTrackKind
} from "../editor/types";
import {
  createTimelineKeyframe,
  ensureCameraTimeline,
  ensureLightTimeline,
  ensureObjectTimeline,
  ensureTimelineTrack,
  roundTime,
  snapTimelineTime,
  sortTimelineKeyframes
} from "./timelineSchema";

export type TimelineKeyframeScope = "object" | "camera" | "lights";

export interface TimelineKeyframeSource {
  scope: TimelineKeyframeScope;
  objectId: string;
  track: TimelineTrackDocument;
  keyframe: TimelineKeyframeDocument;
}

export interface TimelineClipboardKeyframe {
  scope: TimelineKeyframeScope;
  kind: TimelineTrackKind;
  relativeTime: number;
  value: [number, number, number];
  interpolation: TimelineInterpolation;
}

export interface TimelineClipboard {
  keyframes: TimelineClipboardKeyframe[];
}

export interface TimelineSourceFallback {
  selectedTrackKind: TimelineTrackKind;
  selectedObjectId: string | null;
  currentTime: number;
}

export interface TimelineEditResult {
  changedTransformObjectIds: string[];
  skipped: number;
}

export interface PasteTimelineResult extends TimelineEditResult {
  pasted: number;
}

export interface DuplicateTimelineResult extends TimelineEditResult {
  created: number;
}

export interface NudgeTimelineResult extends TimelineEditResult {
  nudged: number;
  currentTime: number;
}

const TRANSFORM_TRACK_KINDS = new Set<TimelineTrackKind>(["position", "rotation", "scale"]);

export function resolveTimelineKeyframeSources(
  timeline: SceneTimelineDocument,
  keyframeIds: string[],
  fallback: TimelineSourceFallback
): TimelineKeyframeSource[] {
  const sources: TimelineKeyframeSource[] = [];
  const ids = new Set(keyframeIds);
  if (ids.size > 0) {
    collectKeyframesById(timeline.camera.tracks, ids, "camera", "camera", sources);
    collectKeyframesById(timeline.lights.tracks, ids, "lights", "lights", sources);
    timeline.objects.forEach((objectTimeline) => {
      collectKeyframesById(objectTimeline.tracks, ids, "object", objectTimeline.objectId, sources);
    });
    return sources;
  }

  const selectedTrack = fallback.selectedTrackKind;
  if (isCameraTrackKind(selectedTrack)) {
    pushPlayheadSource(timeline.camera.tracks, selectedTrack, fallback.currentTime, "camera", "camera", sources);
    return sources;
  }
  if (isLightTrackKind(selectedTrack)) {
    pushPlayheadSource(timeline.lights.tracks, selectedTrack, fallback.currentTime, "lights", "lights", sources);
    return sources;
  }
  if (!fallback.selectedObjectId) return sources;
  const objectTimeline = timeline.objects.find((candidate) => candidate.objectId === fallback.selectedObjectId);
  if (!objectTimeline) return sources;
  pushPlayheadSource(objectTimeline.tracks, selectedTrack, fallback.currentTime, "object", fallback.selectedObjectId, sources);
  return sources;
}

export function createTimelineClipboard(sources: TimelineKeyframeSource[]): TimelineClipboard {
  const origin = Math.min(...sources.map((source) => source.keyframe.time));
  return {
    keyframes: sources.map(({ scope, track, keyframe }) => ({
      scope,
      kind: track.kind,
      relativeTime: roundTime(keyframe.time - origin),
      value: [...keyframe.value] as [number, number, number],
      interpolation: keyframe.interpolation
    }))
  };
}

export function pasteTimelineClipboard(
  timeline: SceneTimelineDocument,
  clipboard: TimelineClipboard,
  selectedObjectId: string | null,
  baseTime: number
): PasteTimelineResult {
  let pasted = 0;
  let skipped = 0;
  const changedTransformObjectIds = new Set<string>();

  clipboard.keyframes.forEach((clip) => {
    const rawTime = baseTime + clip.relativeTime;
    if (rawTime > timeline.duration + 0.001) {
      skipped += 1;
      return;
    }
    const time = snapTimelineTime(timeline, rawTime);
    const track = pasteTargetTrack(timeline, clip, selectedObjectId);
    if (!track) {
      skipped += 1;
      return;
    }

    track.enabled = true;
    const existing = track.keyframes.find((keyframe) => Math.abs(keyframe.time - time) < 0.001);
    if (existing) {
      existing.value = [...clip.value] as [number, number, number];
      existing.interpolation = clip.interpolation;
    } else {
      const pastedKeyframe = createTimelineKeyframe(time, [...clip.value] as [number, number, number]);
      pastedKeyframe.interpolation = clip.interpolation;
      track.keyframes.push(pastedKeyframe);
    }
    sortTimelineKeyframes(track);
    if (selectedObjectId && clip.scope === "object" && isTransformTrackKind(clip.kind)) changedTransformObjectIds.add(selectedObjectId);
    pasted += 1;
  });

  return { pasted, skipped, changedTransformObjectIds: [...changedTransformObjectIds] };
}

export function duplicateResolvedKeyframes(
  timeline: SceneTimelineDocument,
  sources: TimelineKeyframeSource[]
): DuplicateTimelineResult {
  const offset = Math.max(timeline.snapEnabled ? timeline.snapStep : 1 / timeline.fps, 0.001);
  let created = 0;
  let skipped = 0;
  const changedTransformObjectIds = new Set<string>();

  sources.forEach(({ scope, objectId, track, keyframe }) => {
    const nextTime = nextAvailableKeyframeTime(timeline, track, keyframe.time + offset, offset);
    if (nextTime === null) {
      skipped += 1;
      return;
    }
    const duplicate = createTimelineKeyframe(nextTime, [...keyframe.value] as [number, number, number]);
    duplicate.interpolation = keyframe.interpolation;
    track.keyframes.push(duplicate);
    sortTimelineKeyframes(track);
    if (scope === "object" && isTransformTrackKind(track.kind)) changedTransformObjectIds.add(objectId);
    created += 1;
  });

  return { created, skipped, changedTransformObjectIds: [...changedTransformObjectIds] };
}

export function nudgeResolvedKeyframes(
  timeline: SceneTimelineDocument,
  sources: TimelineKeyframeSource[],
  direction: -1 | 1
): NudgeTimelineResult {
  const offset = 1 / Math.max(timeline.fps, 1);
  const movingIds = new Set(sources.map((source) => source.keyframe.id));
  const updates = sources
    .map((source) => ({
      source,
      time: roundTime(source.keyframe.time + direction * offset)
    }))
    .filter(({ source, time }) =>
      time >= 0 &&
      time <= timeline.duration &&
      !source.track.keyframes.some((keyframe) => !movingIds.has(keyframe.id) && Math.abs(keyframe.time - time) < 0.001)
    );

  const changedTracks = new Set<TimelineTrackDocument>();
  const changedTransformObjectIds = new Set<string>();
  updates.forEach(({ source, time }) => {
    source.keyframe.time = time;
    changedTracks.add(source.track);
    if (source.scope === "object" && isTransformTrackKind(source.track.kind)) changedTransformObjectIds.add(source.objectId);
  });
  changedTracks.forEach(sortTimelineKeyframes);

  return {
    nudged: updates.length,
    skipped: sources.length - updates.length,
    currentTime: updates.length ? Math.min(...updates.map((update) => update.time)) : timeline.currentTime,
    changedTransformObjectIds: [...changedTransformObjectIds]
  };
}

function collectKeyframesById(
  tracks: TimelineTrackDocument[],
  ids: Set<string>,
  scope: TimelineKeyframeScope,
  objectId: string,
  sources: TimelineKeyframeSource[]
): void {
  tracks.forEach((track) => {
    track.keyframes.forEach((keyframe) => {
      if (ids.has(keyframe.id)) sources.push({ scope, objectId, track, keyframe });
    });
  });
}

function pushPlayheadSource(
  tracks: TimelineTrackDocument[],
  kind: TimelineTrackKind,
  currentTime: number,
  scope: TimelineKeyframeScope,
  objectId: string,
  sources: TimelineKeyframeSource[]
): void {
  const track = tracks.find((candidate) => candidate.kind === kind);
  const keyframe = track?.keyframes.find((candidate) => Math.abs(candidate.time - currentTime) < 0.001);
  if (track && keyframe) sources.push({ scope, objectId, track, keyframe });
}

function pasteTargetTrack(
  timeline: SceneTimelineDocument,
  clip: TimelineClipboardKeyframe,
  selectedObjectId: string | null
): TimelineTrackDocument | null {
  if (clip.scope === "camera") return ensureTimelineTrack(ensureCameraTimeline(timeline), clip.kind);
  if (clip.scope === "lights") return ensureTimelineTrack(ensureLightTimeline(timeline), clip.kind);
  if (!selectedObjectId) return null;
  return ensureTimelineTrack(ensureObjectTimeline(timeline, selectedObjectId), clip.kind);
}

function nextAvailableKeyframeTime(timeline: SceneTimelineDocument, track: TimelineTrackDocument, startTime: number, offset: number): number | null {
  let candidate = snapTimelineTime(timeline, startTime);
  while (candidate <= timeline.duration) {
    const occupied = track.keyframes.some((keyframe) => Math.abs(keyframe.time - candidate) < 0.001);
    if (!occupied) return candidate;
    candidate = snapTimelineTime(timeline, candidate + offset);
    if (timeline.duration - candidate < 0.001) break;
  }
  return null;
}

function isTransformTrackKind(kind: TimelineTrackKind): boolean {
  return TRANSFORM_TRACK_KINDS.has(kind);
}

function isCameraTrackKind(kind: TimelineTrackKind): boolean {
  return kind === "cameraPosition" || kind === "cameraTarget" || kind === "cameraLens";
}

function isLightTrackKind(kind: TimelineTrackKind): boolean {
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
