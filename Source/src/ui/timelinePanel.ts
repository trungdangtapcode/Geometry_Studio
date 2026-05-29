import {
  Timeline,
  type TimelineKeyframe,
  TimelineKeyframeShape,
  type TimelineModel,
  type TimelineRow
} from "animation-timeline-js";
import type {
  SceneEntry,
  SceneTimelineDocument,
  TimelineInterpolation,
  TimelineKeyframeDocument,
  TimelineMarkerDocument,
  TimelineTrackDocument,
  TimelineTrackKind
} from "../editor/types";
import { clamp, formatNumber, hydrateIcons, query } from "../utils/dom";
import {
  AXIS_INDEX,
  TimelineValueGraph,
  TIMELINE_AXES,
  trackAxisConfig,
  type TimelineAxis,
  type TimelineKeySelectionMode
} from "./timelineValueGraph";

type TimelineSettingsPatch = Partial<Pick<SceneTimelineDocument, "duration" | "workStart" | "workEnd" | "fps" | "loop" | "snapEnabled" | "snapStep" | "autoKey">>;

export interface KeyframeTimelineCallbacks {
  onTimeChanged(time: number): void;
  onAddKeyframe(kind: TimelineTrackKind): void;
  onSetTransformKeyframes(): void;
  onDeleteKeyframes(keyframeIds: string[]): void;
  onCopyKeyframes(keyframeIds: string[]): void;
  onPasteKeyframes(): void;
  onDuplicateKeyframes(keyframeIds: string[]): void;
  onNudgeKeyframes(direction: -1 | 1, keyframeIds: string[]): void;
  onEditKeyframes(keyframeIds: string[], patch: TimelineKeyframeEditPatch): void;
  onAddMarker(label: string): void;
  onDeleteMarker(markerId: string | null): void;
  onRenameMarker(markerId: string, label: string): void;
  onStepMarker(direction: -1 | 1): void;
  onClearTrack(kind: TimelineTrackKind): void;
  onToggleTrack(kind: TimelineTrackKind): void;
  onTrackKindChanged(): void;
  onTrackLabelSelected(targetId: string, kind: TimelineTrackKind): void;
  onStepKeyframe(direction: -1 | 1): void;
  onStepFrame(direction: -1 | 1): void;
  onSetInterpolation(keyframeIds: string[], interpolation: TimelineInterpolation): void;
  onDragStarted(): void;
  onKeyframeMoved(keyframeId: string, time: number): void;
  onKeyframeValueChanged(keyframeId: string, axis: TimelineAxis, value: number): void;
  onDragFinished(): void;
  onSettingsChanged(patch: TimelineSettingsPatch): void;
  onTogglePlayback(): void;
}

export interface TimelineKeyframeEditPatch {
  time?: number;
  value?: Partial<Record<"x" | "y" | "z", number>>;
}

type TimelineUiKeyframe = TimelineKeyframe & {
  id: string;
  targetId: string;
  trackKind: TimelineTrackKind;
  axis?: TimelineAxis;
};

type TimelineUiRow = TimelineRow & {
  targetId: string;
  trackKind: TimelineTrackKind;
  axis?: TimelineAxis;
};

type TimelineRowFilter = "focus" | "keyed" | "all";
type TimelineRowDescriptor = {
  kind: TimelineTrackKind;
  axis?: TimelineAxis;
};

type TimelineDetailSource = {
  targetName: string;
  track: TimelineTrackDocument;
  keyframe: TimelineKeyframeDocument;
};

const OBJECT_TRACKS: TimelineTrackKind[] = [
  "position",
  "rotation",
  "scale",
  "objectColor",
  "objectOpacity",
  "objectRoughness",
  "objectMetalness",
  "objectTextureRepeat",
  "objectTextureOffset",
  "objectTextureRotation",
  "objectVisibility"
];
const CAMERA_TRACKS: TimelineTrackKind[] = ["cameraPosition", "cameraTarget", "cameraLens"];
const LIGHT_TRACKS: TimelineTrackKind[] = [
  "directionalPosition",
  "directionalColor",
  "directionalIntensity",
  "pointPosition",
  "pointColor",
  "pointIntensity",
  "spotPosition",
  "spotColor",
  "spotIntensity",
  "ambientIntensity"
];
const CAMERA_TARGET_ID = "__camera__";
const LIGHT_TARGET_ID = "__lights__";
const ROW_FILTER_STORAGE_KEY = "geometry-studio-timeline-row-filter";
const DOCK_HEIGHT_STORAGE_KEY = "geometry-studio-timeline-dock-height";
const MIN_DOCK_HEIGHT = 190;
const DEFAULT_ROW_HEIGHT = 30;
const DEFAULT_HEADER_HEIGHT = 28;
const OBJECT_AXIS_TRACKS = new Set<TimelineTrackKind>(["position", "rotation", "scale"]);

const TRACK_COLORS: Record<TimelineTrackKind, string> = {
  position: "#20bfa9",
  rotation: "#f4ad2f",
  scale: "#7c70f4",
  objectColor: "#df6b80",
  objectOpacity: "#64748b",
  objectRoughness: "#8b5cf6",
  objectMetalness: "#0f766e",
  objectTextureRepeat: "#d97706",
  objectTextureOffset: "#0891b2",
  objectTextureRotation: "#be123c",
  objectVisibility: "#16a34a",
  cameraPosition: "#4f8df7",
  cameraTarget: "#a86de8",
  cameraLens: "#df6b80",
  directionalPosition: "#f7bd4b",
  directionalColor: "#f39c12",
  directionalIntensity: "#d98f00",
  pointPosition: "#60c0ff",
  pointColor: "#2f9de8",
  pointIntensity: "#1479b8",
  spotPosition: "#fb7185",
  spotColor: "#df6b80",
  spotIntensity: "#b8394e",
  ambientIntensity: "#8393a2"
};

const TRACK_LABELS: Record<TimelineTrackKind, string> = {
  position: "Position",
  rotation: "Rotation",
  scale: "Scale",
  objectColor: "Color",
  objectOpacity: "Opacity",
  objectRoughness: "Roughness",
  objectMetalness: "Metalness",
  objectTextureRepeat: "Texture Repeat",
  objectTextureOffset: "Texture Offset",
  objectTextureRotation: "Texture Rotation",
  objectVisibility: "Visibility",
  cameraPosition: "Camera Position",
  cameraTarget: "Camera Target",
  cameraLens: "Camera Lens",
  directionalPosition: "Sun Position",
  directionalColor: "Sun Color",
  directionalIntensity: "Sun Intensity",
  pointPosition: "Point Position",
  pointColor: "Point Color",
  pointIntensity: "Point Intensity",
  spotPosition: "Spot Position",
  spotColor: "Spot Color",
  spotIntensity: "Spot Intensity",
  ambientIntensity: "Ambient Intensity"
};

