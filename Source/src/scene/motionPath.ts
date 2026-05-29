import * as THREE from "three";
import { evaluateTimelineTrack } from "../animation/interpolation";
import { hasSoloTimelineTracks, isTimelineTrackRuntimeActive } from "../animation/timelineSchema";
import type { SceneEntry, SceneTimelineDocument, TimelineKeyframeDocument, TimelineTrackDocument } from "../editor/types";

export interface MotionPathRig {
  group: THREE.Group;
  line: THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>;
  keyPoints: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>;
  labels: THREE.Group;
  ghosts: THREE.Group;
}

const SAMPLE_RATE = 12;
const MIN_SEGMENT_SAMPLES = 2;
const MAX_SEGMENT_SAMPLES = 28;
const MAX_LABELS = 16;

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

  const labels = new THREE.Group();
  labels.name = "Motion Path Time Labels";
  labels.renderOrder = 52;

  const ghosts = new THREE.Group();
  ghosts.name = "Motion Path Pose Ghosts";
  ghosts.renderOrder = 49;

  group.add(ghosts, line, keyPoints, labels);
  return { group, line, keyPoints, labels, ghosts };
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

  const objectTimeline = timeline.objects.find((candidate) => candidate.objectId === selectedEntry.id);
  const track = objectTimeline?.tracks.find((candidate) => candidate.kind === "position");

  const soloActive = hasSoloTimelineTracks(timeline);
  if (!objectTimeline || !track || track.keyframes.length < 2 || !isTimelineTrackRuntimeActive(track, soloActive)) {
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
  updateKeyLabels(rig.labels, keyframes);
  updatePoseGhosts(rig.ghosts, selectedEntry, objectTimeline.tracks, keyframes, soloActive);
  rig.group.visible = true;
}

export function clearMotionPath(rig: MotionPathRig): void {
  replaceGeometryPositions(rig.line, []);
  replaceGeometryPositions(rig.keyPoints, []);
  clearKeyLabels(rig.labels);
  clearPoseGhosts(rig.ghosts);
  rig.group.visible = false;
}

