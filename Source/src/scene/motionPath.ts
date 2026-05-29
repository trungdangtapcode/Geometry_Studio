import * as THREE from "three";
import { evaluateTimelineTrack } from "../animation/interpolation";
import type { SceneEntry, SceneTimelineDocument, TimelineKeyframeDocument, TimelineTrackDocument } from "../editor/types";

export interface MotionPathRig {
  group: THREE.Group;
  line: THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>;
  keyPoints: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>;
}

const SAMPLE_RATE = 12;
const MIN_SEGMENT_SAMPLES = 2;
const MAX_SEGMENT_SAMPLES = 28;

export function createMotionPathRig(): MotionPathRig {
  const group = new THREE.Group();
  group.name = "Selected Object Motion Path";
  group.visible = false;

  const line = new THREE.Line(
    emptyGeometry(),
    new THREE.LineBasicMaterial({
      color: 0x12b8a6,
      transparent: true,
      opacity: 0.92,
      depthTest: false
    })
  );
  line.name = "Motion Path Curve";
  line.renderOrder = 50;

  const keyPoints = new THREE.Points(
    emptyGeometry(),
    new THREE.PointsMaterial({
      color: 0xf4ad2f,
      size: 0.14,
      sizeAttenuation: true,
      depthTest: false
    })
  );
  keyPoints.name = "Motion Path Keyframes";
  keyPoints.renderOrder = 51;

  group.add(line, keyPoints);
  return { group, line, keyPoints };
}

export function updateMotionPath(
  rig: MotionPathRig,
  timeline: SceneTimelineDocument,
  selectedEntry: SceneEntry | null,
  visible: boolean
): void {
  if (!visible || !selectedEntry) {
    clearMotionPath(rig);
    return;
  }

  const track = timeline.objects
    .find((objectTimeline) => objectTimeline.objectId === selectedEntry.id)
    ?.tracks.find((candidate) => candidate.kind === "position");

  if (!track || !track.enabled || track.keyframes.length < 2) {
    clearMotionPath(rig);
    return;
  }

  const keyframes = [...track.keyframes].sort((left, right) => left.time - right.time);
  const linePositions = sampleTrackPositions(track, keyframes);
  const keyPositions = keyframes.flatMap((keyframe) => keyframe.value);

  if (linePositions.length < 6) {
    clearMotionPath(rig);
    return;
  }

  replaceGeometryPositions(rig.line, linePositions);
  replaceGeometryPositions(rig.keyPoints, keyPositions);
  rig.group.visible = true;
}

export function clearMotionPath(rig: MotionPathRig): void {
  replaceGeometryPositions(rig.line, []);
  replaceGeometryPositions(rig.keyPoints, []);
  rig.group.visible = false;
}

export function disposeMotionPathRig(rig: MotionPathRig): void {
  rig.line.geometry.dispose();
  rig.line.material.dispose();
  rig.keyPoints.geometry.dispose();
  rig.keyPoints.material.dispose();
}

function sampleTrackPositions(track: TimelineTrackDocument, keyframes: TimelineKeyframeDocument[]): number[] {
  const positions: number[] = [];
  for (let index = 0; index < keyframes.length - 1; index += 1) {
    const left = keyframes[index];
    const right = keyframes[index + 1];
    const span = Math.max(right.time - left.time, 0);
    const steps = clamp(Math.ceil(span * SAMPLE_RATE), MIN_SEGMENT_SAMPLES, MAX_SEGMENT_SAMPLES);
    for (let step = 0; step <= steps; step += 1) {
      if (index > 0 && step === 0) continue;
      const time = left.time + span * (step / steps);
      positions.push(...(evaluateTimelineTrack(track, time) ?? left.value));
    }
  }
  return positions;
}

function replaceGeometryPositions(
  object: THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial> | THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>,
  positions: number[]
): void {
  object.geometry.dispose();
  object.geometry = positions.length > 0 ? geometryFromPositions(positions) : emptyGeometry();
}

function geometryFromPositions(positions: number[]): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  if (positions.length > 0) geometry.computeBoundingSphere();
  return geometry;
}

function emptyGeometry(): THREE.BufferGeometry {
  return geometryFromPositions([]);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
