import * as THREE from "three";
import { evaluateTimelineTrack } from "./interpolation";
import type { ObjectTimelineDocument, SceneTimelineDocument, SceneEntry, TimelineTrackKind } from "../editor/types";

interface TimelineRuntime {
  entry: SceneEntry;
  objectTimeline: ObjectTimelineDocument;
}

export class TimelinePlayer {
  private runtimes = new Map<string, TimelineRuntime>();

  rebuild(timeline: SceneTimelineDocument, entries: Iterable<SceneEntry>): void {
    this.clear();
    const entryMap = new Map(Array.from(entries, (entry) => [entry.id, entry]));
    timeline.objects.forEach((objectTimeline) => {
      const entry = entryMap.get(objectTimeline.objectId);
      if (!entry) return;
      if (!objectTimeline.tracks.some((track) => isTransformTrackKind(track.kind) && track.enabled && track.keyframes.length > 0)) return;
      this.runtimes.set(entry.id, { entry, objectTimeline });
    });
    this.setTime(timeline.currentTime);
  }

  setTime(time: number): void {
    this.runtimes.forEach(({ entry, objectTimeline }) => {
      objectTimeline.tracks.forEach((track) => {
        if (!isTransformTrackKind(track.kind)) return;
        const value = evaluateTimelineTrack(track, time);
        if (!value) return;
        if (track.kind === "position") {
          entry.root.position.fromArray(value);
        } else if (track.kind === "scale") {
          entry.root.scale.fromArray(value);
        } else {
          entry.root.rotation.set(
            THREE.MathUtils.degToRad(value[0]),
            THREE.MathUtils.degToRad(value[1]),
            THREE.MathUtils.degToRad(value[2])
          );
        }
      });
    });
  }

  clear(): void {
    this.runtimes.clear();
  }
}

function isTransformTrackKind(kind: TimelineTrackKind): kind is "position" | "rotation" | "scale" {
  return kind === "position" || kind === "rotation" || kind === "scale";
}
