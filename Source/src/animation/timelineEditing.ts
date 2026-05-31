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
import { isCameraTrackKind, isLightTrackKind, isObjectTransformTrackKind } from "./timelineTracks";

export type TimelineKeyframeScope = "object" | "camera" | "lights";

export interface TimelineKeyframeSource {
  scope: TimelineKeyframeScope;
  objectId: string;
  track: TimelineTrackDocument;
  keyframe: TimelineKeyframeDocument;
}

export interface TimelineTrackEditTarget {
  scope: TimelineKeyframeScope;
  objectId: string;
  track: TimelineTrackDocument;
}

export interface TimelineClipboardKeyframe {
  scope: TimelineKeyframeScope;
  objectId?: string;
  kind: TimelineTrackKind;
  relativeTime: number;
  value: [number, number, number];
  interpolation: TimelineInterpolation;
}

export interface TimelineClipboard {
  preserveObjectTargets: boolean;
  keyframes: TimelineClipboardKeyframe[];
}

export interface TimelineClipboardOptions {
  preserveObjectTargets?: boolean;
}

export interface PasteTimelineOptions {
  validObjectIds?: ReadonlySet<string>;
  insertBeforePaste?: boolean;
  insertDuration?: number;
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
  keyframeIds: string[];
  shifted: number;
}

export interface DuplicateTimelineResult extends TimelineEditResult {
  created: number;
  keyframeIds: string[];
}

export interface CycleTimelineResult extends TimelineEditResult {
  created: number;
  cycles: number;
  keyframeIds: string[];
}

export interface NudgeTimelineResult extends TimelineEditResult {
  nudged: number;
  currentTime: number;
}

export interface RippleDeleteTimelineResult extends TimelineEditResult {
  deleted: number;
  shifted: number;
  currentTime: number;
}

export interface TimelineGapEditResult extends TimelineEditResult {
  deleted: number;
  shifted: number;
  tracks: number;
  currentTime: number;
}

export interface TimelineKeyframeRange {
  start: number;
  end: number;
  count: number;
}

export interface TimelineKeyframeEditPatch {
  time?: number;
  value?: Partial<Record<"x" | "y" | "z", number>>;
  valueDelta?: Partial<Record<"x" | "y" | "z", number>>;
}

export interface EditTimelineResult extends TimelineEditResult {
  edited: number;
  currentTime: number;
}

const AXIS_INDEX: Record<"x" | "y" | "z", number> = { x: 0, y: 1, z: 2 };

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

