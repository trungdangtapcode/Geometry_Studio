import { objectLayerRanges } from "../animation/timelineLayers";
import { roundTime, snapTimelineTime } from "../animation/timelineSchema";
import type { SceneTimelineDocument, TimelineTrackDocument } from "../editor/types";

export interface TimelineSnapOptions {
  includeLayerRanges?: boolean;
  ignoreTimes?: number[];
}

export function snapTimelineEditorTime(timeline: SceneTimelineDocument, time: number, options: TimelineSnapOptions = {}): number {
  if (!timeline.snapEnabled) return roundTime(clampTime(timeline, time));
  const rawTime = clampTime(timeline, time);
  const landmark = nearestTimelineLandmark(timeline, rawTime, options);
  if (landmark !== null) return landmark;
  return snapTimelineTime(timeline, rawTime);
}

export function nearestTimelineLandmark(timeline: SceneTimelineDocument, time: number, options: TimelineSnapOptions = {}): number | null {
  const tolerance = timelineLandmarkTolerance(timeline);
  const ignored = options.ignoreTimes ?? [];
  let nearest: number | null = null;
  let nearestDistance = Number.POSITIVE_INFINITY;

  timelineSnapTargets(timeline, options).forEach((target) => {
    if (ignored.some((ignoredTime) => Math.abs(target - ignoredTime) < 0.001)) return;
    const distance = Math.abs(target - time);
    if (distance <= tolerance && distance < nearestDistance) {
      nearest = target;
      nearestDistance = distance;
    }
  });

  return nearest === null ? null : roundTime(nearest);
}

export function timelineSnapTargets(timeline: SceneTimelineDocument, options: TimelineSnapOptions = {}): number[] {
  const targets = new Set<number>();
  const add = (time: number) => {
    if (Number.isFinite(time)) targets.add(roundTime(clampTime(timeline, time)));
  };

  add(0);
  add(timeline.duration);
  add(timeline.workStart);
  add(timeline.workEnd);
  timeline.markers.forEach((marker) => add(marker.time));
  timeline.camera.tracks.forEach((track) => addTrackKeyframes(track, add));
  timeline.lights.tracks.forEach((track) => addTrackKeyframes(track, add));
  timeline.objects.forEach((objectTimeline) => {
    objectTimeline.tracks.forEach((track) => addTrackKeyframes(track, add));
    if (options.includeLayerRanges) {
      objectLayerRanges(timeline, objectTimeline.objectId).forEach((range) => {
        add(range.start);
        add(range.end);
      });
    }
  });

  return [...targets].sort((left, right) => left - right);
}

function addTrackKeyframes(track: TimelineTrackDocument, add: (time: number) => void): void {
  if (!track.enabled || track.locked) return;
  track.keyframes.forEach((keyframe) => add(keyframe.time));
}

function timelineLandmarkTolerance(timeline: SceneTimelineDocument): number {
  const frame = 1 / Math.max(timeline.fps, 1);
  const snapWindow = timeline.snapStep > 0 ? timeline.snapStep * 0.5 : frame;
  const durationWindow = Math.max(timeline.duration, 0.001) * 0.015;
  return Math.max(0.05, Math.min(0.25, snapWindow, durationWindow));
}

function clampTime(timeline: SceneTimelineDocument, time: number): number {
  return Math.min(Math.max(time, 0), Math.max(timeline.duration, 0));
}
