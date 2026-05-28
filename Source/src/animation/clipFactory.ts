import * as THREE from "three";
import type { ObjectTimelineDocument, TimelineKeyframeDocument, TimelineTrackDocument } from "../editor/types";

export function buildTimelineClip(objectTimeline: ObjectTimelineDocument, duration: number): THREE.AnimationClip | null {
  const tracks = objectTimeline.tracks
    .filter((track) => track.enabled && track.keyframes.length > 0)
    .map(buildKeyframeTrack)
    .filter((track): track is THREE.KeyframeTrack => Boolean(track));

  if (tracks.length === 0) return null;
  return new THREE.AnimationClip(`timeline-${objectTimeline.objectId}`, duration, tracks);
}

function buildKeyframeTrack(track: TimelineTrackDocument): THREE.KeyframeTrack | null {
  const keyframes = [...track.keyframes].sort((left, right) => left.time - right.time);
  if (keyframes.length === 0) return null;
  const times = keyframes.map((keyframe) => keyframe.time);
  const values = track.kind === "rotation" ? rotationValues(keyframes) : vectorValues(keyframes);
  const name = track.kind === "rotation" ? ".quaternion" : `.${track.kind}`;
  const keyframeTrack = track.kind === "rotation"
    ? new THREE.QuaternionKeyframeTrack(name, times, values)
    : new THREE.VectorKeyframeTrack(name, times, values);

  if (keyframes.some((keyframe) => keyframe.interpolation === "hold")) {
    keyframeTrack.setInterpolation(THREE.InterpolateDiscrete);
  } else if (keyframes.some((keyframe) => keyframe.interpolation === "smooth")) {
    keyframeTrack.setInterpolation(THREE.InterpolateSmooth);
  } else {
    keyframeTrack.setInterpolation(THREE.InterpolateLinear);
  }
  return keyframeTrack;
}

function vectorValues(keyframes: TimelineKeyframeDocument[]): number[] {
  return keyframes.flatMap((keyframe) => keyframe.value);
}

function rotationValues(keyframes: TimelineKeyframeDocument[]): number[] {
  const quaternion = new THREE.Quaternion();
  const euler = new THREE.Euler(0, 0, 0, "XYZ");
  return keyframes.flatMap((keyframe) => {
    euler.set(
      THREE.MathUtils.degToRad(keyframe.value[0]),
      THREE.MathUtils.degToRad(keyframe.value[1]),
      THREE.MathUtils.degToRad(keyframe.value[2]),
      "XYZ"
    );
    quaternion.setFromEuler(euler);
    return [quaternion.x, quaternion.y, quaternion.z, quaternion.w];
  });
}