export function createTimelineClipboard(sources: TimelineKeyframeSource[], options: TimelineClipboardOptions = {}): TimelineClipboard {
  const origin = Math.min(...sources.map((source) => source.keyframe.time));
  return {
    preserveObjectTargets: Boolean(options.preserveObjectTargets),
    keyframes: sources.map(({ scope, objectId, track, keyframe }) => ({
      scope,
      objectId: scope === "object" ? objectId : undefined,
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
  baseTime: number,
  options: PasteTimelineOptions = {}
): PasteTimelineResult {
  let pasted = 0;
  let skipped = 0;
  let shifted = 0;
  const keyframeIds: string[] = [];
  const changedTransformObjectIds = new Set<string>();

  if (options.insertBeforePaste) {
    const insertTargets = clipboard.keyframes.flatMap((clip): TimelineTrackEditTarget[] => {
      const rawTime = baseTime + clip.relativeTime;
      if (rawTime > timeline.duration + 0.001) return [];
      const target = pasteTargetTrack(timeline, clip, selectedObjectId, clipboard.preserveObjectTargets, options.validObjectIds);
      if (!target || target.track.locked) return [];
      return [{
        scope: clip.scope,
        objectId: target.objectId ?? clip.scope,
        track: target.track
      }];
    });
    const insertResult = insertTimelineGapOnTracks(
      timeline,
      insertTargets,
      baseTime,
      options.insertDuration ?? timelineClipboardDuration(timeline, clipboard)
    );
    shifted = insertResult.shifted;
    skipped += insertResult.skipped;
    insertResult.changedTransformObjectIds.forEach((objectId) => changedTransformObjectIds.add(objectId));
  }

  clipboard.keyframes.forEach((clip) => {
    const rawTime = baseTime + clip.relativeTime;
    if (rawTime > timeline.duration + 0.001) {
      skipped += 1;
      return;
    }
    const time = snapTimelineTime(timeline, rawTime);
    const target = pasteTargetTrack(timeline, clip, selectedObjectId, clipboard.preserveObjectTargets, options.validObjectIds);
    if (!target) {
      skipped += 1;
      return;
    }
    const { track } = target;
    if (track.locked) {
      skipped += 1;
      return;
    }

    track.enabled = true;
    const existing = track.keyframes.find((keyframe) => Math.abs(keyframe.time - time) < 0.001);
    if (existing) {
      existing.value = [...clip.value] as [number, number, number];
      existing.interpolation = clip.interpolation;
      keyframeIds.push(existing.id);
    } else {
      const pastedKeyframe = createTimelineKeyframe(time, [...clip.value] as [number, number, number]);
      pastedKeyframe.interpolation = clip.interpolation;
      track.keyframes.push(pastedKeyframe);
      keyframeIds.push(pastedKeyframe.id);
    }
    sortTimelineKeyframes(track);
    if (target.objectId && clip.scope === "object" && isObjectTransformTrackKind(clip.kind)) changedTransformObjectIds.add(target.objectId);
    pasted += 1;
  });

  return { pasted, skipped, shifted, keyframeIds, changedTransformObjectIds: [...changedTransformObjectIds] };
}

export function duplicateResolvedKeyframes(
  timeline: SceneTimelineDocument,
  sources: TimelineKeyframeSource[]
): DuplicateTimelineResult {
  const offset = Math.max(timeline.snapEnabled ? timeline.snapStep : 1 / timeline.fps, 0.001);
  let created = 0;
  let skipped = 0;
  const keyframeIds: string[] = [];
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
    keyframeIds.push(duplicate.id);
    sortTimelineKeyframes(track);
    if (scope === "object" && isObjectTransformTrackKind(track.kind)) changedTransformObjectIds.add(objectId);
    created += 1;
  });

  return { created, skipped, keyframeIds, changedTransformObjectIds: [...changedTransformObjectIds] };
}

export function cycleResolvedKeyframesAcrossWorkArea(
  timeline: SceneTimelineDocument,
  sources: TimelineKeyframeSource[]
): CycleTimelineResult {
  if (sources.length < 2) {
    return { created: 0, cycles: 0, skipped: sources.length, keyframeIds: [], changedTransformObjectIds: [] };
  }

  const selectedTimes = uniqueSortedSourceTimes(sources);
  if (selectedTimes.length < 2) {
    return { created: 0, cycles: 0, skipped: sources.length, keyframeIds: [], changedTransformObjectIds: [] };
  }

  const start = selectedTimes[0];
  const end = selectedTimes[selectedTimes.length - 1];
  const span = roundTime(end - start);
  if (span <= 0) {
    return { created: 0, cycles: 0, skipped: sources.length, keyframeIds: [], changedTransformObjectIds: [] };
  }

  const repeatGap = selectedKeyframeRepeatGap(timeline, selectedTimes);
  const period = roundTime(span + repeatGap);
  const repeatEnd = Math.min(timeline.workEnd, timeline.duration);
  const cycles = Math.max(0, Math.floor((repeatEnd - end + 0.001) / period));
  if (cycles <= 0) {
    return { created: 0, cycles: 0, skipped: 0, keyframeIds: [], changedTransformObjectIds: [] };
  }

  let created = 0;
  let skipped = 0;
  const keyframeIds: string[] = [];
  const changedTracks = new Set<TimelineTrackDocument>();
  const changedTransformObjectIds = new Set<string>();
  const occupiedTimes = new Map<TimelineTrackDocument, Set<number>>();

  sources.forEach((source) => {
    if (occupiedTimes.has(source.track)) return;
    occupiedTimes.set(source.track, new Set(source.track.keyframes.map((keyframe) => timelineTimeKey(keyframe.time))));
  });

  for (let cycle = 1; cycle <= cycles; cycle += 1) {
    const offset = period * cycle;
    sources
      .slice()
      .sort((left, right) => left.keyframe.time - right.keyframe.time)
      .forEach(({ scope, objectId, track, keyframe }) => {
        if (track.locked) {
          skipped += 1;
          return;
        }

        const time = snapTimelineTime(timeline, keyframe.time + offset);
        const trackOccupancy = occupiedTimes.get(track)!;
        const timeKey = timelineTimeKey(time);
        if (time > repeatEnd + 0.001 || trackOccupancy.has(timeKey)) {
          skipped += 1;
          return;
        }

        const cycled = createTimelineKeyframe(time, [...keyframe.value] as [number, number, number]);
        cycled.interpolation = keyframe.interpolation;
        track.enabled = true;
        track.keyframes.push(cycled);
        trackOccupancy.add(timeKey);
        keyframeIds.push(cycled.id);
        changedTracks.add(track);
        if (scope === "object" && isObjectTransformTrackKind(track.kind)) changedTransformObjectIds.add(objectId);
        created += 1;
      });
  }

  changedTracks.forEach(sortTimelineKeyframes);
  return { created, cycles, skipped, keyframeIds, changedTransformObjectIds: [...changedTransformObjectIds] };
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
    if (source.scope === "object" && isObjectTransformTrackKind(source.track.kind)) changedTransformObjectIds.add(source.objectId);
  });
  changedTracks.forEach(sortTimelineKeyframes);

  return {
    nudged: updates.length,
    skipped: sources.length - updates.length,
    currentTime: updates.length ? Math.min(...updates.map((update) => update.time)) : timeline.currentTime,
    changedTransformObjectIds: [...changedTransformObjectIds]
  };
}

