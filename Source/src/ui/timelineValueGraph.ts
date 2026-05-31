import { evaluateTimelineTrack } from "../animation/interpolation";
import { hasSoloTimelineTracks, isTimelineTrackRuntimeActive } from "../animation/timelineSchema";
import type { SceneTimelineDocument, TimelineTrackDocument, TimelineTrackKind } from "../editor/types";
import { clamp, formatNumber } from "../utils/dom";

export type TimelineAxis = "x" | "y" | "z";
export type TimelineKeySelectionMode = "replace" | "toggle" | "range" | "preserve";

export const TIMELINE_AXES: TimelineAxis[] = ["x", "y", "z"];
export const AXIS_INDEX: Record<TimelineAxis, number> = { x: 0, y: 1, z: 2 };

export interface TimelineValueGraphElements {
  root: HTMLElement;
  toggleButton: HTMLButtonElement;
  panel: HTMLElement;
  title: HTMLElement;
  range: HTMLElement;
  svg: SVGSVGElement;
  marquee: SVGRectElement;
  keyLayer: SVGGElement;
  paths: Record<TimelineAxis, SVGPathElement>;
  playhead: SVGLineElement;
}

export interface TimelineGraphKeySelection {
  keyframeId: string;
  axis: TimelineAxis;
}

export type TimelineGraphSelectionMode = "replace" | "add";

export interface TimelineValueGraphCallbacks {
  onToggle(): void;
  onKeyframeSelected(keyframeId: string, mode: TimelineKeySelectionMode): void;
  onKeyframesMarqueeSelected(keyframes: TimelineGraphKeySelection[], mode: TimelineGraphSelectionMode): void;
  onDragStarted(): void;
  onKeyframeMoved(keyframeId: string, time: number): void;
  onKeyframeValueChanged(keyframeId: string, axis: TimelineAxis, value: number): void;
  onDragFinished(): void;
}

export interface TimelineValueGraphRenderContext {
  timelineDocument: SceneTimelineDocument;
  selectedKind: TimelineTrackKind;
  targetName: string;
  trackLabel: string;
  selectedAxis: TimelineAxis | null;
  selectedKeyframeIds: Set<string>;
  track?: TimelineTrackDocument;
}

type ValueGraphSample = {
  time: number;
  value: [number, number, number];
};

type ValueGraphRange = {
  min: number;
  max: number;
};

type ValueGraphDragKey = {
  keyframeId: string;
  startTime: number;
  startValue: number;
};

type ValueGraphKeyUpdate = {
  keyframeId: string;
  time: number;
  value: number;
};

type ValueGraphPoint = {
  x: number;
  y: number;
};

type ValueGraphDragState = {
  pointerId: number;
  startX: number;
  startY: number;
  startTime: number;
  startValue: number;
  keyframeId: string;
  selectionMode: TimelineKeySelectionMode;
  keyframes: ValueGraphDragKey[];
  axis: TimelineAxis;
  range: ValueGraphRange;
  timeStart: number;
  timeEnd: number;
  duration: number;
  minStartTime: number;
  maxStartTime: number;
  started: boolean;
};

type ValueGraphMarqueeState = {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  start: ValueGraphPoint;
  current: ValueGraphPoint;
  mode: TimelineGraphSelectionMode;
  started: boolean;
};

const GRAPH_VISIBLE_STORAGE_KEY = "geometry-studio-timeline-graph-visible";
const GRAPH_WIDTH = 520;
const GRAPH_HEIGHT = 96;
const GRAPH_SAMPLE_COUNT = 96;

export class TimelineValueGraph {
  private graphVisible = loadTimelineGraphVisible();
  private lastContext: TimelineValueGraphRenderContext | null = null;
  private dragState: ValueGraphDragState | null = null;
  private marqueeState: ValueGraphMarqueeState | null = null;
  private shiftPressed = false;
  private readonly handlePointerMove = (event: PointerEvent) => this.moveGraphKey(event);
  private readonly handlePointerEnd = (event: PointerEvent) => this.finishGraphKeyDrag(event);
  private readonly handleMarqueeMove = (event: PointerEvent) => this.moveGraphMarquee(event);
  private readonly handleMarqueeEnd = (event: PointerEvent) => this.finishGraphMarquee(event);

