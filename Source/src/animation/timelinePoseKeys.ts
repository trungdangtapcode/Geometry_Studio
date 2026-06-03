import type { ObjectTimelineDocument, TimelineKeyframeDocument, TimelineInterpolation } from "../editor/types";
import { ensureTimelineTrack, roundTime, upsertTimelineKeyframe } from "./timelineSchema";
import type { ObjectTransformTrackKind } from "./timelineTracks";

export const timelinePoseKeyKinds = ["position", "rotation", "scale"] as const satisfies readonly ObjectTransformTrackKind[];

export interface TimelinePoseKeyClipboardTrack {
  value: [number, number, number];
  interpolation: TimelineInterpolation;
  easeStrength: number;
  easeInStrength: number;
  easeOutStrength: number;
}

export interface TimelinePoseKeyClipboard {
  sourceName: string;
  sourceTime: number;
  tracks: Record<ObjectTransformTrackKind, TimelinePoseKeyClipboardTrack>;
}

export function hasCompleteTimelinePoseKeys(objectTimeline: ObjectTimelineDocument, time: number): boolean {
  return timelinePoseKeyKinds.every((kind) => {
    const track = objectTimeline.tracks.find((candidate) => candidate.kind === kind);
    return Boolean(track && keyframeAtTime(track.keyframes, time));
  });
}

export function createTimelinePoseKeyClipboard(
  objectTimeline: ObjectTimelineDocument,
  sourceName: string,
  time: number
): TimelinePoseKeyClipboard | null {
  const tracks = {} as Record<ObjectTransformTrackKind, TimelinePoseKeyClipboardTrack>;
  for (const kind of timelinePoseKeyKinds) {
    const track = objectTimeline.tracks.find((candidate) => candidate.kind === kind);
    const keyframe = track ? keyframeAtTime(track.keyframes, time) : null;
    if (!keyframe) return null;
    tracks[kind] = {
      value: [...keyframe.value] as [number, number, number],
      interpolation: keyframe.interpolation,
      easeStrength: keyframe.easeStrength,
      easeInStrength: keyframe.easeInStrength,
      easeOutStrength: keyframe.easeOutStrength
    };
  }
  return {
    sourceName,
    sourceTime: roundTime(time),
    tracks
  };
}

export function pasteTimelinePoseKeyClipboard(
  objectTimeline: ObjectTimelineDocument,
  clipboard: TimelinePoseKeyClipboard,
  time: number
): string[] {
  const keyframeIds: string[] = [];
  for (const kind of timelinePoseKeyKinds) {
    const track = ensureTimelineTrack(objectTimeline, kind);
    const source = clipboard.tracks[kind];
    const keyframe = upsertTimelineKeyframe(track, time, source.value);
    keyframe.interpolation = source.interpolation;
    keyframe.easeStrength = source.easeStrength;
    keyframe.easeInStrength = source.easeInStrength;
    keyframe.easeOutStrength = source.easeOutStrength;
    keyframeIds.push(keyframe.id);
  }
  return keyframeIds;
}

function keyframeAtTime(keyframes: TimelineKeyframeDocument[], time: number): TimelineKeyframeDocument | null {
  return keyframes.find((keyframe) => Math.abs(keyframe.time - time) < 0.001) ?? null;
}