export function rippleDeleteResolvedKeyframes(
  timeline: SceneTimelineDocument,
  sources: TimelineKeyframeSource[]
): RippleDeleteTimelineResult {
  if (sources.length === 0) {
    return { deleted: 0, shifted: 0, skipped: 0, currentTime: timeline.currentTime, changedTransformObjectIds: [] };
  }

  const selectedIds = new Set(sources.map((source) => source.keyframe.id));
  const start = Math.max(0, Math.min(...sources.map((source) => source.keyframe.time)));
  const end = Math.min(timeline.duration, Math.max(...sources.map((source) => source.keyframe.time)));
  const minimumGap = Math.max(timeline.snapStep, 1 / Math.max(timeline.fps, 1), 0.001);
  const gap = roundTime(Math.max(end - start, minimumGap));
  const trackGroups = new Map<TimelineTrackDocument, TimelineKeyframeSource[]>();
  const changedTransformObjectIds = new Set<string>();
  let deleted = 0;
  let shifted = 0;
  let skipped = 0;

  sources.forEach((source) => {
    const group = trackGroups.get(source.track);
    if (group) group.push(source);
    else trackGroups.set(source.track, [source]);
    if (source.scope === "object" && isObjectTransformTrackKind(source.track.kind)) changedTransformObjectIds.add(source.objectId);
  });

  trackGroups.forEach((groupSources, track) => {
    const groupSelectedIds = new Set(groupSources.map((source) => source.keyframe.id));
    const remaining = track.keyframes.filter((keyframe) => !groupSelectedIds.has(keyframe.id));
    deleted += track.keyframes.length - remaining.length;

    const occupiedTimes = new Set(
      remaining
        .filter((keyframe) => keyframe.time <= end + 0.001)
        .map((keyframe) => timelineTimeKey(keyframe.time))
    );

    remaining
      .filter((keyframe) => keyframe.time > end + 0.001)
      .sort((left, right) => left.time - right.time)
      .forEach((keyframe) => {
        const nextTime = roundTime(keyframe.time - gap);
        const timeKey = timelineTimeKey(nextTime);
        if (nextTime < 0 || nextTime > timeline.duration || occupiedTimes.has(timeKey)) {
          occupiedTimes.add(timelineTimeKey(keyframe.time));
          skipped += 1;
          return;
        }

        occupiedTimes.add(timeKey);
        if (Math.abs(keyframe.time - nextTime) < 0.001) return;
        keyframe.time = nextTime;
        shifted += 1;
      });

    track.keyframes = remaining;
    sortTimelineKeyframes(track);
  });

  const staleSelections = selectedIds.size - deleted;
  return {
    deleted,
    shifted,
    skipped: skipped + Math.max(staleSelections, 0),
    currentTime: roundTime(start),
    changedTransformObjectIds: [...changedTransformObjectIds]
  };
}

export function insertTimelineGapOnTracks(
  timeline: SceneTimelineDocument,
  targets: TimelineTrackEditTarget[],
  startTime: number,
  duration: number
): TimelineGapEditResult {
  const time = snapTimelineTime(timeline, Math.max(0, Math.min(startTime, timeline.duration)));
  const gap = timelineGapDuration(timeline, duration);
  const trackTargets = dedupeTimelineTrackTargets(targets);
  const changedTransformObjectIds = new Set<string>();
  let shifted = 0;
  let skipped = 0;

  trackTargets.forEach((target) => {
    const movingKeyframes = target.track.keyframes
      .filter((keyframe) => keyframe.time >= time - 0.001)
      .sort((left, right) => right.time - left.time);
    if (movingKeyframes.length === 0) return;

    const movingIds = new Set(movingKeyframes.map((keyframe) => keyframe.id));
    const occupiedTimes = new Set(
      target.track.keyframes
        .filter((keyframe) => !movingIds.has(keyframe.id))
        .map((keyframe) => timelineTimeKey(keyframe.time))
    );

    movingKeyframes.forEach((keyframe) => {
      const nextTime = roundTime(keyframe.time + gap);
      const timeKey = timelineTimeKey(nextTime);
      if (nextTime > timeline.duration || occupiedTimes.has(timeKey)) {
        occupiedTimes.add(timelineTimeKey(keyframe.time));
        skipped += 1;
        return;
      }

      occupiedTimes.add(timeKey);
      if (Math.abs(keyframe.time - nextTime) < 0.001) return;
      keyframe.time = nextTime;
      shifted += 1;
    });

    sortTimelineKeyframes(target.track);
    if (target.scope === "object" && isObjectTransformTrackKind(target.track.kind)) changedTransformObjectIds.add(target.objectId);
  });

  return {
    deleted: 0,
    shifted,
    skipped,
    tracks: trackTargets.length,
    currentTime: time,
    changedTransformObjectIds: [...changedTransformObjectIds]
  };
}

