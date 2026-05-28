import type {
  CameraTimelineDocument,
  ObjectTimelineDocument,
  SceneTimelineDocument,
  TimelineKeyframeDocument,
  TimelineTrackDocument,
  TimelineTrackKind
} from "../editor/types";

const TRACK_LABELS: Record<TimelineTrackKind, string> = {
  position: "Position",
  rotation: "Rotation",
  scale: "Scale",
  cameraPosition: "Camera Position",
  cameraTarget: "Camera Target",
  cameraLens: "Camera Lens"
};

export function createDefaultTimeline(): SceneTimelineDocument {
  return {
    version: 3,
    duration: 8,
    fps: 30,
    currentTime: 0,
    loop: true,
    snapEnabled: true,
    snapStep: 1 / 30,
    autoKey: false,
    camera: { tracks: [] },
    objects: []
  };
}

export function cloneTimelineDocument(timeline: SceneTimelineDocument): SceneTimelineDocument {
  return {
    ...timeline,
    camera: cloneTrackCollection(timeline.camera),
    objects: timeline.objects.map((object) => ({
      objectId: object.objectId,
      tracks: cloneTrackCollection(object).tracks
    }))
  };
}

export function normalizeTimelineDocument(value: unknown, validObjectIds?: Set<string>): SceneTimelineDocument {
  const defaults = createDefaultTimeline();
  if (!value || typeof value !== "object") return defaults;
  const source = value as Partial<SceneTimelineDocument>;
  const timeline: SceneTimelineDocument = {
    version: 3,
    duration: finiteNumber(source.duration, defaults.duration, 0.5, 120),
    fps: Math.round(finiteNumber(source.fps, defaults.fps, 1, 120)),
    currentTime: finiteNumber(source.currentTime, defaults.currentTime, 0, 120),
    loop: typeof source.loop === "boolean" ? source.loop : defaults.loop,
    snapEnabled: typeof source.snapEnabled === "boolean" ? source.snapEnabled : defaults.snapEnabled,
    snapStep: finiteNumber(source.snapStep, defaults.snapStep, 0.001, 10),
    autoKey: typeof source.autoKey === "boolean" ? source.autoKey : defaults.autoKey,
    camera: normalizeTrackCollection(source.camera),
    objects: []
  };
  timeline.currentTime = clamp(timeline.currentTime, 0, timeline.duration);

  timeline.camera.tracks.forEach((track) => {
    track.keyframes.forEach((keyframe) => {
      keyframe.time = roundTime(clamp(keyframe.time, 0, timeline.duration));
    });
    sortTimelineKeyframes(track);
  });
  if (!Array.isArray(source.objects)) return timeline;
  source.objects.forEach((objectValue) => {
    if (!objectValue || typeof objectValue !== "object") return;
    const object = objectValue as Partial<ObjectTimelineDocument>;
    if (!object.objectId || (validObjectIds && !validObjectIds.has(object.objectId))) return;
    const tracks = Array.isArray(object.tracks)
      ? object.tracks.map(normalizeTrack).filter((track): track is TimelineTrackDocument => Boolean(track))
      : [];
    if (tracks.some((track) => track.keyframes.length > 0)) {
      timeline.objects.push({ objectId: object.objectId, tracks });
    }
  });
  timeline.objects.forEach((object) => {
    object.tracks.forEach((track) => {
      track.keyframes.forEach((keyframe) => {
        keyframe.time = roundTime(clamp(keyframe.time, 0, timeline.duration));
      });
      sortTimelineKeyframes(track);
    });
  });
  return timeline;
}

export function ensureCameraTimeline(timeline: SceneTimelineDocument): CameraTimelineDocument {
  timeline.camera ??= { tracks: [] };
  return timeline.camera;
}

export function ensureObjectTimeline(timeline: SceneTimelineDocument, objectId: string): ObjectTimelineDocument {
  let objectTimeline = timeline.objects.find((object) => object.objectId === objectId);
  if (!objectTimeline) {
    objectTimeline = { objectId, tracks: [] };
    timeline.objects.push(objectTimeline);
  }
  return objectTimeline;
}

export function ensureTimelineTrack(objectTimeline: { tracks: TimelineTrackDocument[] }, kind: TimelineTrackKind): TimelineTrackDocument {
  let track = objectTimeline.tracks.find((candidate) => candidate.kind === kind);
  if (!track) {
    track = {
      id: createTimelineId(`track-${kind}`),
      kind,
      label: TRACK_LABELS[kind],
      enabled: true,
      keyframes: []
    };
    objectTimeline.tracks.push(track);
  }
  return track;
}

export function createTimelineKeyframe(time: number, value: [number, number, number]): TimelineKeyframeDocument {
  return {
    id: createTimelineId("keyframe"),
    time: roundTime(time),
    value,
    interpolation: "linear"
  };
}

export function sortTimelineKeyframes(track: TimelineTrackDocument): void {
  track.keyframes.sort((left, right) => left.time - right.time);
}

export function pruneEmptyTimelineTracks(timeline: SceneTimelineDocument): void {
  timeline.camera = {
    tracks: timeline.camera.tracks.filter((track) => track.keyframes.length > 0)
  };
  timeline.objects = timeline.objects
    .map((object) => ({
      ...object,
      tracks: object.tracks.filter((track) => track.keyframes.length > 0)
    }))
    .filter((object) => object.tracks.length > 0);
}

