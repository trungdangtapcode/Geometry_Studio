import type { SceneTimelineDocument, TimelineTrackKind } from "../editor/types";
import type { TimelineTrackEditTarget } from "./timelineEditing";
import { isCameraTrackKind, isLightTrackKind } from "./timelineTracks";

export interface TimelineRowTarget {
  targetId: string;
  kind: TimelineTrackKind;
}

export interface ResolvedTimelineTrackTargets {
  targets: TimelineTrackEditTarget[];
  lockedCount: number;
}

export function dedupeTimelineRowTargets<T extends TimelineRowTarget>(rows: T[]): T[] {
  const targets = new Map<string, T>();
  rows.forEach((row) => {
    const key = `${row.targetId}:${row.kind}`;
    if (!targets.has(key)) targets.set(key, row);
  });
  return [...targets.values()];
}

export function resolveTimelineRowTrackTargets(
  timeline: SceneTimelineDocument,
  rows: TimelineRowTarget[],
  validObjectIds: ReadonlySet<string>
): ResolvedTimelineTrackTargets {
  const targets: TimelineTrackEditTarget[] = [];
  let lockedCount = 0;

  dedupeTimelineRowTargets(rows).forEach((row) => {
    const target = timelineTrackTargetForRow(timeline, row, validObjectIds);
    if (!target || target.track.keyframes.length === 0) return;
    if (target.track.locked) {
      lockedCount += 1;
      return;
    }
    targets.push(target);
  });

  return { targets, lockedCount };
}

function timelineTrackTargetForRow(
  timeline: SceneTimelineDocument,
  row: TimelineRowTarget,
  validObjectIds: ReadonlySet<string>
): TimelineTrackEditTarget | null {
  if (isCameraTrackKind(row.kind)) {
    const track = timeline.camera.tracks.find((candidate) => candidate.kind === row.kind);
    return track ? { scope: "camera", objectId: "camera", track } : null;
  }

  if (isLightTrackKind(row.kind)) {
    const track = timeline.lights.tracks.find((candidate) => candidate.kind === row.kind);
    return track ? { scope: "lights", objectId: "lights", track } : null;
  }

  if (!validObjectIds.has(row.targetId)) return null;
  const objectTimeline = timeline.objects.find((candidate) => candidate.objectId === row.targetId);
  const track = objectTimeline?.tracks.find((candidate) => candidate.kind === row.kind);
  return track ? { scope: "object", objectId: row.targetId, track } : null;
}