export function extractTimelineRangeOnTracks(
  timeline: SceneTimelineDocument,
  targets: TimelineTrackEditTarget[],
  startTime: number,
  endTime: number
): TimelineGapEditResult {
  const start = Math.max(0, Math.min(startTime, endTime, timeline.duration));
  const end = Math.max(start, Math.min(Math.max(startTime, endTime), timeline.duration));
  const gap = timelineGapDuration(timeline, end - start);
  const trackTargets = dedupeTimelineTrackTargets(targets);
  const changedTransformObjectIds = new Set<string>();
  let deleted = 0;
  let shifted = 0;
  let skipped = 0;

  trackTargets.forEach((target) => {
    const beforeCount = target.track.keyframes.length;
    const remaining = target.track.keyframes.filter((keyframe) => keyframe.time < start - 0.001 || keyframe.time > end + 0.001);
    deleted += beforeCount - remaining.length;

    const occupiedTimes = new Set(
      remaining
        .filter((keyframe) => keyframe.time < start - 0.001)
        .map((keyframe) => timelineTimeKey(keyframe.time))
    );

    remaining
      .filter((keyframe) => keyframe.time > end + 0.001)
      .sort((left, right) => left.time - right.time)
      .forEach((keyframe) => {
        const nextTime = roundTime(keyframe.time - gap);
        const timeKey = timelineTimeKey(nextTime);
        if (nextTime < 0 || occupiedTimes.has(timeKey)) {
          occupiedTimes.add(timelineTimeKey(keyframe.time));
          skipped += 1;
          return;
        }

        occupiedTimes.add(timeKey);
        if (Math.abs(keyframe.time - nextTime) < 0.001) return;
        keyframe.time = nextTime;
        shifted += 1;
      });

    target.track.keyframes = remaining;
    sortTimelineKeyframes(target.track);
    if (target.scope === "object" && isObjectTransformTrackKind(target.track.kind)) changedTransformObjectIds.add(target.objectId);
  });

  return {
    deleted,
    shifted,
    skipped,
    tracks: trackTargets.length,
    currentTime: roundTime(start),
    changedTransformObjectIds: [...changedTransformObjectIds]
  };
}

export function liftTimelineRangeOnTracks(
  timeline: SceneTimelineDocument,
  targets: TimelineTrackEditTarget[],
  startTime: number,
  endTime: number
): TimelineGapEditResult {
  const start = Math.max(0, Math.min(startTime, endTime, timeline.duration));
  const end = Math.max(start, Math.min(Math.max(startTime, endTime), timeline.duration));
  const trackTargets = dedupeTimelineTrackTargets(targets);
  const changedTransformObjectIds = new Set<string>();
  let deleted = 0;

  trackTargets.forEach((target) => {
    const beforeCount = target.track.keyframes.length;
    target.track.keyframes = target.track.keyframes.filter((keyframe) => keyframe.time < start - 0.001 || keyframe.time > end + 0.001);
    const trackDeleted = beforeCount - target.track.keyframes.length;
    deleted += trackDeleted;
    if (trackDeleted === 0) return;
    sortTimelineKeyframes(target.track);
    if (target.scope === "object" && isObjectTransformTrackKind(target.track.kind)) changedTransformObjectIds.add(target.objectId);
  });

  return {
    deleted,
    shifted: 0,
    skipped: 0,
    tracks: trackTargets.length,
    currentTime: roundTime(start),
    changedTransformObjectIds: [...changedTransformObjectIds]
  };
}

export function editResolvedKeyframes(
  timeline: SceneTimelineDocument,
  sources: TimelineKeyframeSource[],
  patch: TimelineKeyframeEditPatch
): EditTimelineResult {
  const changedTracks = new Set<TimelineTrackDocument>();
  const changedTransformObjectIds = new Set<string>();
  const movingIds = new Set(sources.map((source) => source.keyframe.id));
  const anchorTime = sources.length ? Math.min(...sources.map((source) => source.keyframe.time)) : timeline.currentTime;
  const targetAnchor = typeof patch.time === "number" && Number.isFinite(patch.time)
    ? snapTimelineTime(timeline, Math.min(Math.max(patch.time, 0), timeline.duration))
    : null;
  const delta = targetAnchor === null ? 0 : targetAnchor - anchorTime;
  let edited = 0;
  let skipped = 0;

  sources.forEach((source) => {
    let changed = false;

    if (targetAnchor !== null) {
      const nextTime = sources.length === 1
        ? targetAnchor
        : snapTimelineTime(timeline, source.keyframe.time + delta);
      const blocked = nextTime < 0 ||
        nextTime > timeline.duration ||
        source.track.keyframes.some((keyframe) => !movingIds.has(keyframe.id) && Math.abs(keyframe.time - nextTime) < 0.001);
      if (blocked) {
        skipped += 1;
      } else if (Math.abs(source.keyframe.time - nextTime) >= 0.001) {
        source.keyframe.time = nextTime;
        changed = true;
      }
    }

    if (patch.value) {
      (["x", "y", "z"] as const).forEach((axis) => {
        const value = patch.value?.[axis];
        if (typeof value !== "number" || !Number.isFinite(value)) return;
        const index = AXIS_INDEX[axis];
        if (Math.abs(source.keyframe.value[index] - value) >= 0.0001) {
          source.keyframe.value[index] = value;
          changed = true;
        }
      });
    }

    if (patch.valueDelta) {
      (["x", "y", "z"] as const).forEach((axis) => {
        const deltaValue = patch.valueDelta?.[axis];
        if (typeof deltaValue !== "number" || !Number.isFinite(deltaValue)) return;
        if (Math.abs(deltaValue) < 0.0001) return;
        source.keyframe.value[AXIS_INDEX[axis]] += deltaValue;
        changed = true;
      });
    }

    if (changed) {
      changedTracks.add(source.track);
      if (source.scope === "object" && isObjectTransformTrackKind(source.track.kind)) changedTransformObjectIds.add(source.objectId);
      edited += 1;
    }
  });
  changedTracks.forEach(sortTimelineKeyframes);

  const currentTime = targetAnchor ?? (sources.length ? Math.min(...sources.map((source) => source.keyframe.time)) : timeline.currentTime);
  return { edited, skipped, currentTime, changedTransformObjectIds: [...changedTransformObjectIds] };
}