export function removeTimelineObject(timeline: SceneTimelineDocument, objectId: string): void {
  timeline.objects = timeline.objects.filter((object) => object.objectId !== objectId);
}

export function copyTimelineObject(timeline: SceneTimelineDocument, sourceObjectId: string, targetObjectId: string): void {
  const source = timeline.objects.find((object) => object.objectId === sourceObjectId);
  if (!source) return;
  removeTimelineObject(timeline, targetObjectId);
  timeline.objects.push({
    objectId: targetObjectId,
    tracks: source.tracks.map((track) => ({
      ...track,
      id: createTimelineId(`track-${track.kind}`),
      keyframes: track.keyframes.map((keyframe) => ({
        ...keyframe,
        id: createTimelineId("keyframe"),
        value: [...keyframe.value] as [number, number, number]
      }))
    }))
  });
}

export function hasTimelineTracks(timeline: SceneTimelineDocument): boolean {
  return timeline.camera.tracks.some((track) => track.enabled && track.keyframes.length > 0) ||
    timeline.objects.some((object) =>
    object.tracks.some((track) => track.enabled && track.keyframes.length > 0)
  );
}

export function hasCameraTimelineTracks(timeline: SceneTimelineDocument): boolean {
  return timeline.camera.tracks.some((track) => track.enabled && track.keyframes.length > 0);
}

export function hasObjectTimelineTracks(timeline: SceneTimelineDocument, objectId: string): boolean {
  return Boolean(timeline.objects.find((object) =>
    object.objectId === objectId && object.tracks.some((track) => track.enabled && track.keyframes.length > 0)
  ));
}

export function snapTimelineTime(timeline: SceneTimelineDocument, time: number): number {
  const clamped = clamp(time, 0, timeline.duration);
  if (!timeline.snapEnabled) return roundTime(clamped);
  return roundTime(Math.round(clamped / timeline.snapStep) * timeline.snapStep);
}

export function roundTime(time: number): number {
  return Math.round(time * 1000) / 1000;
}

export function trackLabel(kind: TimelineTrackKind): string {
  return TRACK_LABELS[kind];
}

function normalizeTrack(value: unknown): TimelineTrackDocument | null {
  if (!value || typeof value !== "object") return null;
  const track = value as Partial<TimelineTrackDocument>;
  if (!isTimelineTrackKind(track.kind)) return null;
  return {
    id: typeof track.id === "string" ? track.id : createTimelineId(`track-${track.kind}`),
    kind: track.kind,
    label: typeof track.label === "string" ? track.label : TRACK_LABELS[track.kind],
    enabled: typeof track.enabled === "boolean" ? track.enabled : true,
    keyframes: Array.isArray(track.keyframes)
      ? track.keyframes.map(normalizeKeyframe).filter((keyframe): keyframe is TimelineKeyframeDocument => Boolean(keyframe))
      : []
  };
}

function normalizeKeyframe(value: unknown): TimelineKeyframeDocument | null {
  if (!value || typeof value !== "object") return null;
  const keyframe = value as Partial<TimelineKeyframeDocument>;
  if (!Array.isArray(keyframe.value) || keyframe.value.length !== 3) return null;
  return {
    id: typeof keyframe.id === "string" ? keyframe.id : createTimelineId("keyframe"),
    time: roundTime(finiteNumber(keyframe.time, 0, 0, 120)),
    value: [
      finiteNumber(keyframe.value[0], 0, -10000, 10000),
      finiteNumber(keyframe.value[1], 0, -10000, 10000),
      finiteNumber(keyframe.value[2], 0, -10000, 10000)
    ],
    interpolation: keyframe.interpolation === "hold" || keyframe.interpolation === "smooth" ? keyframe.interpolation : "linear"
  };
}

function createTimelineId(prefix: string): string {
  if (globalThis.crypto && "randomUUID" in globalThis.crypto) return `${prefix}-${globalThis.crypto.randomUUID()}`;
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function isTimelineTrackKind(value: unknown): value is TimelineTrackKind {
  return value === "position" ||
    value === "rotation" ||
    value === "scale" ||
    value === "cameraPosition" ||
    value === "cameraTarget" ||
    value === "cameraLens";
}

function cloneTrackCollection(collection: { tracks: TimelineTrackDocument[] }): { tracks: TimelineTrackDocument[] } {
  return {
    tracks: collection.tracks.map((track) => ({
      ...track,
      keyframes: track.keyframes.map((keyframe) => ({
        ...keyframe,
        value: [...keyframe.value] as [number, number, number]
      }))
    }))
  };
}

function normalizeTrackCollection(value: unknown): CameraTimelineDocument {
  if (!value || typeof value !== "object") return { tracks: [] };
  const collection = value as Partial<CameraTimelineDocument>;
  const tracks = Array.isArray(collection.tracks)
    ? collection.tracks.map(normalizeTrack).filter((track): track is TimelineTrackDocument => Boolean(track))
    : [];
  return { tracks: tracks.filter((track) => track.keyframes.length > 0) };
}

function finiteNumber(value: unknown, fallback: number, min: number, max: number): number {
  const numeric = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return clamp(numeric, min, max);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
