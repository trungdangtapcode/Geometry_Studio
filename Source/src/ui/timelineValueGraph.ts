import { evaluateTimelineTrack } from "../animation/interpolation";
import type { SceneTimelineDocument, TimelineTrackDocument, TimelineTrackKind } from "../editor/types";
import { clamp, formatNumber } from "../utils/dom";

export type TimelineAxis = "x" | "y" | "z";

export const TIMELINE_AXES: TimelineAxis[] = ["x", "y", "z"];
export const AXIS_INDEX: Record<TimelineAxis, number> = { x: 0, y: 1, z: 2 };

export interface TimelineValueGraphElements {
  root: HTMLElement;
  toggleButton: HTMLButtonElement;
  panel: HTMLElement;
  title: HTMLElement;
  range: HTMLElement;
  svg: SVGSVGElement;
  keyLayer: SVGGElement;
  paths: Record<TimelineAxis, SVGPathElement>;
  playhead: SVGLineElement;
}

export interface TimelineValueGraphCallbacks {
  onToggle(): void;
  onKeyframeSelected(keyframeId: string): void;
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

type ValueGraphDragState = {
  pointerId: number;
  startX: number;
  startY: number;
  keyframeId: string;
  axis: TimelineAxis;
  range: ValueGraphRange;
  timeStart: number;
  timeEnd: number;
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
  private readonly handlePointerMove = (event: PointerEvent) => this.moveGraphKey(event);
  private readonly handlePointerEnd = (event: PointerEvent) => this.finishGraphKeyDrag(event);

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
    window.addEventListener("pointermove", this.handlePointerMove);
    window.addEventListener("pointerup", this.handlePointerEnd);
    window.addEventListener("pointercancel", this.handlePointerEnd);
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
    const editable = isGraphEditableTrack(context.selectedKind);
    [...track.keyframes]
      .sort((left, right) => left.time - right.time)
      .forEach((keyframe) => {
        TIMELINE_AXES.forEach((axis, index) => {
          const range = valueRanges.get(axis);
          const axisEnabled = range && index < axisConfig.enabledAxes && (focusedAxisIndex === null || focusedAxisIndex === index);
          if (!axisEnabled || !range) return;
          const point = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          point.classList.add("timeline-graph-key", `graph-${axis}`);
          point.classList.toggle("selected", context.selectedKeyframeIds.has(keyframe.id));
          point.classList.toggle("locked", !editable);
          point.dataset.keyframeId = keyframe.id;
          point.dataset.axis = axis;
          point.dataset.keyTime = formatNumber(keyframe.time);
          point.setAttribute("cx", formatNumber(graphX(keyframe.time, start, end)));
          point.setAttribute("cy", formatNumber(graphY(keyframe.value[index], range)));
          point.setAttribute("r", context.selectedKeyframeIds.has(keyframe.id) ? "5" : "4");
          point.setAttribute("role", editable ? "button" : "img");
          point.setAttribute("tabindex", editable ? "0" : "-1");
          point.setAttribute("aria-label", `${editable ? "Edit" : "View"} ${axisConfig.labels[index]} key at ${formatNumber(keyframe.time)} seconds. Drag horizontally to retime and vertically to edit value.`);
          this.elements.keyLayer.appendChild(point);
        });
      });
  }

  private startGraphKeyDrag(event: PointerEvent): void {
    const target = (event.target as Element | null)?.closest<SVGCircleElement>(".timeline-graph-key");
    if (!target || target.classList.contains("locked")) return;
    const keyframeId = target.dataset.keyframeId;
    const axis = parseTimelineAxis(target.dataset.axis);
    const context = this.lastContext;
    const keyframe = keyframeId && context?.track ? context.track.keyframes.find((candidate) => candidate.id === keyframeId) : null;
    if (!keyframeId || !axis || !context?.track || !keyframe) return;
    const range = rangeForKeyframeAxis(context, axis);
    if (!range) return;
    const [timeStart, timeEnd] = graphWorkRange(context.timelineDocument);
    event.preventDefault();
    this.dragState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      keyframeId,
      axis,
      range,
      timeStart,
      timeEnd,
      started: false
    };
    this.callbacks.onKeyframeSelected(keyframeId);
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
    const time = this.timeFromPointer(event, drag.timeStart, drag.timeEnd);
    const value = this.valueFromPointer(event, drag.range);
    this.callbacks.onKeyframeMoved(drag.keyframeId, time);
    this.callbacks.onKeyframeValueChanged(drag.keyframeId, drag.axis, value);
    if (this.lastContext) this.render(this.lastContext);
  }

  private finishGraphKeyDrag(event: PointerEvent): void {
    const drag = this.dragState;
    if (!drag || event.pointerId !== drag.pointerId) return;
    this.dragState = null;
    if (drag.started) this.callbacks.onDragFinished();
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

function valueFromGraphY(y: number, range: ValueGraphRange): number {
  const padding = 10;
  const drawable = GRAPH_HEIGHT - padding * 2;
  const normalized = clamp((GRAPH_HEIGHT - padding - y) / drawable, 0, 1);
  return range.min + (range.max - range.min) * normalized;
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
  return kind !== "objectVisibility";
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