export class KeyframeTimelinePanel {
  private readonly timeline: Timeline;
  private readonly root = query<HTMLElement>("#keyframe-dock");
  private readonly resizeHandle = query<HTMLButtonElement>("#timeline-resize-handle");
  private readonly labels = query<HTMLDivElement>("#timeline-track-labels");
  private readonly markerStrip = query<HTMLDivElement>("#timeline-marker-strip");
  private readonly canvasHost = query<HTMLDivElement>("#timeline-canvas");
  private readonly trackSelect = query<HTMLSelectElement>("#timeline-track-kind");
  private readonly rowFilterSelect = query<HTMLSelectElement>("#timeline-row-filter");
  private readonly playButton = query<HTMLButtonElement>("#timeline-play-toggle");
  private readonly addKeyframeButton = query<HTMLButtonElement>("#timeline-add-keyframe");
  private readonly setTransformButton = query<HTMLButtonElement>("#timeline-set-transform");
  private readonly toggleTrackButton = query<HTMLButtonElement>("#timeline-toggle-track");
  private readonly timeInput = query<HTMLInputElement>("#timeline-current-time");
  private readonly durationInput = query<HTMLInputElement>("#timeline-duration");
  private readonly workStartInput = query<HTMLInputElement>("#timeline-work-start");
  private readonly workEndInput = query<HTMLInputElement>("#timeline-work-end");
  private readonly fpsInput = query<HTMLInputElement>("#timeline-fps");
  private readonly snapInput = query<HTMLInputElement>("#timeline-snap");
  private readonly autoKeyInput = query<HTMLInputElement>("#timeline-auto-key");
  private readonly loopInput = query<HTMLInputElement>("#timeline-loop");
  private readonly snapStepInput = query<HTMLInputElement>("#timeline-snap-step");
  private readonly interpolationSelect = query<HTMLSelectElement>("#timeline-interpolation");
  private readonly easePath = query<SVGPathElement>("#timeline-ease-path");
  private readonly easeLabel = query<HTMLSpanElement>("#timeline-ease-label");
  private readonly selectionLabel = query<HTMLSpanElement>("#timeline-selection");
  private readonly timecodeLabel = query<HTMLSpanElement>("#timeline-timecode");
  private readonly keyframeLabel = query<HTMLElement>("#timeline-key-label");
  private readonly keyframeTimeInput = query<HTMLInputElement>("#timeline-key-time");
  private readonly keyframeValueInputs = {
    x: query<HTMLInputElement>("#timeline-key-x"),
    y: query<HTMLInputElement>("#timeline-key-y"),
    z: query<HTMLInputElement>("#timeline-key-z")
  };
  private readonly keyframeAxisLabels = {
    x: query<HTMLElement>("#timeline-key-x-label"),
    y: query<HTMLElement>("#timeline-key-y-label"),
    z: query<HTMLElement>("#timeline-key-z-label")
  };
  private readonly markerLabelInput = query<HTMLInputElement>("#timeline-marker-label");
  private selectedKeyframeIds = new Set<string>();
  private lastTimelineDocument: SceneTimelineDocument | null = null;
  private lastEntries: SceneEntry[] = [];
  private lastSelectedId = "";
  private lastPlaying = false;
  private lastEntryNames = new Map<string, string>();
  private activeMarkerId: string | null = null;
  private selectedAxis: TimelineAxis | null = null;
  private rowFilter: TimelineRowFilter = loadTimelineRowFilter();
  private readonly valueGraph: TimelineValueGraph;
  private resizeState: { pointerId: number; startY: number; startHeight: number } | null = null;
  private timelineScroller: HTMLElement | null = null;
  private syncingScroll = false;
  private updating = false;
  private readonly handleResizeMove = (event: PointerEvent) => this.resizeDock(event);
  private readonly handleResizeEnd = (event: PointerEvent) => this.finishResize(event);
  private readonly handleTimelineScroll = () => this.syncLabelsFromCanvasScroll();

  constructor(private readonly callbacks: KeyframeTimelineCallbacks) {
    this.applyStoredDockHeight();
    this.valueGraph = new TimelineValueGraph({
      root: this.root,
      toggleButton: query<HTMLButtonElement>("#timeline-graph-toggle"),
      panel: query<HTMLDivElement>("#timeline-graph-panel"),
      title: query<HTMLElement>("#timeline-graph-title"),
      range: query<HTMLElement>("#timeline-graph-range"),
      svg: query<SVGSVGElement>("#timeline-value-graph"),
      keyLayer: query<SVGGElement>("#timeline-graph-keys"),
      paths: {
        x: query<SVGPathElement>("#timeline-graph-x"),
        y: query<SVGPathElement>("#timeline-graph-y"),
        z: query<SVGPathElement>("#timeline-graph-z")
      },
      playhead: query<SVGLineElement>("#timeline-graph-playhead")
    }, {
      onToggle: () => {
        if (this.lastTimelineDocument) this.renderGraph(this.lastTimelineDocument, this.lastSelectedId);
        window.setTimeout(() => this.refreshCanvas(), 0);
      },
      onKeyframeSelected: (keyframeId, mode) => this.selectGraphKeyframe(keyframeId, mode),
      onDragStarted: () => this.callbacks.onDragStarted(),
      onKeyframeMoved: (keyframeId, time) => this.callbacks.onKeyframeMoved(keyframeId, time),
      onKeyframeValueChanged: (keyframeId, axis, value) => this.callbacks.onKeyframeValueChanged(keyframeId, axis, value),
      onDragFinished: () => this.callbacks.onDragFinished()
    });
    this.timeline = new Timeline({
      id: this.canvasHost,
      min: 0,
      max: 8,
      stepPx: 80,
      stepVal: 1,
      stepSmallPx: 8,
      snapEnabled: true,
      snapStep: 1 / 30,
      leftMargin: 6,
      headerHeight: this.timelineHeaderHeight(),
      fillColor: "rgba(255,255,255,0.78)",
      headerFillColor: "rgba(244,247,249,0.92)",
      tickColor: "rgba(26,35,42,0.22)",
      labelsColor: "#687078",
      selectionColor: "rgba(32,191,169,0.18)",
      rowsStyle: {
        height: this.timelineRowHeight(),
        marginBottom: 2,
        fillColor: "rgba(255,255,255,0.54)"
      },
      timelineStyle: {
        width: 2,
        strokeColor: "#df6b80",
        fillColor: "#df6b80"
      }
    }, { rows: [] });

    this.timeline._formatUnitsText = (value: number) => `${formatNumber(value)}s`;
    this.bindEvents();
  }

  update(timelineDocument: SceneTimelineDocument, entries: Iterable<SceneEntry>, selectedId: string, playing: boolean): void {
    this.updating = true;
    const entryList = Array.from(entries);
    this.lastTimelineDocument = timelineDocument;
    this.lastEntries = entryList;
    this.lastSelectedId = selectedId;
    this.lastPlaying = playing;
    this.lastEntryNames = new Map(entryList.map((entry) => [entry.id, entry.name]));
    this.root.classList.toggle("playing", playing);
    this.playButton.innerHTML = `<span data-icon="${playing ? "Pause" : "Play"}"></span><span>${playing ? "Pause" : "Play"}</span>`;
    hydrateIcons(this.playButton);
    this.timeInput.value = formatNumber(timelineDocument.currentTime);
    this.timecodeLabel.textContent = formatTimecode(timelineDocument.currentTime, timelineDocument.fps);
    this.durationInput.value = formatNumber(timelineDocument.duration);
    this.workStartInput.value = formatNumber(timelineDocument.workStart);
    this.workEndInput.value = formatNumber(timelineDocument.workEnd);
    this.fpsInput.value = String(timelineDocument.fps);
    this.loopInput.checked = timelineDocument.loop;
    this.snapInput.checked = timelineDocument.snapEnabled;
    this.autoKeyInput.checked = timelineDocument.autoKey;
    this.snapStepInput.value = formatNumber(timelineDocument.snapStep);
    this.rowFilterSelect.value = this.rowFilter;
    this.syncInterpolationControls(this.currentInterpolation(timelineDocument, selectedId));
    this.syncAddKeyframeButton(timelineDocument, selectedId);
    this.syncToggleTrackButton(timelineDocument, selectedId);

    const visibleEntries = this.visibleEntries(timelineDocument, entryList, selectedId);
    const rowHeight = this.timelineRowHeight();
    const headerHeight = this.timelineHeaderHeight();
    this.labels.innerHTML = this.renderLabels(timelineDocument, visibleEntries, selectedId);
    hydrateIcons(this.labels);
    this.timeline.setOptions({
      max: timelineDocument.duration,
      snapEnabled: timelineDocument.snapEnabled,
      snapStep: timelineDocument.snapStep,
      headerHeight,
      rowsStyle: {
        height: rowHeight,
        marginBottom: 2,
        fillColor: "rgba(255,255,255,0.54)"
      }
    });
    this.timeline.setModel(this.createModel(timelineDocument, visibleEntries, selectedId, rowHeight));
    this.timeline.setTime(timelineDocument.currentTime);
    this.timeline.rescale();
    this.bindTimelineScroller();
    this.renderMarkers(timelineDocument);
    this.syncSelectionWidgets(timelineDocument, selectedId);
    this.renderGraph(timelineDocument, selectedId);
    this.lockDockScroll();
    this.updating = false;
  }