  constructor(
    private readonly elements: TimelineValueGraphElements,
    private readonly callbacks: TimelineValueGraphCallbacks
  ) {
    this.syncVisibility();
    this.bindEvents();
  }

  get visible(): boolean {
    return this.graphVisible;
  }

  render(context: TimelineValueGraphRenderContext): void {
    this.lastContext = context;
    if (!this.graphVisible) return;

    const { timelineDocument, selectedKind, targetName, trackLabel, selectedAxis, track } = context;
    this.elements.title.textContent = `${targetName} | ${trackLabel}`;
    const [start, end] = graphWorkRange(timelineDocument);
    this.positionPlayhead(timelineDocument.currentTime, start, end);

    if (!track) {
      this.clearGraph("No selected track");
      return;
    }
    if (!track.enabled) {
      this.clearGraph("Track disabled");
      return;
    }
    if (track.keyframes.length < 2) {
      this.clearGraph(`${formatKeyCount(track.keyframes.length)} | add another key`);
      return;
    }
    const soloActive = hasSoloTimelineTracks(timelineDocument);
    if (!isTimelineTrackRuntimeActive(track, soloActive)) {
      this.clearGraph("Muted by solo");
      return;
    }

    const samples = sampleTrack(track, start, end, GRAPH_SAMPLE_COUNT);
    if (!samples.length) {
      this.clearGraph("No graph samples");
      return;
    }

    const axisConfig = trackAxisConfig(selectedKind);
    const focusedAxisIndex = selectedAxis ? AXIS_INDEX[selectedAxis] : null;
    const activeRanges: string[] = [];
    const valueRanges = new Map<TimelineAxis, ValueGraphRange>();
    TIMELINE_AXES.forEach((axis, index) => {
      const axisEnabled = index < axisConfig.enabledAxes && (focusedAxisIndex === null || focusedAxisIndex === index);
      if (!axisEnabled) {
        this.elements.paths[axis].setAttribute("d", "");
        return;
      }
      const values = samples.map((sample) => ({ time: sample.time, value: sample.value[index] }));
      const range = expandedRange([
        ...values.map((sample) => sample.value),
        ...track.keyframes.map((keyframe) => keyframe.value[index])
      ]);
      valueRanges.set(axis, range);
      this.elements.paths[axis].setAttribute("d", graphPath(values, start, end, range));
      activeRanges.push(formatAxisRange(axisConfig.labels[index], values.map((sample) => sample.value)));
    });
    this.renderKeyPoints(context, start, end, valueRanges);
    this.elements.range.textContent = `${formatKeyCount(track.keyframes.length)} | ${formatNumber(start)}-${formatNumber(end)}s | ${activeRanges.join(" | ")}`;
  }

  private bindEvents(): void {
    this.elements.toggleButton.addEventListener("click", () => {
      this.graphVisible = !this.graphVisible;
      storeTimelineGraphVisible(this.graphVisible);
      this.syncVisibility();
      this.callbacks.onToggle();
    });
    this.elements.keyLayer.addEventListener("pointerdown", (event) => this.startGraphKeyDrag(event));
    this.elements.svg.addEventListener("pointerdown", (event) => this.startGraphMarquee(event));
    window.addEventListener("pointermove", this.handlePointerMove);
    window.addEventListener("pointerup", this.handlePointerEnd);
    window.addEventListener("pointercancel", this.handlePointerEnd);
    window.addEventListener("pointermove", this.handleMarqueeMove);
    window.addEventListener("pointerup", this.handleMarqueeEnd);
    window.addEventListener("pointercancel", this.handleMarqueeEnd);
    window.addEventListener("keydown", (event) => {
      if (event.key === "Shift") this.shiftPressed = true;
    });
    window.addEventListener("keyup", (event) => {
      if (event.key === "Shift") this.shiftPressed = false;
    });
  }

  private syncVisibility(): void {
    this.elements.root.classList.toggle("graph-visible", this.graphVisible);
    this.elements.panel.setAttribute("aria-hidden", String(!this.graphVisible));
    this.elements.toggleButton.classList.toggle("active", this.graphVisible);
    this.elements.toggleButton.setAttribute("aria-pressed", String(this.graphVisible));
  }

