export interface TimelineTimeParseOptions {
  fps: number;
  baseTime?: number;
}

const DECIMAL_VALUE = String.raw`(?:\d+(?:\.\d+)?|\.\d+)`;
const FRAME_SUFFIX = new RegExp(`^(?<value>${DECIMAL_VALUE})\\s*(?:f|fr|frame|frames)$`, "i");
const SECOND_SUFFIX = new RegExp(`^(?<value>${DECIMAL_VALUE})\\s*(?:s|sec|secs|second|seconds)$`, "i");
const NUMBER_VALUE = new RegExp(`^${DECIMAL_VALUE}$`);

export function parseTimelineTimeInput(input: string, options: TimelineTimeParseOptions): number | null {
  const raw = input.trim().toLowerCase();
  if (!raw) return null;

  const sign = raw.startsWith("+") ? 1 : raw.startsWith("-") ? -1 : 0;
  const expression = sign === 0 ? raw : raw.slice(1).trim();
  if (!expression) return null;

  const parsed = parseAbsoluteTimelineTime(expression, safeFps(options.fps));
  if (parsed === null) return null;
  if (sign === 0) return parsed;
  return Math.max(0, (options.baseTime ?? 0) + parsed * sign);
}

export function timelineTimeInputHelp(fps: number): string {
  return `Accepts seconds, frames like 45f, timecode like 00:00:02:15 at ${safeFps(fps)} FPS, or relative offsets like +10f.`;
}

function parseAbsoluteTimelineTime(input: string, fps: number): number | null {
  const frameMatch = input.match(FRAME_SUFFIX);
  if (frameMatch?.groups?.value) return Number(frameMatch.groups.value) / fps;

  const secondMatch = input.match(SECOND_SUFFIX);
  if (secondMatch?.groups?.value) return Number(secondMatch.groups.value);

  if (NUMBER_VALUE.test(input)) return Number(input);

  if (input.includes(":")) return parseTimecode(input, fps);
  return null;
}

function parseTimecode(input: string, fps: number): number | null {
  const parts = input.split(":").map((part) => part.trim());
  if (parts.length < 2 || parts.length > 4 || parts.some((part) => !/^\d+$/.test(part))) return null;

  const values = parts.map(Number);
  if (values.some((value) => !Number.isFinite(value))) return null;

  if (values.length === 2) {
    const [minutes, seconds] = values;
    if (seconds >= 60) return null;
    return minutes * 60 + seconds;
  }

  if (values.length === 3) {
    const [minutes, seconds, frames] = values;
    if (seconds >= 60) return null;
    return minutes * 60 + seconds + frames / fps;
  }

  const [hours, minutes, seconds, frames] = values;
  if (minutes >= 60 || seconds >= 60) return null;
  return hours * 3600 + minutes * 60 + seconds + frames / fps;
}

function safeFps(fps: number): number {
  return Number.isFinite(fps) && fps > 0 ? Math.round(fps) : 30;
}
