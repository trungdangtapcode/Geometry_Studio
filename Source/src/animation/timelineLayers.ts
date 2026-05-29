import type { SceneTimelineDocument, TimelineKeyframeDocument, TimelineTrackDocument } from "../editor/types";
import {
  createTimelineKeyframe,
  ensureObjectTimeline,
  ensureTimelineTrack,
  snapTimelineTime,
  sortTimelineKeyframes
} from "./timelineSchema";

export interface VisibilityRangeResult {
  edited: number;
  skipped: number;
  currentTime: number;
  keyframeIds: string[];
}

export interface TimelineLayerRange {
  start: number;
  end: number;
}

export function setObjectVisibilityRange(
  timeline: SceneTimelineDocument,
  objectId: string,
  visibleStart: number,
  visibleEnd: number | null
): VisibilityRangeResult {
  const objectTimeline = ensureObjectTimeline(timeline, objectId);
  const existingTrack = objectTimeline.tracks.find((candidate) => candidate.kind === "objectVisibility");
  if (existingTrack?.locked) {
    return { edited: 0, skipped: 1, currentTime: timeline.currentTime, keyframeIds: [] };
  }

  const duration = Math.max(timeline.duration, 0);
  const start = snapTimelineTime(timeline, Math.min(Math.max(visibleStart, 0), duration));
  const end = visibleEnd === null ? null : snapTimelineTime(timeline, Math.min(Math.max(visibleEnd, 0), duration));
  const track = ensureTimelineTrack(objectTimeline, "objectVisibility");
  track.enabled = true;
  track.keyframes = visibilityRangeKeyframes(start, end);
  sortTimelineKeyframes(track);
  return {
    edited: track.keyframes.length,
    skipped: 0,
    currentTime: end ?? start,
    keyframeIds: track.keyframes.map((keyframe) => keyframe.id)
  };
}

export function objectLayerRange(timeline: SceneTimelineDocument, objectId: string): TimelineLayerRange | null {
  const objectTimeline = timeline.objects.find((candidate) => candidate.objectId === objectId);
  const track = objectTimeline?.tracks.find((candidate) => candidate.kind === "objectVisibility");
  if (!track?.enabled || !track.keyframes.length) return { start: 0, end: Math.max(timeline.duration, 0.001) };

  const ranges = visibleRangesFromTrack(track, timeline.duration);
  if (ranges.length === 0) return null;
  return ranges.find((range) =>
    timeline.currentTime >= range.start - 0.001 && timeline.currentTime <= range.end + 0.001
  ) ?? ranges[0];
}

function visibleRangesFromTrack(track: TimelineTrackDocument, duration: number): TimelineLayerRange[] {
  const safeDuration = Math.max(duration, 0.001);
  const keyframes = [...track.keyframes]
    .filter((keyframe) => keyframe.time >= 0 && keyframe.time <= safeDuration)
    .sort((left, right) => left.time - right.time);
  const ranges: TimelineLayerRange[] = [];
  let visible = keyframes[0]?.value[0] >= 0.5;
  let cursor = 0;

  keyframes.forEach((keyframe) => {
    const time = Math.min(Math.max(keyframe.time, 0), safeDuration);
    if (time > cursor + 0.001 && visible) ranges.push({ start: cursor, end: time });
    visible = keyframe.value[0] >= 0.5;
    cursor = time;
  });
  if (cursor < safeDuration - 0.001 && visible) ranges.push({ start: cursor, end: safeDuration });
  return ranges.filter((range) => range.end > range.start + 0.001);
}

function visibilityRangeKeyframes(start: number, end: number | null): TimelineKeyframeDocument[] {
  if (end !== null && end <= start + 0.001) {
    return [createVisibilityKeyframe(start, false)];
  }

  const keyframes: TimelineKeyframeDocument[] = [];
  if (start > 0.001) keyframes.push(createVisibilityKeyframe(0, false));
  keyframes.push(createVisibilityKeyframe(start, true));
  if (end !== null) keyframes.push(createVisibilityKeyframe(end, false));
  return keyframes;
}

function createVisibilityKeyframe(time: number, visible: boolean): TimelineKeyframeDocument {
  const keyframe = createTimelineKeyframe(time, [visible ? 1 : 0, 0, 0]);
  keyframe.interpolation = "hold";
  return keyframe;
}