  private renderKeyPoints(
    context: TimelineValueGraphRenderContext,
    start: number,
    end: number,
    valueRanges: Map<TimelineAxis, ValueGraphRange>
  ): void {
    this.elements.keyLayer.innerHTML = "";
    const track = context.track;
    if (!track) return;
    const axisConfig = trackAxisConfig(context.selectedKind);
    const focusedAxisIndex = context.selectedAxis ? AXIS_INDEX[context.selectedAxis] : null;
    const editable = isGraphEditableTrack(context.selectedKind) && !track.locked;
    [...track.keyframes]
      .sort((left, right) => left.time - right.time)
      .forEach((keyframe) => {
        TIMELINE_AXES.forEach((axis, index) => {
          const range = valueRanges.get(axis);
          const axisEnabled = range && index < axisConfig.enabledAxes && (focusedAxisIndex === null || focusedAxisIndex === index);
          if (!axisEnabled || !range) return;
          const cx = formatNumber(graphX(keyframe.time, start, end));
          const cy = formatNumber(graphY(keyframe.value[index], range));
          const hitTarget = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          hitTarget.classList.add("timeline-graph-key-hit", `graph-${axis}`);
          hitTarget.classList.toggle("locked", !editable);
          hitTarget.dataset.keyframeId = keyframe.id;
          hitTarget.dataset.axis = axis;
          hitTarget.dataset.keyTime = formatNumber(keyframe.time);
          hitTarget.setAttribute("cx", cx);
          hitTarget.setAttribute("cy", cy);
          hitTarget.setAttribute("r", "9");
          hitTarget.setAttribute("aria-hidden", "true");
          this.elements.keyLayer.appendChild(hitTarget);

          const point = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          point.classList.add("timeline-graph-key", `graph-${axis}`);
          point.classList.toggle("selected", context.selectedKeyframeIds.has(keyframe.id));
          point.classList.toggle("locked", !editable);
          point.dataset.keyframeId = keyframe.id;
          point.dataset.axis = axis;
          point.dataset.keyTime = formatNumber(keyframe.time);
          point.setAttribute("cx", cx);
          point.setAttribute("cy", cy);
          point.setAttribute("r", context.selectedKeyframeIds.has(keyframe.id) ? "5" : "4");
          point.setAttribute("role", editable ? "button" : "img");
          point.setAttribute("tabindex", editable ? "0" : "-1");
          point.setAttribute("aria-label", `${editable ? "Edit" : "View"} ${axisConfig.labels[index]} key at ${formatNumber(keyframe.time)} seconds. Ctrl click toggles selection, Shift click selects a time range, Alt drag stretches selected keys, and dragging retimes or edits values.`);
          this.elements.keyLayer.appendChild(point);
        });
      });
  }