export function moveResolvedKeyframesToTime(
  timeline: SceneTimelineDocument,
  sources: TimelineKeyframeSource[],
  time: number
): EditTimelineResult {
  return editResolvedKeyframes(timeline, sources, { time });
}

export function centerResolvedKeyframesOnTime(
  timeline: SceneTimelineDocument,
  sources: TimelineKeyframeSource[],
  time: number
): EditTimelineResult {
  if (sources.length === 0) {
    return { edited: 0, skipped: 0, currentTime: timeline.currentTime, changedTransformObjectIds: [] };
  }

  const start = Math.min(...sources.map((source) => source.keyframe.time));
  const end = Math.max(...sources.map((source) => source.keyframe.time));
  const span = end - start;
  const maxAnchor = Math.max(0, timeline.duration - span);
  const targetAnchor = Math.max(0, Math.min(time - span / 2, maxAnchor));
  return moveResolvedKeyframesToTime(timeline, sources, targetAnchor);
}

export function selectedResolvedKeyframeRange(
  timeline: SceneTimelineDocument,
  sources: TimelineKeyframeSource[]
): TimelineKeyframeRange | null {
  if (sources.length === 0) return null;

  const times = sources.map((source) => source.keyframe.time);
  const start = Math.max(0, Math.min(...times, timeline.duration - 0.001));
  const minimumSpan = Math.max(timeline.snapStep, 1 / timeline.fps, 0.001);
  const end = Math.max(start + minimumSpan, Math.min(Math.max(...times, start + minimumSpan), timeline.duration));
  return { start: roundTime(start), end: roundTime(end), count: sources.length };
}

export function roveResolvedKeyframesAcrossTime(
  timeline: SceneTimelineDocument,
  sources: TimelineKeyframeSource[]
): EditTimelineResult {
  if (sources.length < 3) {
    return { edited: 0, skipped: sources.length, currentTime: timeline.currentTime, changedTransformObjectIds: [] };
  }

  const groups = groupSourcesByOriginalTime(sources);
  if (groups.length < 3) {
    return { edited: 0, skipped: sources.length, currentTime: timeline.currentTime, changedTransformObjectIds: [] };
  }

  const start = groups[0].time;
  const end = groups[groups.length - 1].time;
  if (Math.abs(end - start) < 0.001) {
    return { edited: 0, skipped: sources.length, currentTime: timeline.currentTime, changedTransformObjectIds: [] };
  }

  return retimeSourceGroups(timeline, sources, groups, (_group, index, allGroups) =>
    start + ((end - start) * index) / Math.max(allGroups.length - 1, 1)
  );
}

export function reverseResolvedKeyframes(
  timeline: SceneTimelineDocument,
  sources: TimelineKeyframeSource[]
): EditTimelineResult {
  if (sources.length < 2) {
    return { edited: 0, skipped: 0, currentTime: timeline.currentTime, changedTransformObjectIds: [] };
  }

  const start = Math.min(...sources.map((source) => source.keyframe.time));
  const end = Math.max(...sources.map((source) => source.keyframe.time));
  const movingIds = new Set(sources.map((source) => source.keyframe.id));
  const changedTracks = new Set<TimelineTrackDocument>();
  const changedTransformObjectIds = new Set<string>();
  let edited = 0;
  let skipped = 0;

  sources.forEach((source) => {
    const nextTime = snapTimelineTime(timeline, start + end - source.keyframe.time);
    const blocked = nextTime < 0 ||
      nextTime > timeline.duration ||
      source.track.keyframes.some((keyframe) => !movingIds.has(keyframe.id) && Math.abs(keyframe.time - nextTime) < 0.001);
    if (blocked) {
      skipped += 1;
      return;
    }

    if (Math.abs(source.keyframe.time - nextTime) < 0.001) return;
    source.keyframe.time = nextTime;
    changedTracks.add(source.track);
    if (source.scope === "object" && isObjectTransformTrackKind(source.track.kind)) changedTransformObjectIds.add(source.objectId);
    edited += 1;
  });

  changedTracks.forEach(sortTimelineKeyframes);
  return { edited, skipped, currentTime: timeline.currentTime, changedTransformObjectIds: [...changedTransformObjectIds] };
}

