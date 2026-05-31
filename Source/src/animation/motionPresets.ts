import type { AnimationMode, TimelineInterpolation, TimelineTrackKind } from "../editor/types";
import type { ObjectTransformTrackKind } from "./timelineTracks";

type VectorValue = [number, number, number];

export type TimelineMotionPresetId =
  | Exclude<AnimationMode, "none">
  | "turntable"
  | "floatLoop"
  | "popIntro"
  | "productReveal";

export interface TimelineMotionPresetRange {
  start: number;
  quarter: number;
  mid: number;
  threeQuarter: number;
  end: number;
}

export interface TimelineMotionPresetInput {
  position: VectorValue;
  rotation: VectorValue;
  scale: VectorValue;
  phase: number;
  opacity: number;
}

export interface TimelineMotionPresetKeyframe {
  time: number;
  value: VectorValue;
  interpolation?: TimelineInterpolation;
}

export interface TimelineMotionPresetTrack {
  kind: TimelineTrackKind;
  keyframes: TimelineMotionPresetKeyframe[];
}

export interface TimelineMotionPreset {
  id: TimelineMotionPresetId;
  label: string;
  primaryTrack: ObjectTransformTrackKind;
  tracks: TimelineMotionPresetTrack[];
}

const MOTION_PRESET_LABELS: Record<TimelineMotionPresetId, string> = {
  spin: "Spin",
  orbit: "Orbit",
  bounce: "Bounce",
  pulse: "Pulse",
  turntable: "Turntable",
  floatLoop: "Float Loop",
  popIntro: "Pop Intro",
  productReveal: "Product Reveal"
};

export const timelineMotionPresetIds: TimelineMotionPresetId[] = [
  "turntable",
  "floatLoop",
  "popIntro",
  "productReveal"
];

export function timelineMotionPresetLabel(id: TimelineMotionPresetId): string {
  return MOTION_PRESET_LABELS[id];
}

export function buildTimelineMotionPreset(
  id: TimelineMotionPresetId,
  input: TimelineMotionPresetInput,
  range: TimelineMotionPresetRange
): TimelineMotionPreset {
  const { position, rotation, scale, opacity } = input;

  if (id === "spin") {
    return preset(id, "rotation", [
      track("rotation", [
        key(range.start, rotation),
        key(range.end, [rotation[0] + 45, rotation[1] + 360, rotation[2]])
      ])
    ]);
  }

  if (id === "bounce") {
    return preset(id, "position", [
      track("position", [
        key(range.start, position, "smooth"),
        key(range.mid, [position[0], position[1] + 1.25, position[2]], "smooth"),
        key(range.end, position, "smooth")
      ])
    ]);
  }

  if (id === "pulse") {
    return preset(id, "scale", [
      track("scale", [
        key(range.start, scale, "smooth"),
        key(range.mid, [scale[0] * 1.28, scale[1] * 1.28, scale[2] * 1.28], "smooth"),
        key(range.end, scale, "smooth")
      ])
    ]);
  }

  if (id === "orbit") {
    const radius = 1.35 + (input.phase % 1.2);
    return preset(id, "position", [
      track("position", [
        key(range.start, position, "smooth"),
        key(range.quarter, [position[0] + radius, position[1], position[2] + radius], "smooth"),
        key(range.mid, [position[0], position[1], position[2] + radius * 2], "smooth"),
        key(range.threeQuarter, [position[0] - radius, position[1], position[2] + radius], "smooth"),
        key(range.end, position, "smooth")
      ]),
      track("rotation", [
        key(range.start, rotation),
        key(range.end, [rotation[0], rotation[1] + 360, rotation[2]])
      ])
    ]);
  }

  if (id === "turntable") {
    return preset(id, "rotation", [
      track("rotation", [
        key(range.start, rotation),
        key(range.mid, [rotation[0], rotation[1] + 180, rotation[2]]),
        key(range.end, [rotation[0], rotation[1] + 360, rotation[2]])
      ])
    ]);
  }

  if (id === "floatLoop") {
    return preset(id, "position", [
      track("position", [
        key(range.start, position, "smooth"),
        key(range.quarter, [position[0] + 0.18, position[1] + 0.45, position[2]], "smooth"),
        key(range.mid, [position[0], position[1] + 0.72, position[2]], "smooth"),
        key(range.threeQuarter, [position[0] - 0.18, position[1] + 0.45, position[2]], "smooth"),
        key(range.end, position, "smooth")
      ]),
      track("rotation", [
        key(range.start, rotation, "smooth"),
        key(range.mid, [rotation[0], rotation[1] + 8, rotation[2] - 4], "smooth"),
        key(range.end, rotation, "smooth")
      ])
    ]);
  }

  if (id === "popIntro") {
    return preset(id, "scale", [
      track("scale", [
        key(range.start, [scale[0] * 0.08, scale[1] * 0.08, scale[2] * 0.08], "easeOut"),
        key(range.quarter, [scale[0] * 1.16, scale[1] * 1.16, scale[2] * 1.16], "smooth"),
        key(range.mid, scale, "easeIn"),
        key(range.end, scale, "linear")
      ]),
      track("position", [
        key(range.start, [position[0], position[1] - 0.25, position[2]], "easeOut"),
        key(range.mid, position, "smooth"),
        key(range.end, position, "linear")
      ])
    ]);
  }

  return preset(id, "position", [
    track("position", [
      key(range.start, [position[0] - 2, position[1] + 0.35, position[2] + 0.9], "easeOut"),
      key(range.mid, position, "smooth"),
      key(range.end, position, "linear")
    ]),
    track("rotation", [
      key(range.start, [rotation[0], rotation[1] - 35, rotation[2]], "easeOut"),
      key(range.mid, rotation, "smooth"),
      key(range.end, rotation, "linear")
    ]),
    track("scale", [
      key(range.start, [scale[0] * 0.82, scale[1] * 0.82, scale[2] * 0.82], "easeOut"),
      key(range.mid, scale, "smooth"),
      key(range.end, scale, "linear")
    ]),
    track("objectOpacity", [
      key(range.start, [0, 0, 0], "easeOut"),
      key(range.mid, [opacity, 0, 0], "smooth"),
      key(range.end, [opacity, 0, 0], "linear")
    ])
  ]);
}

function preset(id: TimelineMotionPresetId, primaryTrack: ObjectTransformTrackKind, tracks: TimelineMotionPresetTrack[]): TimelineMotionPreset {
  return { id, label: timelineMotionPresetLabel(id), primaryTrack, tracks };
}

function track(kind: TimelineTrackKind, keyframes: TimelineMotionPresetKeyframe[]): TimelineMotionPresetTrack {
  return { kind, keyframes };
}

function key(time: number, value: VectorValue, interpolation?: TimelineInterpolation): TimelineMotionPresetKeyframe {
  return { time, value: [...value] as VectorValue, interpolation };
}