  private startGraphKeyDrag(event: PointerEvent): void {
    const target = (event.target as Element | null)?.closest<SVGCircleElement>(".timeline-graph-key, .timeline-graph-key-hit");
    if (!target || target.classList.contains("locked")) return;
    const keyframeId = target.dataset.keyframeId;
    const axis = parseTimelineAxis(target.dataset.axis);
    const context = this.lastContext;
    const keyframe = keyframeId && context?.track ? context.track.keyframes.find((candidate) => candidate.id === keyframeId) : null;
    if (!keyframeId || !axis || !context?.track || !keyframe) return;
    const axisIndex = AXIS_INDEX[axis];
    const range = rangeForKeyframeAxis(context, axis);
    if (!range) return;
    const [timeStart, timeEnd] = graphWorkRange(context.timelineDocument);
    const selectionMode = graphSelectionMode(event, context, keyframeId);
    const selectedKeyframes = context.track.keyframes.filter((candidate) => context.selectedKeyframeIds.has(candidate.id));
    const draggedKeyframes = selectionMode === "preserve" && selectedKeyframes.length > 1 ? selectedKeyframes : [keyframe];
    const dragKeys = draggedKeyframes.map((candidate) => ({
      keyframeId: candidate.id,
      startTime: candidate.time,
      startValue: candidate.value[axisIndex]
    }));
    event.preventDefault();
    this.dragState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startTime: keyframe.time,
      startValue: keyframe.value[axisIndex],
      keyframeId,
      selectionMode,
      keyframes: dragKeys,
      axis,
      range,
      timeStart,
      timeEnd,
      duration: context.timelineDocument.duration,
      minStartTime: Math.min(...dragKeys.map((candidate) => candidate.startTime)),
      maxStartTime: Math.max(...dragKeys.map((candidate) => candidate.startTime)),
      started: false
    };
    this.callbacks.onKeyframeSelected(keyframeId, selectionMode);
  }

  private startGraphMarquee(event: PointerEvent): void {
    if (event.button !== 0 || !this.graphVisible || !this.lastContext?.track) return;
    const target = event.target as Element | null;
    if (target?.closest(".timeline-graph-key, .timeline-graph-key-hit")) return;
    const start = this.graphPointFromPointer(event);
    event.preventDefault();
    this.elements.svg.setPointerCapture?.(event.pointerId);
    this.marqueeState = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      start,
      current: start,
      mode: event.shiftKey || event.ctrlKey || event.metaKey ? "add" : "replace",
      started: false
    };
    this.updateMarqueeRect(start, start);
  }

  private moveGraphKey(event: PointerEvent): void {
    const drag = this.dragState;
    if (!drag || event.pointerId !== drag.pointerId) return;
    const movedDistance = Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY);
    if (!drag.started && movedDistance < 2) return;
    if (!drag.started) {
      drag.started = true;
      this.callbacks.onDragStarted();
    }
    const constrained = this.constrainDragValues(event, drag);
    this.dragKeyUpdates(event, drag, constrained).forEach((update) => {
      this.callbacks.onKeyframeMoved(update.keyframeId, update.time);
      this.callbacks.onKeyframeValueChanged(update.keyframeId, drag.axis, update.value);
    });
    if (this.lastContext) this.render(this.lastContext);
  }

  private moveGraphMarquee(event: PointerEvent): void {
    const marquee = this.marqueeState;
    if (!marquee || event.pointerId !== marquee.pointerId) return;
    const movedDistance = Math.hypot(event.clientX - marquee.startClientX, event.clientY - marquee.startClientY);
    if (!marquee.started && movedDistance < 3) return;
    marquee.started = true;
    marquee.current = this.graphPointFromPointer(event);
    this.updateMarqueeRect(marquee.start, marquee.current);
  }

  private dragKeyUpdates(
    event: PointerEvent,
    drag: ValueGraphDragState,
    constrained: { time: number; value: number }
  ): ValueGraphKeyUpdate[] {
    if (event.altKey && drag.keyframes.length > 1) {
      return stretchKeyUpdates(drag, constrained.time);
    }
    const timeDelta = constrained.time - drag.startTime;
    const valueDelta = constrained.value - drag.startValue;
    return drag.keyframes.map((keyframe) => ({
      keyframeId: keyframe.keyframeId,
      time: keyframe.startTime + timeDelta,
      value: keyframe.startValue + valueDelta
    }));
  }

  private constrainDragValues(event: PointerEvent, drag: ValueGraphDragState): { time: number; value: number } {
    const raw = {
      time: this.timeFromPointer(event, drag.timeStart, drag.timeEnd),
      value: this.valueFromPointer(event, drag.range)
    };
    raw.time = event.altKey ? constrainedStretchTargetTime(raw.time, drag) : constrainedGroupTime(raw.time, drag);
    if (event.altKey && drag.keyframes.length > 1) return { time: raw.time, value: drag.startValue };
    if (!event.shiftKey && !this.shiftPressed) return raw;
    const deltaX = Math.abs(event.clientX - drag.startX);
    const deltaY = Math.abs(event.clientY - drag.startY);
    return deltaX >= deltaY
      ? { time: raw.time, value: drag.startValue }
      : { time: drag.startTime, value: raw.value };
  }

  private finishGraphKeyDrag(event: PointerEvent): void {
    const drag = this.dragState;
    if (!drag || event.pointerId !== drag.pointerId) return;
    this.dragState = null;
    if (drag.started) {
      this.callbacks.onDragFinished();
    } else if (drag.selectionMode === "preserve") {
      this.callbacks.onKeyframeSelected(drag.keyframeId, "replace");
    }
  }

  private finishGraphMarquee(event: PointerEvent): void {
    const marquee = this.marqueeState;
    if (!marquee || event.pointerId !== marquee.pointerId) return;
    this.marqueeState = null;
    this.elements.svg.releasePointerCapture?.(event.pointerId);
    this.hideMarqueeRect();
    if (!marquee.started) return;

    const current = this.graphPointFromPointer(event);
    const bounds = normalizedRect(marquee.start, current);
    const selected = this.keyframesInGraphRect(bounds);
    if (selected.length > 0 || marquee.mode === "replace") {
      this.callbacks.onKeyframesMarqueeSelected(selected, marquee.mode);
    }
  }

  private valueFromPointer(event: PointerEvent, range: ValueGraphRange): number {
    const rect = this.elements.svg.getBoundingClientRect();
    const graphYPosition = clamp(((event.clientY - rect.top) / Math.max(rect.height, 1)) * GRAPH_HEIGHT, 0, GRAPH_HEIGHT);
    return valueFromGraphY(graphYPosition, range);
  }

  private timeFromPointer(event: PointerEvent, start: number, end: number): number {
    const rect = this.elements.svg.getBoundingClientRect();
    const graphXPosition = clamp(((event.clientX - rect.left) / Math.max(rect.width, 1)) * GRAPH_WIDTH, 0, GRAPH_WIDTH);
    return timeFromGraphX(graphXPosition, start, end);
  }

  private graphPointFromPointer(event: PointerEvent): ValueGraphPoint {
    const rect = this.elements.svg.getBoundingClientRect();
    return {
      x: clamp(((event.clientX - rect.left) / Math.max(rect.width, 1)) * GRAPH_WIDTH, 0, GRAPH_WIDTH),
      y: clamp(((event.clientY - rect.top) / Math.max(rect.height, 1)) * GRAPH_HEIGHT, 0, GRAPH_HEIGHT)
    };
  }

  private updateMarqueeRect(start: ValueGraphPoint, current: ValueGraphPoint): void {
    const rect = normalizedRect(start, current);
    this.elements.marquee.classList.add("active");
    this.elements.marquee.setAttribute("x", formatNumber(rect.x));
    this.elements.marquee.setAttribute("y", formatNumber(rect.y));
    this.elements.marquee.setAttribute("width", formatNumber(rect.width));
    this.elements.marquee.setAttribute("height", formatNumber(rect.height));
  }

  private hideMarqueeRect(): void {
    this.elements.marquee.classList.remove("active");
    this.elements.marquee.setAttribute("width", "0");
    this.elements.marquee.setAttribute("height", "0");
  }

  private keyframesInGraphRect(rect: { x: number; y: number; width: number; height: number }): TimelineGraphKeySelection[] {
    const x2 = rect.x + rect.width;
    const y2 = rect.y + rect.height;
    const selected: TimelineGraphKeySelection[] = [];
    const seen = new Set<string>();
    this.elements.keyLayer.querySelectorAll<SVGCircleElement>(".timeline-graph-key:not(.locked)").forEach((point) => {
      const keyframeId = point.dataset.keyframeId;
      const axis = parseTimelineAxis(point.dataset.axis);
      const cx = Number(point.getAttribute("cx"));
      const cy = Number(point.getAttribute("cy"));
      if (!keyframeId || !axis || !Number.isFinite(cx) || !Number.isFinite(cy)) return;
      if (cx < rect.x || cx > x2 || cy < rect.y || cy > y2 || seen.has(keyframeId)) return;
      seen.add(keyframeId);
      selected.push({ keyframeId, axis });
    });
    return selected;
  }

  private positionPlayhead(currentTime: number, start: number, end: number): void {
    const x = graphX(clamp(currentTime, start, end), start, end);
    this.elements.playhead.setAttribute("x1", formatNumber(x));
    this.elements.playhead.setAttribute("x2", formatNumber(x));
  }

  private clearGraph(message: string): void {
    TIMELINE_AXES.forEach((axis) => this.elements.paths[axis].setAttribute("d", ""));
    this.elements.keyLayer.innerHTML = "";
    this.elements.range.textContent = message;
  }
}