export function snapResolvedKeyframesToFrames(
  timeline: SceneTimelineDocument,
  sources: TimelineKeyframeSource[]
): EditTimelineResult {
  const frameStep = 1 / Math.max(timeline.fps, 1);
  const movingIds = new Set(sources.map((source) => source.keyframe.id));
  const occupiedTimes = new Map<TimelineTrackDocument, Set<number>>();
  const changedTracks = new Set<TimelineTrackDocument>();
  const changedTransformObjectIds = new Set<string>();
  let edited = 0;
  let skipped = 0;

  sources.forEach((source) => {
    if (!occupiedTimes.has(source.track)) {
      occupiedTimes.set(source.track, new Set(
        source.track.keyframes
          .filter((keyframe) => !movingIds.has(keyframe.id))
          .map((keyframe) => timelineTimeKey(keyframe.time))
      ));
    }
  });

  [...sources]
    .sort((left, right) => left.keyframe.time - right.keyframe.time)
    .forEach((source) => {
      const nextTime = roundTime(Math.round(source.keyframe.time / frameStep) * frameStep);
      const trackOccupancy = occupiedTimes.get(source.track)!;
      const timeKey = timelineTimeKey(nextTime);
      const blocked = nextTime < 0 || nextTime > timeline.duration || trackOccupancy.has(timeKey);
      if (blocked) {
        skipped += 1;
        return;
      }

      trackOccupancy.add(timeKey);
      if (Math.abs(source.keyframe.time - nextTime) < 0.001) return;
      source.keyframe.time = nextTime;
      changedTracks.add(source.track);
      if (source.scope === "object" && isObjectTransformTrackKind(source.track.kind)) changedTransformObjectIds.add(source.objectId);
      edited += 1;
    });

  changedTracks.forEach(sortTimelineKeyframes);
  return {
    edited,
    skipped,
    currentTime: edited ? Math.min(...sources.map((source) => source.keyframe.time)) : timeline.currentTime,
    changedTransformObjectIds: [...changedTransformObjectIds]
  };
}

export function distributeResolvedKeyframesAcrossRange(
  timeline: SceneTimelineDocument,
  sources: TimelineKeyframeSource[],
  startTime: number,
  endTime: number
): EditTimelineResult {
  if (sources.length < 2) {
    return { edited: 0, skipped: 0, currentTime: timeline.currentTime, changedTransformObjectIds: [] };
  }

  const start = Math.max(0, Math.min(startTime, endTime, timeline.duration));
  const end = Math.max(start, Math.min(Math.max(startTime, endTime), timeline.duration));
  if (Math.abs(end - start) < 0.001) {
    return { edited: 0, skipped: sources.length, currentTime: timeline.currentTime, changedTransformObjectIds: [] };
  }

  const groups = groupSourcesByOriginalTime(sources);
  if (groups.length < 2) {
    return { edited: 0, skipped: sources.length, currentTime: timeline.currentTime, changedTransformObjectIds: [] };
  }

  return retimeSourceGroups(timeline, sources, groups, (_group, index, allGroups) => {
    const ratio = index / Math.max(allGroups.length - 1, 1);
    return start + (end - start) * ratio;
  });
}

export function fitResolvedKeyframesToRange(
  timeline: SceneTimelineDocument,
  sources: TimelineKeyframeSource[],
  startTime: number,
  endTime: number
): EditTimelineResult {
  if (sources.length < 2) {
    return { edited: 0, skipped: 0, currentTime: timeline.currentTime, changedTransformObjectIds: [] };
  }

  const start = Math.max(0, Math.min(startTime, endTime, timeline.duration));
  const end = Math.max(start, Math.min(Math.max(startTime, endTime), timeline.duration));
  if (Math.abs(end - start) < 0.001) {
    return { edited: 0, skipped: sources.length, currentTime: timeline.currentTime, changedTransformObjectIds: [] };
  }

  const groups = groupSourcesByOriginalTime(sources);
  if (groups.length < 2) {
    return { edited: 0, skipped: sources.length, currentTime: timeline.currentTime, changedTransformObjectIds: [] };
  }

  const sourceStart = groups[0].time;
  const sourceEnd = groups[groups.length - 1].time;
  if (Math.abs(sourceEnd - sourceStart) < 0.001) {
    return { edited: 0, skipped: sources.length, currentTime: timeline.currentTime, changedTransformObjectIds: [] };
  }

  return retimeSourceGroups(timeline, sources, groups, (group) => {
    const ratio = (group.time - sourceStart) / (sourceEnd - sourceStart);
    return start + (end - start) * ratio;
  });
}

export function stretchResolvedKeyframesToSpan(
  timeline: SceneTimelineDocument,
  sources: TimelineKeyframeSource[],
  span: number
): EditTimelineResult {
  if (sources.length < 2 || !Number.isFinite(span)) {
    return { edited: 0, skipped: sources.length, currentTime: timeline.currentTime, changedTransformObjectIds: [] };
  }

  const groups = groupSourcesByOriginalTime(sources);
  if (groups.length < 2) {
    return { edited: 0, skipped: sources.length, currentTime: timeline.currentTime, changedTransformObjectIds: [] };
  }

  const start = groups[0].time;
  const minimumSpan = Math.max(timeline.snapStep, 1 / Math.max(timeline.fps, 1), 0.001);
  const safeSpan = Math.min(Math.max(span, minimumSpan), Math.max(minimumSpan, timeline.duration - start));
  return fitResolvedKeyframesToRange(timeline, sources, start, start + safeSpan);
}