export function disposeMotionPathRig(rig: MotionPathRig): void {
  clearKeyLabels(rig.labels);
  clearPoseGhosts(rig.ghosts);
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

function updatePoseGhosts(
  group: THREE.Group,
  entry: SceneEntry,
  tracks: TimelineTrackDocument[],
  keyframes: TimelineKeyframeDocument[],
  soloActive: boolean
): void {
  clearPoseGhosts(group);
  const basis = objectBoxBasis(entry);
  if (!basis) return;

  const rotationTrack = activeTrack(tracks, "rotation", soloActive);
  const scaleTrack = activeTrack(tracks, "scale", soloActive);
  visibleLabelKeyframes(keyframes).forEach((keyframe) => {
    const ghost = createPoseGhost(basis, keyframe, rotationTrack, scaleTrack, entry);
    if (ghost) group.add(ghost);
  });
}

function createPoseGhost(
  basis: { size: THREE.Vector3; centerOffset: THREE.Vector3; currentScale: THREE.Vector3 },
  keyframe: TimelineKeyframeDocument,
  rotationTrack: TimelineTrackDocument | undefined,
  scaleTrack: TimelineTrackDocument | undefined,
  entry: SceneEntry
): THREE.LineSegments | null {
  const scale = evaluatedTrackVector(scaleTrack, keyframe.time, [entry.root.scale.x, entry.root.scale.y, entry.root.scale.z]);
  const size = new THREE.Vector3(
    Math.max(0.08, basis.size.x * Math.abs(scale[0] / basis.currentScale.x)),
    Math.max(0.08, basis.size.y * Math.abs(scale[1] / basis.currentScale.y)),
    Math.max(0.08, basis.size.z * Math.abs(scale[2] / basis.currentScale.z))
  );
  if (!Number.isFinite(size.x + size.y + size.z)) return null;

  const boxGeometry = new THREE.BoxGeometry(size.x, size.y, size.z);
  const geometry = new THREE.EdgesGeometry(boxGeometry);
  boxGeometry.dispose();
  const material = new THREE.LineBasicMaterial({
    color: 0x12b8a6,
    transparent: true,
    opacity: 0.36,
    depthTest: false
  });
  const ghost = new THREE.LineSegments(geometry, material);
  ghost.name = `Motion Path Pose Ghost ${formatTime(keyframe.time)}s`;
  ghost.renderOrder = 49;
  ghost.position.fromArray(keyframe.value);
  ghost.position.add(basis.centerOffset);
  const rotation = evaluatedTrackVector(rotationTrack, keyframe.time, [
    THREE.MathUtils.radToDeg(entry.root.rotation.x),
    THREE.MathUtils.radToDeg(entry.root.rotation.y),
    THREE.MathUtils.radToDeg(entry.root.rotation.z)
  ]);
  ghost.rotation.set(
    THREE.MathUtils.degToRad(rotation[0]),
    THREE.MathUtils.degToRad(rotation[1]),
    THREE.MathUtils.degToRad(rotation[2])
  );
  return ghost;
}

function objectBoxBasis(entry: SceneEntry): { size: THREE.Vector3; centerOffset: THREE.Vector3; currentScale: THREE.Vector3 } | null {
  const box = new THREE.Box3().setFromObject(entry.root);
  if (box.isEmpty()) return null;
  const worldSize = box.getSize(new THREE.Vector3());
  const centerOffset = box.getCenter(new THREE.Vector3()).sub(entry.root.position);
  const currentScale = new THREE.Vector3(
    safeScale(entry.root.scale.x),
    safeScale(entry.root.scale.y),
    safeScale(entry.root.scale.z)
  );
  const size = new THREE.Vector3(
    Math.max(0.08, worldSize.x / currentScale.x),
    Math.max(0.08, worldSize.y / currentScale.y),
    Math.max(0.08, worldSize.z / currentScale.z)
  );
  return { size, centerOffset, currentScale };
}

function activeTrack(tracks: TimelineTrackDocument[], kind: "rotation" | "scale", soloActive: boolean): TimelineTrackDocument | undefined {
  const track = tracks.find((candidate) => candidate.kind === kind);
  return track && isTimelineTrackRuntimeActive(track, soloActive) ? track : undefined;
}

function evaluatedTrackVector(track: TimelineTrackDocument | undefined, time: number, fallback: [number, number, number]): [number, number, number] {
  return track ? evaluateTimelineTrack(track, time) ?? fallback : fallback;
}

function updateKeyLabels(group: THREE.Group, keyframes: TimelineKeyframeDocument[]): void {
  clearKeyLabels(group);
  visibleLabelKeyframes(keyframes).forEach((keyframe) => {
    const sprite = createTimeLabelSprite(`${formatTime(keyframe.time)}s`);
    sprite.position.fromArray(keyframe.value);
    sprite.position.y += 0.28;
    group.add(sprite);
  });
}

function visibleLabelKeyframes(keyframes: TimelineKeyframeDocument[]): TimelineKeyframeDocument[] {
  if (keyframes.length <= MAX_LABELS) return keyframes;
  const result: TimelineKeyframeDocument[] = [];
  const lastIndex = keyframes.length - 1;
  for (let index = 0; index < MAX_LABELS; index += 1) {
    result.push(keyframes[Math.round((index / (MAX_LABELS - 1)) * lastIndex)]);
  }
  return result;
}

function createTimeLabelSprite(label: string): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = 160;
  canvas.height = 64;
  const context = canvas.getContext("2d");
  if (context) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "rgba(24, 31, 37, 0.82)";
    roundRect(context, 8, 12, 144, 38, 8);
    context.fill();
    context.strokeStyle = "rgba(18, 184, 166, 0.9)";
    context.lineWidth = 2;
    roundRect(context, 8, 12, 144, 38, 8);
    context.stroke();
    context.fillStyle = "#ffffff";
    context.font = "700 22px Arial, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(label, 80, 32);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    depthWrite: false
  });
  const sprite = new THREE.Sprite(material);
  sprite.name = `Motion Path Label ${label}`;
  sprite.renderOrder = 52;
  sprite.scale.set(0.78, 0.31, 1);
  return sprite;
}

function clearKeyLabels(group: THREE.Group): void {
  group.children.forEach((child) => {
    if (child instanceof THREE.Sprite) {
      child.material.map?.dispose();
      child.material.dispose();
    }
  });
  group.clear();
}

function clearPoseGhosts(group: THREE.Group): void {
  group.children.forEach((child) => {
    if (child instanceof THREE.LineSegments) {
      child.geometry.dispose();
      if (Array.isArray(child.material)) child.material.forEach((material) => material.dispose());
      else child.material.dispose();
    }
  });
  group.clear();
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

function safeScale(value: number): number {
  return Math.max(Math.abs(value), 0.001);
}

function formatTime(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function roundRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}