  selectedTrackKind(): TimelineTrackKind {
    return this.trackSelect.value as TimelineTrackKind;
  }

  selectedKeyframeIdsList(): string[] {
    return [...this.selectedKeyframeIds];
  }

  setPlaybackTime(timelineDocument: SceneTimelineDocument, playing: boolean): void {
    this.updating = true;
    this.root.classList.toggle("playing", playing);
    this.playButton.innerHTML = `<span data-icon="${playing ? "Pause" : "Play"}"></span><span>${playing ? "Pause" : "Play"}</span>`;
    hydrateIcons(this.playButton);
    this.timeInput.value = formatNumber(timelineDocument.currentTime);
    this.timecodeLabel.textContent = formatTimecode(timelineDocument.currentTime, timelineDocument.fps);
    this.timeline.setTime(timelineDocument.currentTime);
    this.renderMarkers(timelineDocument);
    this.syncAddKeyframeButton(timelineDocument, this.lastSelectedId);
    this.syncInterpolationControls(this.currentInterpolation(timelineDocument, this.lastSelectedId));
    this.syncKeyframeEditor(timelineDocument, this.lastSelectedId);
    this.renderGraph(timelineDocument, this.lastSelectedId);
    this.lockDockScroll();
    this.updating = false;
  }

  private bindEvents(): void {
    this.resizeHandle.addEventListener("pointerdown", (event) => this.startResize(event));
    this.resizeHandle.addEventListener("dblclick", () => this.resetDockHeight());
    this.labels.addEventListener("scroll", () => this.syncCanvasScrollFromLabels());
    query<HTMLButtonElement>("#timeline-collapse").addEventListener("click", (event) => {
      const collapsed = this.root.classList.toggle("collapsed");
      const button = event.currentTarget as HTMLButtonElement;
      button.setAttribute("aria-label", collapsed ? "Expand timeline" : "Collapse timeline");
      button.title = collapsed ? "Expand timeline" : "Collapse timeline";
      window.setTimeout(() => this.refreshCanvas(), 0);
    });
    this.addKeyframeButton.addEventListener("click", () => {
      this.callbacks.onAddKeyframe(this.selectedTrackKind());
    });
    this.setTransformButton.addEventListener("click", () => {
      this.callbacks.onSetTransformKeyframes();
    });
    query<HTMLButtonElement>("#timeline-delete-keyframe").addEventListener("click", () => {
      this.callbacks.onDeleteKeyframes([...this.selectedKeyframeIds]);
    });
    query<HTMLButtonElement>("#timeline-copy-keyframes").addEventListener("click", () => {
      this.callbacks.onCopyKeyframes([...this.selectedKeyframeIds]);
    });
    query<HTMLButtonElement>("#timeline-paste-keyframes").addEventListener("click", () => {
      this.callbacks.onPasteKeyframes();
    });
    query<HTMLButtonElement>("#timeline-nudge-left").addEventListener("click", () => {
      this.callbacks.onNudgeKeyframes(-1, [...this.selectedKeyframeIds]);
    });
    query<HTMLButtonElement>("#timeline-nudge-right").addEventListener("click", () => {
      this.callbacks.onNudgeKeyframes(1, [...this.selectedKeyframeIds]);
    });
    query<HTMLButtonElement>("#timeline-add-marker").addEventListener("click", () => {
      this.callbacks.onAddMarker(this.markerLabelInput.value.trim());
    });
    query<HTMLButtonElement>("#timeline-delete-marker").addEventListener("click", () => {
      this.callbacks.onDeleteMarker(this.activeMarkerId);
    });
    query<HTMLButtonElement>("#timeline-prev-marker").addEventListener("click", () => this.callbacks.onStepMarker(-1));
    query<HTMLButtonElement>("#timeline-next-marker").addEventListener("click", () => this.callbacks.onStepMarker(1));
    this.markerLabelInput.addEventListener("change", () => {
      if (this.activeMarkerId) this.callbacks.onRenameMarker(this.activeMarkerId, this.markerLabelInput.value);
    });
    this.markerStrip.addEventListener("click", (event) => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>(".timeline-marker");
      if (!button) return;
      const time = Number(button.dataset.time);
      if (Number.isFinite(time)) this.callbacks.onTimeChanged(time);
    });
    this.keyframeTimeInput.addEventListener("change", () => {
      this.callbacks.onEditKeyframes([...this.selectedKeyframeIds], { time: Number(this.keyframeTimeInput.value) });
    });
    (["x", "y", "z"] as const).forEach((axis) => {
      this.keyframeValueInputs[axis].addEventListener("change", () => {
        this.callbacks.onEditKeyframes([...this.selectedKeyframeIds], { value: { [axis]: Number(this.keyframeValueInputs[axis].value) } });
      });
    });
    query<HTMLButtonElement>("#timeline-duplicate-keyframe").addEventListener("click", () => {
      this.callbacks.onDuplicateKeyframes([...this.selectedKeyframeIds]);
    });
    query<HTMLButtonElement>("#timeline-clear-track").addEventListener("click", () => {
      this.callbacks.onClearTrack(this.selectedTrackKind());
    });
    this.toggleTrackButton.addEventListener("click", () => {
      this.callbacks.onToggleTrack(this.selectedTrackKind());
    });
    this.labels.addEventListener("click", (event) => {
      const keyButton = (event.target as HTMLElement).closest<HTMLButtonElement>(".timeline-row-key");
      const row = (event.target as HTMLElement).closest<HTMLElement>(".timeline-track-label");
      if (!row) return;
      const kind = row.dataset.trackKind as TimelineTrackKind | undefined;
      const axis = parseTimelineAxis(row.dataset.trackAxis);
      const targetId = row.dataset.objectId;
      if (!kind || !targetId) return;
      this.trackSelect.value = kind;
      this.selectedAxis = axis;
      this.callbacks.onTrackLabelSelected(targetId, kind);
      if (keyButton) this.callbacks.onAddKeyframe(kind);
    });
    this.labels.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const row = (event.target as HTMLElement).closest<HTMLElement>(".timeline-track-label");
      if (!row || event.target instanceof HTMLButtonElement) return;
      const kind = row.dataset.trackKind as TimelineTrackKind | undefined;
      const axis = parseTimelineAxis(row.dataset.trackAxis);
      const targetId = row.dataset.objectId;
      if (!kind || !targetId) return;
      event.preventDefault();
      this.trackSelect.value = kind;
      this.selectedAxis = axis;
      this.callbacks.onTrackLabelSelected(targetId, kind);
    });
    query<HTMLButtonElement>("#timeline-prev-frame").addEventListener("click", () => this.callbacks.onStepFrame(-1));
    query<HTMLButtonElement>("#timeline-next-frame").addEventListener("click", () => this.callbacks.onStepFrame(1));
    query<HTMLButtonElement>("#timeline-prev-keyframe").addEventListener("click", () => this.callbacks.onStepKeyframe(-1));
    query<HTMLButtonElement>("#timeline-next-keyframe").addEventListener("click", () => this.callbacks.onStepKeyframe(1));
    query<HTMLButtonElement>("#timeline-zoom-out").addEventListener("click", () => this.timeline.zoomOut(0.25));
    query<HTMLButtonElement>("#timeline-zoom-in").addEventListener("click", () => this.timeline.zoomIn(0.25));
    query<HTMLButtonElement>("#timeline-zoom-fit").addEventListener("click", () => this.fitTimeline());
    query<HTMLButtonElement>("#timeline-start").addEventListener("click", () => this.callbacks.onTimeChanged(Number(this.workStartInput.value)));
    query<HTMLButtonElement>("#timeline-end").addEventListener("click", () => this.callbacks.onTimeChanged(Number(this.workEndInput.value)));
    this.playButton.addEventListener("click", () => this.callbacks.onTogglePlayback());
    this.timeInput.addEventListener("change", () => this.callbacks.onTimeChanged(Number(this.timeInput.value)));
    this.durationInput.addEventListener("change", () => this.callbacks.onSettingsChanged({ duration: Number(this.durationInput.value) }));
    this.workStartInput.addEventListener("change", () => this.callbacks.onSettingsChanged({ workStart: Number(this.workStartInput.value) }));
    this.workEndInput.addEventListener("change", () => this.callbacks.onSettingsChanged({ workEnd: Number(this.workEndInput.value) }));
    this.fpsInput.addEventListener("change", () => this.callbacks.onSettingsChanged({ fps: Number(this.fpsInput.value) }));
    this.snapStepInput.addEventListener("change", () => this.callbacks.onSettingsChanged({ snapStep: Number(this.snapStepInput.value) }));
    this.loopInput.addEventListener("change", () => this.callbacks.onSettingsChanged({ loop: this.loopInput.checked }));
    this.snapInput.addEventListener("change", () => this.callbacks.onSettingsChanged({ snapEnabled: this.snapInput.checked }));
    this.autoKeyInput.addEventListener("change", () => this.callbacks.onSettingsChanged({ autoKey: this.autoKeyInput.checked }));
    this.trackSelect.addEventListener("change", () => {
      this.selectedAxis = null;
      if (!this.updating) this.callbacks.onTrackKindChanged();
    });
    this.rowFilterSelect.addEventListener("change", () => {
      this.rowFilter = parseTimelineRowFilter(this.rowFilterSelect.value);
      storeTimelineRowFilter(this.rowFilter);
      if (this.lastTimelineDocument) this.update(this.lastTimelineDocument, this.lastEntries, this.lastSelectedId, this.lastPlaying);
    });
    this.interpolationSelect.addEventListener("change", () => {
      this.applyInterpolation(this.interpolationSelect.value as TimelineInterpolation);
    });
    document.querySelectorAll<HTMLButtonElement>(".interpolation-button").forEach((button) => {
      button.addEventListener("click", () => {
        this.applyInterpolation(button.dataset.interpolation as TimelineInterpolation);
      });
    });

    this.timeline.onTimeChanged((event) => {
      if (this.updating) return;
      this.callbacks.onTimeChanged(event.val);
    });
    this.timeline.onSelected((event) => {
      const selectedKeyframes = event.selected.map((keyframe) => keyframe as TimelineUiKeyframe);
      this.selectedKeyframeIds = new Set(selectedKeyframes.map((keyframe) => keyframe.id).filter(Boolean));
      this.selectedAxis = commonSelectedAxis(selectedKeyframes);
      if (this.lastTimelineDocument) this.syncSelectionWidgets(this.lastTimelineDocument, this.lastSelectedId);
    });
    this.timeline.onDragStarted(() => this.callbacks.onDragStarted());
    this.timeline.onKeyframeChanged((event) => {
      const keyframe = event.target.keyframe as TimelineUiKeyframe | undefined;
      if (!keyframe?.id) return;
      this.callbacks.onKeyframeMoved(keyframe.id, event.val);
    });
    this.timeline.onDragFinished(() => this.callbacks.onDragFinished());
  }

  private startResize(event: PointerEvent): void {
    if (this.root.classList.contains("collapsed")) return;
    event.preventDefault();
    this.resizeState = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startHeight: this.root.getBoundingClientRect().height
    };
    this.root.classList.add("resizing");
    this.resizeHandle.setPointerCapture(event.pointerId);
    window.addEventListener("pointermove", this.handleResizeMove);
    window.addEventListener("pointerup", this.handleResizeEnd);
    window.addEventListener("pointercancel", this.handleResizeEnd);
  }

  private resizeDock(event: PointerEvent): void {
    if (!this.resizeState || event.pointerId !== this.resizeState.pointerId) return;
    const delta = this.resizeState.startY - event.clientY;
    const height = clamp(this.resizeState.startHeight + delta, MIN_DOCK_HEIGHT, this.maxDockHeight());
    this.root.style.setProperty("--timeline-dock-height", `${Math.round(height)}px`);
    this.refreshCanvas();
  }

  private finishResize(event: PointerEvent): void {
    if (!this.resizeState || event.pointerId !== this.resizeState.pointerId) return;
    const height = Math.round(this.root.getBoundingClientRect().height);
    storeTimelineDockHeight(height);
    this.resizeState = null;
    this.root.classList.remove("resizing");
    if (this.resizeHandle.hasPointerCapture(event.pointerId)) this.resizeHandle.releasePointerCapture(event.pointerId);
    window.removeEventListener("pointermove", this.handleResizeMove);
    window.removeEventListener("pointerup", this.handleResizeEnd);
    window.removeEventListener("pointercancel", this.handleResizeEnd);
    this.refreshCanvas();
  }

  private resetDockHeight(): void {
    this.root.style.removeProperty("--timeline-dock-height");
    clearTimelineDockHeight();
    this.refreshCanvas();
  }

  private applyStoredDockHeight(): void {
    const height = loadTimelineDockHeight();
    if (height) this.root.style.setProperty("--timeline-dock-height", `${clamp(height, MIN_DOCK_HEIGHT, this.maxDockHeight())}px`);
  }

  private maxDockHeight(): number {
    const ratio = window.innerWidth <= 880 ? 0.44 : 0.72;
    const bottomOffset = Number.parseFloat(getComputedStyle(this.root).bottom) || 0;
    const available = window.innerHeight - bottomOffset - 22;
    return Math.max(MIN_DOCK_HEIGHT, Math.min(window.innerHeight * ratio, available));
  }

  private refreshCanvas(): void {
    this.lockDockScroll();
    this.timeline.rescale();
    this.timeline.redraw();
    this.bindTimelineScroller();
  }

  private lockDockScroll(): void {
    if (this.root.scrollTop !== 0) this.root.scrollTop = 0;
    if (this.root.scrollLeft !== 0) this.root.scrollLeft = 0;
  }

  private bindTimelineScroller(): void {
    const scroller = this.canvasHost.querySelector<HTMLElement>(".scroll-container");
    if (!scroller || scroller === this.timelineScroller) return;
    this.timelineScroller?.removeEventListener("scroll", this.handleTimelineScroll);
    this.timelineScroller = scroller;
    this.timelineScroller.addEventListener("scroll", this.handleTimelineScroll);
  }

  private syncLabelsFromCanvasScroll(): void {
    if (!this.timelineScroller || this.syncingScroll) return;
    this.syncingScroll = true;
    this.labels.scrollTop = this.timelineScroller.scrollTop;
    this.syncingScroll = false;
  }

  private syncCanvasScrollFromLabels(): void {
    if (!this.timelineScroller || this.syncingScroll) return;
    this.syncingScroll = true;
    this.timelineScroller.scrollTop = this.labels.scrollTop;
    this.syncingScroll = false;
  }

  private timelineRowHeight(): number {
    return cssNumber(this.root, "--timeline-track-row-height", DEFAULT_ROW_HEIGHT);
  }

  private timelineHeaderHeight(): number {
    return cssNumber(this.root, "--timeline-track-top-padding", DEFAULT_HEADER_HEIGHT);
  }

  private visibleEntries(timelineDocument: SceneTimelineDocument, entries: Iterable<SceneEntry>, selectedId: string): SceneEntry[] {
    const entryList = Array.from(entries);
    if (this.rowFilter === "all") return entryList;

    const keyedIds = new Set(timelineDocument.objects.map((object) => object.objectId));
    const selected = entryList.find((entry) => entry.id === selectedId);
    const keyed = entryList.filter((entry) => entry.id !== selectedId && keyedIds.has(entry.id));
    if (this.rowFilter === "keyed") {
      const activeSelected = selected && isObjectTrack(this.selectedTrackKind());
      return [
        ...(selected && (activeSelected || keyedIds.has(selected.id)) ? [selected] : []),
        ...keyed
      ];
    }
    return selected ? [selected, ...keyed] : keyed;
  }

  private renderMarkers(timelineDocument: SceneTimelineDocument): void {
    this.markerStrip.innerHTML = "";
    const activeMarker = this.currentMarker(timelineDocument);
    this.activeMarkerId = activeMarker?.id ?? null;
    timelineDocument.markers.forEach((marker) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "timeline-marker";
      button.classList.toggle("active", marker.id === activeMarker?.id);
      button.dataset.markerId = marker.id;
      button.dataset.time = String(marker.time);
      button.style.left = `${Math.min(100, Math.max(0, (marker.time / Math.max(timelineDocument.duration, 0.001)) * 100))}%`;
      button.style.borderLeftColor = marker.color;
      button.title = `${marker.label} at ${formatNumber(marker.time)}s`;
      button.textContent = marker.label;
      this.markerStrip.appendChild(button);
    });
    this.syncMarkerEditor(timelineDocument, activeMarker);
  }

  private syncMarkerEditor(timelineDocument: SceneTimelineDocument, marker = this.currentMarker(timelineDocument)): void {
    this.activeMarkerId = marker?.id ?? null;
    this.markerLabelInput.disabled = false;
    this.markerLabelInput.value = marker?.label ?? "";
    this.markerLabelInput.placeholder = marker ? "Rename marker" : `Marker ${timelineDocument.markers.length + 1}`;
  }

  private currentMarker(timelineDocument: SceneTimelineDocument): TimelineMarkerDocument | null {
    return timelineDocument.markers.find((marker) => Math.abs(marker.time - timelineDocument.currentTime) < 0.001) ?? null;
  }

  private visibleTrackKinds(
    kinds: TimelineTrackKind[],
    tracks: TimelineTrackDocument[],
    targetId: string,
    selectedId: string
  ): TimelineTrackKind[] {
    if (this.rowFilter === "all") return kinds;
    const trackByKind = new Map(tracks.map((track) => [track.kind, track]));
    const hasKeyframes = (kind: TimelineTrackKind) => Boolean(trackByKind.get(kind)?.keyframes.length);
    const isActive = (kind: TimelineTrackKind) => this.isActiveRow(targetId, kind, selectedId);

    if (this.rowFilter === "keyed") {
      return kinds.filter((kind) => hasKeyframes(kind) || isActive(kind));
    }

    if (targetId === selectedId) return kinds;
    return kinds.filter((kind) => hasKeyframes(kind) || isActive(kind));
  }

  private isActiveRow(targetId: string, kind: TimelineTrackKind, selectedId: string): boolean {
    const activeKind = this.selectedTrackKind();
    if (activeKind !== kind) return false;
    if (isCameraTrack(kind)) return targetId === CAMERA_TARGET_ID;
    if (isLightTrack(kind)) return targetId === LIGHT_TARGET_ID;
    return targetId === selectedId;
  }

  private renderLabels(timelineDocument: SceneTimelineDocument, entries: SceneEntry[], selectedId: string): string {
    const activeKind = this.selectedTrackKind();
    const objectTimelines = new Map(timelineDocument.objects.map((object) => [object.objectId, object]));
    const objectLabels = entries
      .flatMap((entry) => {
        const objectTimeline = objectTimelines.get(entry.id);
        const visibleKinds = this.visibleTrackKinds(OBJECT_TRACKS, objectTimeline?.tracks ?? [], entry.id, selectedId);
        const visibleRows = this.rowDescriptors(visibleKinds, true);
        return visibleRows.map((row) => {
          const track = objectTimeline?.tracks.find((candidate) => candidate.kind === row.kind);
          return this.renderTrackLabel({
            targetId: entry.id,
            targetName: entry.name,
            kind: row.kind,
            axis: row.axis,
            active: entry.id === selectedId && activeKind === row.kind,
            enabled: track?.enabled ?? true,
            hasKeyframes: Boolean(track?.keyframes.length)
          });
        });
      })
      .join("");
    const cameraLabels = this.visibleTrackKinds(CAMERA_TRACKS, timelineDocument.camera.tracks, CAMERA_TARGET_ID, selectedId).map((kind) => {
      const track = timelineDocument.camera.tracks.find((candidate) => candidate.kind === kind);
      return this.renderTrackLabel({
        targetId: CAMERA_TARGET_ID,
        targetName: "Camera",
        kind,
        active: isCameraTrack(activeKind) && activeKind === kind,
        enabled: track?.enabled ?? true,
        hasKeyframes: Boolean(track?.keyframes.length),
        extraClass: "camera-track-label"
      });
    }).join("");
    const lightLabels = this.visibleTrackKinds(LIGHT_TRACKS, timelineDocument.lights.tracks, LIGHT_TARGET_ID, selectedId).map((kind) => {
      const track = timelineDocument.lights.tracks.find((candidate) => candidate.kind === kind);
      return this.renderTrackLabel({
        targetId: LIGHT_TARGET_ID,
        targetName: "Lights",
        kind,
        active: isLightTrack(activeKind) && activeKind === kind,
        enabled: track?.enabled ?? true,
        hasKeyframes: Boolean(track?.keyframes.length),
        extraClass: "light-track-label"
      });
    }).join("");
    return `${objectLabels || `<div class="timeline-empty">Select an object to keyframe</div>`}${cameraLabels}${lightLabels}`;
  }

  private renderTrackLabel(options: {
    targetId: string;
    targetName: string;
    kind: TimelineTrackKind;
    axis?: TimelineAxis;
    active: boolean;
    enabled: boolean;
    hasKeyframes: boolean;
    extraClass?: string;
  }): string {
    const label = trackLabel(options.kind, options.axis);
    const keyText = options.hasKeyframes ? "Update keyframe" : "Add keyframe";
    return `
      <div class="${this.labelClass(options.active, options.enabled, options.hasKeyframes, [options.extraClass ?? "", options.axis ? "axis-track-label" : ""].join(" "))}" role="button" tabindex="0" data-object-id="${options.targetId}" data-track-kind="${options.kind}" ${options.axis ? `data-track-axis="${options.axis}"` : ""} aria-label="${options.targetName} ${label}">
        <span class="track-swatch" style="background:${TRACK_COLORS[options.kind]}"></span>
        <span class="track-label-text">
          <strong>${options.targetName}</strong>
          <small>${label}</small>
        </span>
        <button class="timeline-row-key" type="button" aria-label="${keyText}: ${options.targetName} ${label}" title="${keyText}">
          <span data-icon="${options.hasKeyframes ? "Diamond" : "DiamondPlus"}"></span>
        </button>
      </div>
    `;
  }

  private labelClass(active: boolean, enabled: boolean, hasKeyframes: boolean, extra = ""): string {
    return [
      "timeline-track-label",
      extra,
      active ? "active" : "",
      hasKeyframes ? "has-keyframes" : "",
      hasKeyframes && !enabled ? "disabled-track" : ""
    ].filter(Boolean).join(" ");
  }

  private createModel(timelineDocument: SceneTimelineDocument, entries: SceneEntry[], selectedId: string, rowHeight: number): TimelineModel {
    const objectTimelines = new Map(timelineDocument.objects.map((object) => [object.objectId, object]));
    const rows: TimelineUiRow[] = [];
    entries.forEach((entry) => {
      const objectTimeline = objectTimelines.get(entry.id);
      const visibleKinds = this.visibleTrackKinds(OBJECT_TRACKS, objectTimeline?.tracks ?? [], entry.id, selectedId);
      const visibleRows = this.rowDescriptors(visibleKinds, true);
      visibleRows.forEach((row, index) => {
        const track = objectTimeline?.tracks.find((candidate) => candidate.kind === row.kind);
        rows.push({
          targetId: entry.id,
          trackKind: row.kind,
          axis: row.axis,
          min: 0,
          max: timelineDocument.duration,
          keyframesDraggable: true,
          groupsDraggable: true,
          style: {
            height: rowHeight,
            marginBottom: index === visibleKinds.length - 1 ? 8 : 2,
            fillColor: index % 2 === 0 ? "rgba(255,255,255,0.66)" : "rgba(235,241,244,0.64)",
            keyframesStyle: {
              width: 14,
              height: 14,
              fillColor: TRACK_COLORS[row.kind],
              selectedFillColor: "#ffffff",
              strokeColor: "rgba(26,35,42,0.35)",
              selectedStrokeColor: TRACK_COLORS[row.kind],
              strokeThickness: 2
            }
          },
          keyframes: track?.keyframes.map((keyframe): TimelineUiKeyframe => ({
            id: keyframe.id,
            targetId: entry.id,
            trackKind: row.kind,
            axis: row.axis,
            val: keyframe.time,
            style: this.keyframeStyle(row.kind, keyframe.interpolation),
            selected: this.selectedKeyframeIds.has(keyframe.id),
            selectable: true,
            draggable: true
          })) ?? []
        });
      });
    });
    const visibleCameraKinds = this.visibleTrackKinds(CAMERA_TRACKS, timelineDocument.camera.tracks, CAMERA_TARGET_ID, selectedId);
    visibleCameraKinds.forEach((kind, index) => {
      const track = timelineDocument.camera.tracks.find((candidate) => candidate.kind === kind);
      rows.push({
        targetId: CAMERA_TARGET_ID,
        trackKind: kind,
        min: 0,
        max: timelineDocument.duration,
        keyframesDraggable: true,
        groupsDraggable: true,
        style: {
          height: rowHeight,
          marginBottom: index === visibleCameraKinds.length - 1 ? 0 : 2,
          fillColor: index % 2 === 0 ? "rgba(238,244,255,0.74)" : "rgba(244,239,255,0.74)",
          keyframesStyle: {
            width: 14,
            height: 14,
            fillColor: TRACK_COLORS[kind],
            selectedFillColor: "#ffffff",
            strokeColor: "rgba(26,35,42,0.35)",
            selectedStrokeColor: TRACK_COLORS[kind],
            strokeThickness: 2
          }
        },
        keyframes: track?.keyframes.map((keyframe): TimelineUiKeyframe => ({
          id: keyframe.id,
          targetId: CAMERA_TARGET_ID,
          trackKind: kind,
          val: keyframe.time,
          style: this.keyframeStyle(kind, keyframe.interpolation),
          selected: this.selectedKeyframeIds.has(keyframe.id),
          selectable: true,
          draggable: true
        })) ?? []
      });
    });
    const visibleLightKinds = this.visibleTrackKinds(LIGHT_TRACKS, timelineDocument.lights.tracks, LIGHT_TARGET_ID, selectedId);
    visibleLightKinds.forEach((kind, index) => {
      const track = timelineDocument.lights.tracks.find((candidate) => candidate.kind === kind);
      rows.push({
        targetId: LIGHT_TARGET_ID,
        trackKind: kind,
        min: 0,
        max: timelineDocument.duration,
        keyframesDraggable: true,
        groupsDraggable: true,
        style: {
          height: rowHeight,
          marginBottom: index === visibleLightKinds.length - 1 ? 0 : 2,
          fillColor: index % 2 === 0 ? "rgba(255,247,229,0.78)" : "rgba(244,249,255,0.78)",
          keyframesStyle: {
            width: 14,
            height: 14,
            fillColor: TRACK_COLORS[kind],
            selectedFillColor: "#ffffff",
            strokeColor: "rgba(26,35,42,0.35)",
            selectedStrokeColor: TRACK_COLORS[kind],
            strokeThickness: 2
          }
        },
        keyframes: track?.keyframes.map((keyframe): TimelineUiKeyframe => ({
          id: keyframe.id,
          targetId: LIGHT_TARGET_ID,
          trackKind: kind,
          val: keyframe.time,
          style: this.keyframeStyle(kind, keyframe.interpolation),
          selected: this.selectedKeyframeIds.has(keyframe.id),
          selectable: true,
          draggable: true
        })) ?? []
      });
    });
    return { rows };
  }

  private currentInterpolation(timelineDocument: SceneTimelineDocument, selectedId: string): TimelineInterpolation {
    const selectedKeyframes = [
      ...timelineDocument.camera.tracks.flatMap((track) => track.keyframes.filter((keyframe) => this.selectedKeyframeIds.has(keyframe.id))),
      ...timelineDocument.lights.tracks.flatMap((track) => track.keyframes.filter((keyframe) => this.selectedKeyframeIds.has(keyframe.id))),
      ...timelineDocument.objects.flatMap((object) =>
        object.tracks.flatMap((track) => track.keyframes.filter((keyframe) => this.selectedKeyframeIds.has(keyframe.id)))
      )
    ];
    const keyframe = selectedKeyframes[0] ?? this.playheadKeyframe(timelineDocument, selectedId);
    return keyframe?.interpolation ?? "linear";
  }

  private syncToggleTrackButton(timelineDocument: SceneTimelineDocument, selectedId: string): void {
    const state = this.selectedTrackState(timelineDocument, selectedId);
    this.toggleTrackButton.disabled = !state.hasKeyframes;
    this.toggleTrackButton.classList.toggle("danger", state.hasKeyframes && !state.enabled);
    this.toggleTrackButton.innerHTML = `<span data-icon="${state.enabled ? "Eye" : "EyeOff"}"></span><span>${state.enabled ? "Track On" : "Track Off"}</span>`;
    hydrateIcons(this.toggleTrackButton);
  }

  private syncAddKeyframeButton(timelineDocument: SceneTimelineDocument, selectedId: string): void {
    const hasPlayheadKey = Boolean(this.playheadKeyframe(timelineDocument, selectedId));
    this.addKeyframeButton.innerHTML = `<span data-icon="${hasPlayheadKey ? "Diamond" : "DiamondPlus"}"></span><span>${hasPlayheadKey ? "Update Key" : "Set Key"}</span>`;
    this.addKeyframeButton.title = hasPlayheadKey
      ? "Update the keyframe at the current playhead time"
      : "Create a keyframe at the current playhead time";
    hydrateIcons(this.addKeyframeButton);
  }

  private selectedTrackState(timelineDocument: SceneTimelineDocument, selectedId: string): { enabled: boolean; hasKeyframes: boolean } {
    const selectedTrack = this.selectedTrackKind();
    const track = isCameraTrack(selectedTrack)
      ? timelineDocument.camera.tracks.find((candidate) => candidate.kind === selectedTrack)
      : isLightTrack(selectedTrack)
        ? timelineDocument.lights.tracks.find((candidate) => candidate.kind === selectedTrack)
        : timelineDocument.objects
          .find((object) => object.objectId === selectedId)
          ?.tracks.find((candidate) => candidate.kind === selectedTrack);
    return {
      enabled: track?.enabled ?? true,
      hasKeyframes: Boolean(track && track.keyframes.length > 0)
    };
  }

  private syncSelectionWidgets(timelineDocument: SceneTimelineDocument, selectedId: string): void {
    const sources = this.detailSources(timelineDocument, selectedId);
    this.selectionLabel.textContent = this.selectedKeyframeIds.size
      ? `${this.selectedKeyframeIds.size} keyframe${this.selectedKeyframeIds.size === 1 ? "" : "s"} selected`
      : sources.length
        ? "Playhead keyframe active"
      : "No keyframe selected";
    this.syncKeyframeEditor(timelineDocument, selectedId, sources);
    this.syncInterpolationControls(this.currentInterpolation(timelineDocument, selectedId));
  }

  private syncKeyframeEditor(timelineDocument: SceneTimelineDocument, selectedId: string, resolvedSources?: TimelineDetailSource[]): void {
    const sources = resolvedSources ?? this.detailSources(timelineDocument, selectedId);
    const first = sources[0];
    const axisConfig = first ? trackAxisConfig(first.track.kind) : trackAxisConfig(this.selectedTrackKind());
    const focusedAxisIndex = this.selectedAxis ? AXIS_INDEX[this.selectedAxis] : null;
    (["x", "y", "z"] as const).forEach((axis, index) => {
      const axisEnabled = sources.length > 0 && index < axisConfig.enabledAxes && (focusedAxisIndex === null || focusedAxisIndex === index);
      this.keyframeAxisLabels[axis].textContent = axisConfig.labels[index];
      this.keyframeValueInputs[axis].disabled = !axisEnabled;
      this.keyframeValueInputs[axis].value = axisEnabled
        ? commonValue(sources.map((source) => source.keyframe.value[index]))
        : "";
      this.keyframeValueInputs[axis].placeholder = sources.length > 1 ? "Mixed" : "";
    });

    this.keyframeTimeInput.disabled = sources.length !== 1;
    this.keyframeTimeInput.value = sources.length === 1 ? formatNumber(first.keyframe.time) : "";
    this.keyframeTimeInput.placeholder = sources.length > 1 ? "Multiple" : "";
    if (!first) {
      this.keyframeLabel.textContent = "No keyframe selected";
    } else if (sources.length === 1) {
      this.keyframeLabel.textContent = `${first.targetName} | ${trackLabel(first.track.kind, this.selectedAxis ?? undefined)}`;
    } else {
      this.keyframeLabel.textContent = `${sources.length} selected keyframes`;
    }
  }

  private detailSources(timelineDocument: SceneTimelineDocument, selectedId: string): TimelineDetailSource[] {
    if (this.selectedKeyframeIds.size > 0) {
      const ids = this.selectedKeyframeIds;
      const sources: TimelineDetailSource[] = [];
      this.collectDetailSources(timelineDocument.camera.tracks, "Camera", ids, sources);
      this.collectDetailSources(timelineDocument.lights.tracks, "Lights", ids, sources);
      timelineDocument.objects.forEach((objectTimeline) => {
        this.collectDetailSources(objectTimeline.tracks, this.lastEntryNames.get(objectTimeline.objectId) ?? "Object", ids, sources);
      });
      return sources;
    }

    const track = this.playheadTrack(timelineDocument, selectedId);
    const keyframe = track?.keyframes.find((candidate) => Math.abs(candidate.time - timelineDocument.currentTime) < 0.001);
    if (!track || !keyframe) return [];
    if (isCameraTrack(track.kind)) return [{ targetName: "Camera", track, keyframe }];
    if (isLightTrack(track.kind)) return [{ targetName: "Lights", track, keyframe }];
    return [{ targetName: this.lastEntryNames.get(selectedId) ?? "Object", track, keyframe }];
  }

  private collectDetailSources(
    tracks: TimelineTrackDocument[],
    targetName: string,
    ids: Set<string>,
    sources: TimelineDetailSource[]
  ): void {
    tracks.forEach((track) => {
      track.keyframes.forEach((keyframe) => {
        if (ids.has(keyframe.id)) sources.push({ targetName, track, keyframe });
      });
    });
  }

  private playheadTrack(timelineDocument: SceneTimelineDocument, selectedId: string): TimelineTrackDocument | undefined {
    const selectedTrack = this.selectedTrackKind();
    if (isCameraTrack(selectedTrack)) return timelineDocument.camera.tracks.find((candidate) => candidate.kind === selectedTrack);
    if (isLightTrack(selectedTrack)) return timelineDocument.lights.tracks.find((candidate) => candidate.kind === selectedTrack);
    return timelineDocument.objects
      .find((object) => object.objectId === selectedId)
      ?.tracks.find((candidate) => candidate.kind === selectedTrack);
  }

  private playheadKeyframe(timelineDocument: SceneTimelineDocument, selectedId: string) {
    const track = this.playheadTrack(timelineDocument, selectedId);
    return track?.keyframes.find((keyframe) => Math.abs(keyframe.time - timelineDocument.currentTime) < 0.001);
  }

  private keyframeStyle(kind: TimelineTrackKind, interpolation: TimelineInterpolation) {
    const baseColor = TRACK_COLORS[kind];
    if (interpolation === "hold") {
      return {
        shape: TimelineKeyframeShape.Rect,
        width: 13,
        height: 13,
        fillColor: "#2a3138",
        selectedFillColor: "#ffffff",
        strokeColor: baseColor,
        selectedStrokeColor: baseColor,
        strokeThickness: 2
      };
    }
    if (interpolation === "smooth") {
      return {
        shape: TimelineKeyframeShape.Circle,
        width: 13,
        height: 13,
        fillColor: baseColor,
        selectedFillColor: "#ffffff",
        strokeColor: "rgba(26,35,42,0.35)",
        selectedStrokeColor: baseColor,
        strokeThickness: 2
      };
    }
    return {
      shape: TimelineKeyframeShape.Rhomb,
      width: 14,
      height: 14,
      fillColor: baseColor,
      selectedFillColor: "#ffffff",
      strokeColor: "rgba(26,35,42,0.35)",
      selectedStrokeColor: baseColor,
      strokeThickness: 2
    };
  }

  private fitTimeline(): void {
    const duration = Math.max(Number(this.durationInput.value) || 8, 0.5);
    const clientWidth = Math.max(this.timeline.getClientWidth(), 1);
    const zoom = Math.max(0.05, Math.min(8, (clientWidth - 32) / (duration * 80)));
    this.timeline.setZoom(zoom);
    this.timeline.scrollLeft = 0;
    this.timeline.redraw();
  }

  private renderGraph(timelineDocument: SceneTimelineDocument, selectedId: string): void {
    const selectedKind = this.selectedTrackKind();
    const track = this.playheadTrack(timelineDocument, selectedId);
    this.valueGraph.render({
      timelineDocument,
      selectedKind,
      targetName: this.graphTargetName(selectedKind, selectedId),
      trackLabel: trackLabel(selectedKind, this.selectedAxis ?? undefined),
      selectedAxis: this.selectedAxis,
      selectedKeyframeIds: this.selectedKeyframeIds,
      track
    });
  }

  private graphTargetName(kind: TimelineTrackKind, selectedId: string): string {
    if (isCameraTrack(kind)) return "Camera";
    if (isLightTrack(kind)) return "Lights";
    return this.lastEntryNames.get(selectedId) ?? "Object";
  }

  private selectGraphKeyframe(keyframeId: string, mode: TimelineKeySelectionMode): void {
    const track = this.lastTimelineDocument ? this.playheadTrack(this.lastTimelineDocument, this.lastSelectedId) : undefined;
    if (mode === "toggle") {
      this.selectedKeyframeIds = toggledSelection(this.selectedKeyframeIds, keyframeId);
    } else if (mode === "range" && track) {
      this.selectedKeyframeIds = rangeSelection(track, this.selectedKeyframeIds, keyframeId);
    } else {
      this.selectedKeyframeIds = new Set([keyframeId]);
    }
    if (!this.lastTimelineDocument) return;
    this.syncSelectionWidgets(this.lastTimelineDocument, this.lastSelectedId);
    this.renderGraph(this.lastTimelineDocument, this.lastSelectedId);
  }

  private rowDescriptors(kinds: TimelineTrackKind[], expandObjectAxes: boolean): TimelineRowDescriptor[] {
    return kinds.flatMap((kind) =>
      expandObjectAxes && OBJECT_AXIS_TRACKS.has(kind)
        ? TIMELINE_AXES.map((axis) => ({ kind, axis }))
        : [{ kind }]
    );
  }

  private applyInterpolation(interpolation: TimelineInterpolation): void {
    if (!isTimelineInterpolation(interpolation)) return;
    this.syncInterpolationControls(interpolation);
    this.callbacks.onSetInterpolation([...this.selectedKeyframeIds], interpolation);
  }

  private syncInterpolationControls(interpolation: TimelineInterpolation): void {
    const value = isTimelineInterpolation(interpolation) ? interpolation : "linear";
    this.interpolationSelect.value = value;
    document.querySelectorAll<HTMLButtonElement>(".interpolation-button").forEach((button) => {
      button.classList.toggle("active", button.dataset.interpolation === value);
    });
    this.easePath.setAttribute("d", interpolationPath(value));
    this.easeLabel.textContent = interpolationLabel(value);
  }
}

