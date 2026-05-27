import * as THREE from "three";
import { buildTimelineClip } from "./clipFactory";
import type { SceneTimelineDocument, SceneEntry } from "../editor/types";

interface TimelineRuntime {
  mixer: THREE.AnimationMixer;
  action: THREE.AnimationAction;
}

export class TimelinePlayer {
  private runtimes = new Map<string, TimelineRuntime>();

  rebuild(timeline: SceneTimelineDocument, entries: Iterable<SceneEntry>): void {
    this.clear();
    const entryMap = new Map(Array.from(entries, (entry) => [entry.id, entry]));
    timeline.objects.forEach((objectTimeline) => {
      const entry = entryMap.get(objectTimeline.objectId);
      if (!entry) return;
      const clip = buildTimelineClip(objectTimeline, timeline.duration);
      if (!clip) return;
      const mixer = new THREE.AnimationMixer(entry.root);
      const action = mixer.clipAction(clip);
      action.setLoop(THREE.LoopOnce, 0);
      action.clampWhenFinished = true;
      action.enabled = true;
      action.play();
      mixer.setTime(timeline.currentTime);
      this.runtimes.set(entry.id, { mixer, action });
    });
  }

  setTime(time: number): void {
    this.runtimes.forEach((runtime) => runtime.mixer.setTime(time));
  }

  clear(): void {
    this.runtimes.forEach((runtime) => {
      runtime.action.stop();
      runtime.mixer.stopAllAction();
      runtime.mixer.uncacheRoot(runtime.mixer.getRoot());
    });
    this.runtimes.clear();
  }
}