export function staggerResolvedKeyframesFromTime(
  timeline: SceneTimelineDocument,
  sources: TimelineKeyframeSource[],
  startTime: number,
  step: number
): EditTimelineResult {
  if (sources.length < 2) {
    return { edited: 0, skipped: 0, currentTime: timeline.currentTime, changedTransformObjectIds: [] };
  }

  const groups = groupSourcesByOriginalTime(sources);
  if (groups.length < 2) {
    return { edited: 0, skipped: sources.length, currentTime: timeline.currentTime, changedTransformObjectIds: [] };
  }

  const safeStep = Math.max(step, 0.001);
  const start = snapTimelineTime(timeline, startTime);
  return retimeSourceGroups(timeline, sources, groups, (_group, index) => start + index * safeStep);
}

export function cascadeResolvedKeyframesByTargetFromTime(
  timeline: SceneTimelineDocument,
  sources: TimelineKeyframeSource[],
  startTime: number,
  step: number
): EditTimelineResult {
  if (sources.length < 2) {
    return { edited: 0, skipped: 0, currentTime: timeline.currentTime, changedTransformObjectIds: [] };
  }

  const groups = groupSourcesByTarget(sources);
  if (groups.length < 2) {
    return { edited: 0, skipped: sources.length, currentTime: timeline.currentTime, changedTransformObjectIds: [] };
  }

  const movingIds = new Set(sources.map((source) => source.keyframe.id));
  const occupiedTimes = new Map<TimelineTrackDocument, Set<number>>();
  const changedTracks = new Set<TimelineTrackDocument>();
  const changedTransformObjectIds = new Set<string>();
  const editedTimes: number[] = [];
  let edited = 0;
  let skipped = 0;
  const safeStep = Math.max(step, 0.001);
  const start = snapTimelineTime(timeline, startTime);

  sources.forEach((source) => {
    if (!occupiedTimes.has(source.track)) {
      occupiedTimes.set(source.track, new Set(
        source.track.keyframes
          .filter((keyframe) => !movingIds.has(keyframe.id))
          .map((keyframe) => timelineTimeKey(keyframe.time))
      ));
    }
  });

  groups.forEach((group, index) => {
    const anchorTime = start + index * safeStep;
    group.sources.forEach((source) => {
      const relativeTime = source.keyframe.time - group.startTime;
      const nextTime = snapTimelineTime(timeline, anchorTime + relativeTime);
      const trackOccupancy = occupiedTimes.get(source.track)!;
      const timeKey = timelineTimeKey(nextTime);
      const blocked = nextTime < 0 || nextTime > timeline.duration || trackOccupancy.has(timeKey);
      if (blocked) {
        skipped += 1;
        return;
      }

      trackOccupancy.add(timeKey);
      if (Math.abs(source.keyframe.time - nextTime) < 0.001) return;
      source.keyframe.time = nextTime;
      changedTracks.add(source.track);
      if (source.scope === "object" && isObjectTransformTrackKind(source.track.kind)) changedTransformObjectIds.add(source.objectId);
      edited += 1;
      editedTimes.push(nextTime);
    });
  });

  changedTracks.forEach(sortTimelineKeyframes);
  return {
    edited,
    skipped,
    currentTime: editedTimes.length ? Math.min(...editedTimes) : timeline.currentTime,
    changedTransformObjectIds: [...changedTransformObjectIds]
  };
}

type TimelineSourceTimeGroup = { time: number; sources: TimelineKeyframeSource[] };
type TimelineSourceTargetGroup = { startTime: number; order: number; sources: TimelineKeyframeSource[] };

function retimeSourceGroups(
  timeline: SceneTimelineDocument,
  sources: TimelineKeyframeSource[],
  groups: TimelineSourceTimeGroup[],
  targetTimeForGroup: (group: TimelineSourceTimeGroup, index: number, groups: TimelineSourceTimeGroup[]) => number
): EditTimelineResult {
  const movingIds = new Set(sources.map((source) => source.keyframe.id));
  const occupiedTimes = new Map<TimelineTrackDocument, Set<number>>();
  const changedTracks = new Set<TimelineTrackDocument>();
  const changedTransformObjectIds = new Set<string>();
  let edited = 0;
  let skipped = 0;
  const editedTimes: number[] = [];

  sources.forEach((source) => {
    if (!occupiedTimes.has(source.track)) {
      occupiedTimes.set(source.track, new Set(
        source.track.keyframes
          .filter((keyframe) => !movingIds.has(keyframe.id))
          .map((keyframe) => timelineTimeKey(keyframe.time))
      ));
    }
  });

  groups.forEach((group, index) => {
    const nextTime = snapTimelineTime(timeline, targetTimeForGroup(group, index, groups));
    group.sources.forEach((source) => {
      const trackOccupancy = occupiedTimes.get(source.track)!;
      const timeKey = timelineTimeKey(nextTime);
      const blocked = nextTime < 0 || nextTime > timeline.duration || trackOccupancy.has(timeKey);
      if (blocked) {
        skipped += 1;
        return;
      }

      trackOccupancy.add(timeKey);
      if (Math.abs(source.keyframe.time - nextTime) < 0.001) return;
      source.keyframe.time = nextTime;
      changedTracks.add(source.track);
      if (source.scope === "object" && isObjectTransformTrackKind(source.track.kind)) changedTransformObjectIds.add(source.objectId);
      edited += 1;
      editedTimes.push(nextTime);
    });
  });

  changedTracks.forEach(sortTimelineKeyframes);
  return {
    edited,
    skipped,
    currentTime: editedTimes.length ? Math.min(...editedTimes) : timeline.currentTime,
    changedTransformObjectIds: [...changedTransformObjectIds]
  };
}