function isCameraTrack(kind: TimelineTrackKind): kind is "cameraPosition" | "cameraTarget" | "cameraLens" {
  return kind === "cameraPosition" || kind === "cameraTarget" || kind === "cameraLens";
}

function isLightTrack(kind: TimelineTrackKind): boolean {
  return LIGHT_TRACKS.includes(kind);
}

function isObjectTrack(kind: TimelineTrackKind): boolean {
  return OBJECT_TRACKS.includes(kind);
}

function loadTimelineRowFilter(): TimelineRowFilter {
  try {
    return parseTimelineRowFilter(window.localStorage.getItem(ROW_FILTER_STORAGE_KEY));
  } catch {
    return "focus";
  }
}

function storeTimelineRowFilter(filter: TimelineRowFilter): void {
  try {
    window.localStorage.setItem(ROW_FILTER_STORAGE_KEY, filter);
  } catch {
    // Row filtering is an editor preference; blocked storage should not affect timeline editing.
  }
}

function loadTimelineDockHeight(): number | null {
  try {
    const value = Number(window.localStorage.getItem(DOCK_HEIGHT_STORAGE_KEY));
    return Number.isFinite(value) && value >= MIN_DOCK_HEIGHT ? value : null;
  } catch {
    return null;
  }
}

function storeTimelineDockHeight(height: number): void {
  try {
    window.localStorage.setItem(DOCK_HEIGHT_STORAGE_KEY, String(height));
  } catch {
    // Dock sizing is an editor preference; blocked storage should not affect timeline editing.
  }
}

