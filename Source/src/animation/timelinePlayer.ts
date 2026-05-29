import * as THREE from "three";
import { evaluateTimelineTrack } from "./interpolation";
import type { ObjectTimelineDocument, SceneTimelineDocument, SceneEntry } from "../editor/types";
import { hasSoloTimelineTracks, isTimelineTrackRuntimeActive } from "./timelineSchema";
import { isObjectTransformTrackKind } from "./timelineTracks";

interface TimelineRuntime {
  entry: SceneEntry;
  objectTimeline: ObjectTimelineDocument;
}

export class TimelinePlayer {
  private runtimes = new Map<string, TimelineRuntime>();
  private soloActive = false;

  rebuild(timeline: SceneTimelineDocument, entries: Iterable<SceneEntry>): void {
    this.clear();
    this.soloActive = hasSoloTimelineTracks(timeline);
    const entryMap = new Map(Array.from(entries, (entry) => [entry.id, entry]));
    timeline.objects.forEach((objectTimeline) => {
      const entry = entryMap.get(objectTimeline.objectId);
      if (!entry) return;
      if (!objectTimeline.tracks.some((track) => isObjectTransformTrackKind(track.kind) && isTimelineTrackRuntimeActive(track, this.soloActive))) return;
      this.runtimes.set(entry.id, { entry, objectTimeline });
    });
    this.setTime(timeline.currentTime);
  }

  setTime(time: number): void {
    this.runtimes.forEach(({ entry, objectTimeline }) => {
      objectTimeline.tracks.forEach((track) => {
        if (!isObjectTransformTrackKind(track.kind)) return;
        if (!isTimelineTrackRuntimeActive(track, this.soloActive)) return;
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
    this.soloActive = false;
  }
}