function groupSourcesByOriginalTime(sources: TimelineKeyframeSource[]): TimelineSourceTimeGroup[] {
  const groups = new Map<number, TimelineKeyframeSource[]>();
  sources.forEach((source) => {
    const key = timelineTimeKey(source.keyframe.time);
    const group = groups.get(key);
    if (group) group.push(source);
    else groups.set(key, [source]);
  });
  return [...groups.entries()]
    .map(([_timeKey, groupSources]) => ({
      time: Math.min(...groupSources.map((source) => source.keyframe.time)),
      sources: groupSources
    }))
    .sort((left, right) => left.time - right.time);
}

function groupSourcesByTarget(sources: TimelineKeyframeSource[]): TimelineSourceTargetGroup[] {
  const groups = new Map<string, TimelineSourceTargetGroup>();
  sources.forEach((source, index) => {
    const key = `${source.scope}:${source.objectId}`;
    const group = groups.get(key);
    if (group) {
      group.sources.push(source);
      group.startTime = Math.min(group.startTime, source.keyframe.time);
    } else {
      groups.set(key, {
        startTime: source.keyframe.time,
        order: index,
        sources: [source]
      });
    }
  });
  return [...groups.values()]
    .sort((left, right) => left.startTime - right.startTime || left.order - right.order);
}

function timelineTimeKey(time: number): number {
  return Math.round(time * 1000);
}

function uniqueSortedSourceTimes(sources: TimelineKeyframeSource[]): number[] {
  return sources
    .map((source) => source.keyframe.time)
    .sort((left, right) => left - right)
    .reduce<number[]>((times, time) => {
      const previous = times.at(-1);
      if (previous === undefined || Math.abs(previous - time) >= 0.001) times.push(time);
      return times;
    }, []);
}

function selectedKeyframeRepeatGap(timeline: SceneTimelineDocument, selectedTimes: number[]): number {
  const fallback = Math.max(timeline.snapEnabled ? timeline.snapStep : 1 / Math.max(timeline.fps, 1), 0.001);
  const positiveGaps = selectedTimes
    .slice(1)
    .map((time, index) => time - selectedTimes[index])
    .filter((gap) => gap > 0.001);
  if (positiveGaps.length === 0) return fallback;
  return roundTime(Math.max(Math.min(...positiveGaps), 0.001));
}

function timelineGapDuration(timeline: SceneTimelineDocument, duration: number): number {
  const fallback = Math.max(timeline.snapStep, 1 / Math.max(timeline.fps, 1), 0.001);
  return roundTime(Math.max(Number.isFinite(duration) ? duration : 0, fallback));
}

function timelineClipboardDuration(timeline: SceneTimelineDocument, clipboard: TimelineClipboard): number {
  const maxRelativeTime = clipboard.keyframes.length
    ? Math.max(...clipboard.keyframes.map((keyframe) => keyframe.relativeTime))
    : 0;
  return timelineGapDuration(timeline, maxRelativeTime);
}

function dedupeTimelineTrackTargets(targets: TimelineTrackEditTarget[]): TimelineTrackEditTarget[] {
  const trackTargets = new Map<TimelineTrackDocument, TimelineTrackEditTarget>();
  targets.forEach((target) => {
    if (!trackTargets.has(target.track)) trackTargets.set(target.track, target);
  });
  return [...trackTargets.values()];
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
  selectedObjectId: string | null,
  preserveObjectTargets: boolean,
  validObjectIds?: ReadonlySet<string>
): { track: TimelineTrackDocument; objectId?: string } | null {
  if (clip.scope === "camera") return { track: ensureTimelineTrack(ensureCameraTimeline(timeline), clip.kind) };
  if (clip.scope === "lights") return { track: ensureTimelineTrack(ensureLightTimeline(timeline), clip.kind) };

  const targetObjectId = preserveObjectTargets ? clip.objectId ?? null : selectedObjectId;
  if (!targetObjectId) return null;
  if (validObjectIds && !validObjectIds.has(targetObjectId)) return null;
  return { track: ensureTimelineTrack(ensureObjectTimeline(timeline, targetObjectId), clip.kind), objectId: targetObjectId };
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