function clearTimelineDockHeight(): void {
  try {
    window.localStorage.removeItem(DOCK_HEIGHT_STORAGE_KEY);
  } catch {
    // Dock sizing is an editor preference; blocked storage should not affect timeline editing.
  }
}

function parseTimelineRowFilter(value: string | null): TimelineRowFilter {
  return value === "keyed" || value === "all" || value === "focus" ? value : "focus";
}

function parseTimelineAxis(value: string | undefined): TimelineAxis | null {
  return value === "x" || value === "y" || value === "z" ? value : null;
}

function isTimelineInterpolation(value: string): value is TimelineInterpolation {
  return value === "linear" || value === "smooth" || value === "hold";
}

function interpolationPath(interpolation: TimelineInterpolation): string {
  if (interpolation === "hold") return "M4 28 H40 V6 H68";
  if (interpolation === "smooth") return "M4 28 C20 28 22 6 36 17 C50 28 52 6 68 6";
  return "M4 28 L68 6";
}

function interpolationLabel(interpolation: TimelineInterpolation): string {
  if (interpolation === "hold") return "Hold";
  if (interpolation === "smooth") return "Easy Ease";
  return "Linear";
}

function commonSelectedAxis(keyframes: TimelineUiKeyframe[]): TimelineAxis | null {
  const first = keyframes[0]?.axis;
  if (!first) return null;
  return keyframes.every((keyframe) => keyframe.axis === first) ? first : null;
}