export function trackAxisConfig(kind: TimelineTrackKind): { labels: [string, string, string]; enabledAxes: 1 | 2 | 3 } {
  if (kind === "objectColor" || kind.endsWith("Color")) return { labels: ["R", "G", "B"], enabledAxes: 3 };
  if (kind === "cameraLens") return { labels: ["FOV", "Near", "Far"], enabledAxes: 3 };
  if (kind === "objectTextureRepeat" || kind === "objectTextureOffset") return { labels: ["U", "V", "-"], enabledAxes: 2 };
  if (
    kind === "objectOpacity" ||
    kind === "objectRoughness" ||
    kind === "objectMetalness" ||
    kind === "objectTextureSource" ||
    kind === "objectTextureRotation" ||
    kind === "objectVisibility" ||
    kind.endsWith("Intensity")
  ) {
    return { labels: ["Value", "-", "-"], enabledAxes: 1 };
  }
  return { labels: ["X", "Y", "Z"], enabledAxes: 3 };
}

function rangeForKeyframeAxis(context: TimelineValueGraphRenderContext, axis: TimelineAxis): ValueGraphRange | null {
  const track = context.track;
  if (!track) return null;
  const [start, end] = graphWorkRange(context.timelineDocument);
  const index = AXIS_INDEX[axis];
  const values = sampleTrack(track, start, end, GRAPH_SAMPLE_COUNT).map((sample) => sample.value[index]);
  return expandedRange([...values, ...track.keyframes.map((keyframe) => keyframe.value[index])]);
}

