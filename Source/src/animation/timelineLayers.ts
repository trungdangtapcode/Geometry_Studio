import type { SceneTimelineDocument, TimelineKeyframeDocument, TimelineTrackDocument } from "../editor/types";
import {
  createTimelineKeyframe,
  ensureObjectTimeline,
  ensureTimelineTrack,
  roundTime,
  snapTimelineTime,
  sortTimelineKeyframes
} from "./timelineSchema";
import { isObjectTransformTrackKind } from "./timelineTracks";

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

export interface ShiftLayerKeyframesResult {
  shifted: number;
  skipped: number;
  keyframeIds: string[];
  changedTransformObjectIds: string[];
}

export interface SequenceLayerRangesResult {
  sequenced: number;
  skipped: number;
  shifted: number;
  shiftSkipped: number;
  start: number;
  end: number;
  keyframeIds: string[];
  shiftedKeyframeIds: string[];
  changedTransformObjectIds: string[];
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
  const ranges = objectLayerRanges(timeline, objectId);
  if (ranges.length === 0) return null;
  return ranges.find((range) =>
    timeline.currentTime >= range.start - 0.001 && timeline.currentTime <= range.end + 0.001
  ) ?? ranges[0];
}

export function objectLayerRanges(timeline: SceneTimelineDocument, objectId: string): TimelineLayerRange[] {
  const objectTimeline = timeline.objects.find((candidate) => candidate.objectId === objectId);
  const track = objectTimeline?.tracks.find((candidate) => candidate.kind === "objectVisibility");
  if (!track?.enabled || !track.keyframes.length) return [{ start: 0, end: Math.max(timeline.duration, 0.001) }];

  return visibleRangesFromTrack(track, timeline.duration);
}

export function objectLayerKeyframeIds(timeline: SceneTimelineDocument, objectId: string): string[] {
  const range = objectLayerRange(timeline, objectId);
  const objectTimeline = timeline.objects.find((candidate) => candidate.objectId === objectId);
  if (!range || !objectTimeline) return [];

  return objectTimeline.tracks.flatMap((track) =>
    track.keyframes
      .filter((keyframe) => keyframe.time >= range.start - 0.001 && keyframe.time <= range.end + 0.001)
      .map((keyframe) => keyframe.id)
  );
}

export function sequenceObjectLayerRanges(
  timeline: SceneTimelineDocument,
  objectIds: string[],
  startTime: number,
  maxDuration = 120
): SequenceLayerRangesResult {
  const uniqueObjectIds = [...new Set(objectIds)];
  const minimumSpan = Math.max(Math.min(timeline.snapStep || 1 / Math.max(timeline.fps, 1), 0.25), 0.001);
  const start = snapTimelineTime(timeline, Math.min(Math.max(startTime, 0), maxDuration));
  const planned = uniqueObjectIds.map((objectId) => {
    const objectTimeline = timeline.objects.find((candidate) => candidate.objectId === objectId);
    const visibilityTrack = objectTimeline?.tracks.find((track) => track.kind === "objectVisibility");
    const range = objectLayerRange(timeline, objectId) ?? { start: 0, end: Math.max(timeline.duration, minimumSpan) };
    const span = Math.max(range.end - range.start, minimumSpan);
    return { objectId, range, span, locked: Boolean(visibilityTrack?.locked) };
  });
  const eligible = planned.filter((item) => !item.locked);
  const initiallySkipped = planned.length - eligible.length;
  if (eligible.length === 0) {
    return {
      sequenced: 0,
      skipped: initiallySkipped,
      shifted: 0,
      shiftSkipped: 0,
      start,
      end: start,
      keyframeIds: [],
      shiftedKeyframeIds: [],
      changedTransformObjectIds: []
    };
  }

  const plannedEnd = roundTime(eligible.reduce((cursor, item) => cursor + item.span, start));
  const targetDuration = Math.min(maxDuration, Math.max(timeline.duration, plannedEnd, minimumSpan));
  timeline.duration = targetDuration;
  timeline.currentTime = Math.min(Math.max(timeline.currentTime, 0), timeline.duration);
  timeline.workStart = Math.min(Math.max(timeline.workStart, 0), Math.max(timeline.duration - 0.001, 0));
  timeline.workEnd = Math.min(Math.max(timeline.workEnd, timeline.workStart + 0.001), timeline.duration);

  const keyframeIds: string[] = [];
  const shiftedKeyframeIds: string[] = [];
  const changedTransformObjectIds = new Set<string>();
  let shifted = 0;
  let shiftSkipped = 0;
  let sequenced = 0;
  let skipped = initiallySkipped;
  let cursor = start;

  eligible.forEach((item) => {
    if (cursor >= timeline.duration - minimumSpan) {
      skipped += 1;
      return;
    }

    const nextStart = roundTime(cursor);
    const nextEnd = roundTime(Math.min(nextStart + item.span, timeline.duration));
    if (nextEnd <= nextStart + 0.001) {
      skipped += 1;
      return;
    }

    const shiftResult = shiftObjectLayerKeyframes(timeline, item.objectId, nextStart - item.range.start);
    const visibilityResult = setObjectVisibilityRange(
      timeline,
      item.objectId,
      nextStart,
      nextEnd >= timeline.duration - 0.001 ? null : nextEnd
    );
    keyframeIds.push(...visibilityResult.keyframeIds);
    shiftedKeyframeIds.push(...shiftResult.keyframeIds);
    shiftResult.changedTransformObjectIds.forEach((objectId) => changedTransformObjectIds.add(objectId));
    shifted += shiftResult.shifted;
    shiftSkipped += shiftResult.skipped;
    sequenced += 1;
    cursor = nextEnd;
  });

  return {
    sequenced,
    skipped,
    shifted,
    shiftSkipped,
    start,
    end: cursor,
    keyframeIds,
    shiftedKeyframeIds,
    changedTransformObjectIds: [...changedTransformObjectIds]
  };
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

export function shiftObjectLayerKeyframes(
  timeline: SceneTimelineDocument,
  objectId: string,
  delta: number
): ShiftLayerKeyframesResult {
  const objectTimeline = timeline.objects.find((candidate) => candidate.objectId === objectId);
  if (!objectTimeline || Math.abs(delta) < 0.001) {
    return { shifted: 0, skipped: 0, keyframeIds: [], changedTransformObjectIds: [] };
  }

  const duration = Math.max(timeline.duration, 0);
  const changedTransformObjectIds = new Set<string>();
  const keyframeIds: string[] = [];
  let shifted = 0;
  let skipped = 0;

  objectTimeline.tracks.forEach((track) => {
    if (track.kind === "objectVisibility" || track.keyframes.length === 0) return;
    if (track.locked) {
      skipped += track.keyframes.length;
      return;
    }

    const nextTimes = track.keyframes.map((keyframe) => roundTime(keyframe.time + delta));
    const outOfRange = nextTimes.some((time) => time < -0.001 || time > duration + 0.001);
    if (outOfRange) {
      skipped += track.keyframes.length;
      return;
    }

    track.keyframes.forEach((keyframe, index) => {
      keyframe.time = Math.min(Math.max(nextTimes[index], 0), duration);
      keyframeIds.push(keyframe.id);
      shifted += 1;
    });
    sortTimelineKeyframes(track);
    if (isObjectTransformTrackKind(track.kind)) changedTransformObjectIds.add(objectId);
  });

  return { shifted, skipped, keyframeIds, changedTransformObjectIds: [...changedTransformObjectIds] };
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
