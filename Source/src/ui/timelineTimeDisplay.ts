import { formatNumber } from "../utils/dom";

export type TimelineTimeDisplayMode = "timecode" | "frames" | "seconds";

export function parseTimelineTimeDisplayMode(value: string | null): TimelineTimeDisplayMode {
  return value === "frames" || value === "seconds" || value === "timecode" ? value : "timecode";
}

export function timelineTimeDisplayLabel(mode: TimelineTimeDisplayMode): string {
  if (mode === "frames") return "Frames";
  if (mode === "seconds") return "Seconds";
  return "Timecode";
}

export function formatTimelineReadout(time: number, fps: number, mode: TimelineTimeDisplayMode): string {
  if (mode === "frames") return `${formatTimelineFrame(time, fps)} | ${formatTimelineSeconds(time)}`;
  if (mode === "seconds") return `${formatTimelineSeconds(time)} | ${formatTimelineFrame(time, fps)}`;
  return `${formatTimelineTimecode(time, fps)} | ${formatTimelineFrame(time, fps)}`;
}

export function formatTimelineRulerTick(time: number, fps: number, mode: TimelineTimeDisplayMode): string {
  if (mode === "frames") return formatTimelineFrame(time, fps);
  if (mode === "seconds") return formatTimelineSeconds(time);
  return formatTimelineTimecode(time, fps);
}

export function formatTimelineFrame(time: number, fps: number): string {
  return `F${String(absoluteFrame(time, fps)).padStart(4, "0")}`;
}

export function formatTimelineTimecode(time: number, fps: number): string {
  const safeFps = normalizedFps(fps);
  const frame = absoluteFrame(time, safeFps);
  const totalSeconds = Math.floor(frame / safeFps);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const frameWithinSecond = frame % safeFps;
  return `${pad2(minutes)}:${pad2(seconds)}:${pad2(frameWithinSecond)}`;
}

function formatTimelineSeconds(time: number): string {
  return `${formatNumber(time)}s`;
}

function absoluteFrame(time: number, fps: number): number {
  return Math.max(0, Math.round(time * normalizedFps(fps)));
}

function normalizedFps(fps: number): number {
  return Number.isFinite(fps) && fps > 0 ? Math.round(fps) : 30;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}
