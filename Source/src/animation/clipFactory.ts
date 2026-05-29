import * as THREE from "three";
import type { ObjectTimelineDocument, TimelineKeyframeDocument, TimelineTrackDocument } from "../editor/types";

export function buildTimelineClip(objectTimeline: ObjectTimelineDocument, duration: number): THREE.AnimationClip | null {
  const tracks = objectTimeline.tracks
    .filter((track) => track.enabled && track.keyframes.length > 0)
    .flatMap(buildKeyframeTracks);

  if (tracks.length === 0) return null;
  return new THREE.AnimationClip(`timeline-${objectTimeline.objectId}`, duration, tracks);
}

function buildKeyframeTracks(track: TimelineTrackDocument): THREE.KeyframeTrack[] {
  if (track.kind !== "position" && track.kind !== "rotation" && track.kind !== "scale") return [];
  const keyframes = [...track.keyframes].sort((left, right) => left.time - right.time);
  if (keyframes.length === 0) return [];
  const times = keyframes.map((keyframe) => keyframe.time);
  const keyframeTracks = track.kind === "rotation"
    ? rotationTracks(times, keyframes)
    : [new THREE.VectorKeyframeTrack(`.${track.kind}`, times, vectorValues(keyframes))];

  keyframeTracks.forEach((keyframeTrack) => setInterpolation(keyframeTrack, keyframes));
  return keyframeTracks;
}

function setInterpolation(keyframeTrack: THREE.KeyframeTrack, keyframes: TimelineKeyframeDocument[]): void {
  if (keyframes.some((keyframe) => keyframe.interpolation === "hold")) {
    keyframeTrack.setInterpolation(THREE.InterpolateDiscrete);
  } else if (keyframes.some((keyframe) => keyframe.interpolation === "smooth")) {
    keyframeTrack.setInterpolation(THREE.InterpolateSmooth);
  } else {
    keyframeTrack.setInterpolation(THREE.InterpolateLinear);
  }
}

function vectorValues(keyframes: TimelineKeyframeDocument[]): number[] {
  return keyframes.flatMap((keyframe) => keyframe.value);
}

function rotationTracks(times: number[], keyframes: TimelineKeyframeDocument[]): THREE.NumberKeyframeTrack[] {
  return ["x", "y", "z"].map((axis, index) =>
    new THREE.NumberKeyframeTrack(
      `.rotation[${axis}]`,
      times,
      keyframes.map((keyframe) => THREE.MathUtils.degToRad(keyframe.value[index]))
    )
  );
}