function toggledSelection(current: Set<string>, keyframeId: string): Set<string> {
  const next = new Set(current);
  if (next.has(keyframeId)) next.delete(keyframeId);
  else next.add(keyframeId);
  return next;
}

function rangeSelection(track: TimelineTrackDocument, current: Set<string>, keyframeId: string): Set<string> {
  const ordered = [...track.keyframes].sort((left, right) => left.time - right.time);
  const target = ordered.find((keyframe) => keyframe.id === keyframeId);
  if (!target) return new Set([keyframeId]);

  const anchor = ordered.find((keyframe) => current.has(keyframe.id)) ?? target;
  const start = Math.min(anchor.time, target.time);
  const end = Math.max(anchor.time, target.time);
  return new Set(ordered
    .filter((keyframe) => keyframe.time >= start - 0.001 && keyframe.time <= end + 0.001)
    .map((keyframe) => keyframe.id));
}

function cssNumber(element: HTMLElement, property: string, fallback: number): number {
  const value = Number.parseFloat(getComputedStyle(element).getPropertyValue(property));
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function trackLabel(kind: TimelineTrackKind, axis?: TimelineAxis): string {
  return axis ? `${TRACK_LABELS[kind]} ${axis.toUpperCase()}` : TRACK_LABELS[kind];
}

function commonValue(values: number[]): string {
  if (values.length === 0) return "";
  const first = values[0];
  return values.every((value) => Math.abs(value - first) < 0.0001) ? formatNumber(first) : "";
}

function formatTimecode(time: number, fps: number): string {
  const safeFps = Math.max(1, Math.round(fps));
  const absoluteFrame = Math.max(0, Math.round(time * safeFps));
  const totalSeconds = Math.floor(absoluteFrame / safeFps);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const frame = absoluteFrame % safeFps;
  return `${pad2(minutes)}:${pad2(seconds)}:${pad2(frame)} | F${String(absoluteFrame).padStart(4, "0")}`;
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}