function graphWorkRange(timelineDocument: SceneTimelineDocument): [number, number] {
  const duration = Math.max(timelineDocument.duration, 0.5);
  const start = clamp(Number.isFinite(timelineDocument.workStart) ? timelineDocument.workStart : 0, 0, duration);
  const end = clamp(Number.isFinite(timelineDocument.workEnd) ? timelineDocument.workEnd : duration, 0, duration);
  return end > start ? [start, end] : [0, duration];
}

function sampleTrack(track: TimelineTrackDocument, start: number, end: number, count: number): ValueGraphSample[] {
  const safeCount = Math.max(2, Math.round(count));
  const samples: ValueGraphSample[] = [];
  for (let index = 0; index < safeCount; index += 1) {
    const time = start + ((end - start) * index) / (safeCount - 1);
    const value = evaluateTimelineTrack(track, time);
    if (value) samples.push({ time, value });
  }
  return samples;
}

function graphPath(samples: { time: number; value: number }[], start: number, end: number, range: ValueGraphRange): string {
  if (!samples.length) return "";
  return samples.map((sample, index) => {
    const command = index === 0 ? "M" : "L";
    return `${command}${formatNumber(graphX(sample.time, start, end))} ${formatNumber(graphY(sample.value, range))}`;
  }).join(" ");
}

function graphX(time: number, start: number, end: number): number {
  return ((time - start) / Math.max(end - start, 0.001)) * GRAPH_WIDTH;
}

function timeFromGraphX(x: number, start: number, end: number): number {
  return start + (clamp(x, 0, GRAPH_WIDTH) / GRAPH_WIDTH) * Math.max(end - start, 0.001);
}

function graphY(value: number, range: ValueGraphRange): number {
  const span = range.max - range.min;
  if (span <= 0.001) return GRAPH_HEIGHT / 2;
  const padding = 10;
  return GRAPH_HEIGHT - padding - ((value - range.min) / span) * (GRAPH_HEIGHT - padding * 2);
}

function normalizedRect(start: ValueGraphPoint, current: ValueGraphPoint): { x: number; y: number; width: number; height: number } {
  const x = Math.min(start.x, current.x);
  const y = Math.min(start.y, current.y);
  return {
    x,
    y,
    width: Math.abs(current.x - start.x),
    height: Math.abs(current.y - start.y)
  };
}

function valueFromGraphY(y: number, range: ValueGraphRange): number {
  const padding = 10;
  const drawable = GRAPH_HEIGHT - padding * 2;
  const normalized = clamp((GRAPH_HEIGHT - padding - y) / drawable, 0, 1);
  return range.min + (range.max - range.min) * normalized;
}

function graphSelectionMode(
  event: PointerEvent,
  context: TimelineValueGraphRenderContext,
  keyframeId: string
): TimelineKeySelectionMode {
  if (event.shiftKey) return "range";
  if (event.ctrlKey || event.metaKey) return "toggle";
  if (context.selectedKeyframeIds.size > 1 && context.selectedKeyframeIds.has(keyframeId)) return "preserve";
  return "replace";
}

function constrainedGroupTime(time: number, drag: ValueGraphDragState): number {
  if (drag.keyframes.length <= 1) return time;
  const minDelta = -drag.minStartTime;
  const maxDelta = Math.max(0, drag.duration - drag.maxStartTime);
  const delta = clamp(time - drag.startTime, minDelta, maxDelta);
  return drag.startTime + delta;
}

function constrainedStretchTargetTime(time: number, drag: ValueGraphDragState): number {
  if (drag.keyframes.length <= 1) return time;
  const anchor = stretchAnchorTime(drag);
  const denominator = drag.startTime - anchor;
  if (Math.abs(denominator) < 0.001) return constrainedGroupTime(time, drag);
  const desiredScale = (time - anchor) / denominator;
  const scale = clamp(desiredScale, 0.05, maxStretchScale(drag, anchor));
  return anchor + denominator * scale;
}

function stretchKeyUpdates(drag: ValueGraphDragState, targetTime: number): ValueGraphKeyUpdate[] {
  const anchor = stretchAnchorTime(drag);
  const denominator = drag.startTime - anchor;
  if (Math.abs(denominator) < 0.001) {
    const timeDelta = constrainedGroupTime(targetTime, drag) - drag.startTime;
    return drag.keyframes.map((keyframe) => ({
      keyframeId: keyframe.keyframeId,
      time: keyframe.startTime + timeDelta,
      value: keyframe.startValue
    }));
  }

  const scale = clamp((targetTime - anchor) / denominator, 0.05, maxStretchScale(drag, anchor));
  return drag.keyframes.map((keyframe) => ({
    keyframeId: keyframe.keyframeId,
    time: anchor + (keyframe.startTime - anchor) * scale,
    value: keyframe.startValue
  }));
}

function stretchAnchorTime(drag: ValueGraphDragState): number {
  const distanceToMin = Math.abs(drag.startTime - drag.minStartTime);
  const distanceToMax = Math.abs(drag.maxStartTime - drag.startTime);
  return distanceToMin >= distanceToMax ? drag.minStartTime : drag.maxStartTime;
}

function maxStretchScale(drag: ValueGraphDragState, anchor: number): number {
  const farthest = anchor === drag.minStartTime ? drag.maxStartTime : drag.minStartTime;
  const denominator = farthest - anchor;
  if (Math.abs(denominator) < 0.001) return 1;
  const boundary = denominator > 0 ? drag.duration : 0;
  return Math.max(0.05, Math.abs((boundary - anchor) / denominator));
}

function expandedRange(values: number[]): ValueGraphRange {
  const finiteValues = values.filter(Number.isFinite);
  if (!finiteValues.length) return { min: -1, max: 1 };
  const min = Math.min(...finiteValues);
  const max = Math.max(...finiteValues);
  const span = max - min;
  if (span <= 0.001) {
    const pad = Math.max(Math.abs(max) * 0.25, 1);
    return { min: min - pad, max: max + pad };
  }
  const pad = span * 0.2;
  return { min: min - pad, max: max + pad };
}

function formatAxisRange(label: string, values: number[]): string {
  if (!values.length) return `${label} --`;
  return `${label} ${formatNumber(Math.min(...values))}..${formatNumber(Math.max(...values))}`;
}

function formatKeyCount(count: number): string {
  return `${count} key${count === 1 ? "" : "s"}`;
}

function parseTimelineAxis(value: string | undefined): TimelineAxis | null {
  return value === "x" || value === "y" || value === "z" ? value : null;
}

function isGraphEditableTrack(kind: TimelineTrackKind): boolean {
  return kind !== "objectVisibility" && kind !== "objectTextureSource";
}

function loadTimelineGraphVisible(): boolean {
  try {
    return window.localStorage.getItem(GRAPH_VISIBLE_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function storeTimelineGraphVisible(visible: boolean): void {
  try {
    window.localStorage.setItem(GRAPH_VISIBLE_STORAGE_KEY, String(visible));
  } catch {
    // Graph visibility is an editor preference; blocked storage should not affect timeline editing.
  }
}
