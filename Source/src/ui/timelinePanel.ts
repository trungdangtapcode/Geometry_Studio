import {
  Timeline,
  TimelineInteractionMode,
  type TimelineKeyframe,
  TimelineKeyframeShape,
  type TimelineModel,
  type TimelineRow
} from "animation-timeline-js";
import { evaluateTimelineTrack } from "../animation/interpolation";
import { textureSourceLabelFromValue } from "../animation/textureSourceTrack";
import { objectLayerRange } from "../animation/timelineLayers";
import type {
  SceneEntry,
  SceneTimelineDocument,
  TimelineInterpolation,
  TimelineKeyframeDocument,
  TimelineMarkerDocument,
  TimelineTrackDocument,
  TimelineTrackKind
} from "../editor/types";
import { hasSoloTimelineTracks } from "../animation/timelineSchema";
import { timelineValueForEntry } from "../animation/timelineTracks";
import { clamp, formatNumber, hydrateIcons, query } from "../utils/dom";
import {
  AXIS_INDEX,
  TimelineValueGraph,
  TIMELINE_AXES,
  trackAxisConfig,
  type TimelineAxis,
  type TimelineGraphKeySelection,
  type TimelineGraphSelectionMode,
  type TimelineKeySelectionMode
} from "./timelineValueGraph";
import { appendLayerPlayhead, TimelinePlayheadController } from "./timelinePlayhead";
import { snapTimelineEditorTime, type TimelineSnapOptions } from "./timelineSnapping";
import { timelineRowMatchesSearch } from "./timelineRowSearch";
import { TimelineWorkAreaController } from "./timelineWorkArea";
import {
  CAMERA_TRACKS,
  CHANNEL_EXPANDED_TRACKS,
  isCameraTrack,
  isLightTrack,
  isObjectTrack,
  LIGHT_TRACKS,
  OBJECT_TRACKS,
  TRACK_COLORS,
  trackLabel
} from "./timelineTrackMetadata";

type TimelineSettingsPatch = Partial<Pick<SceneTimelineDocument, "duration" | "workStart" | "workEnd" | "fps" | "loop" | "snapEnabled" | "snapStep" | "autoKey">>;
export type TimelineDopeSheetTool = "selection" | "pan";
export type TimelineLayerKeyframeEditMode = "none" | "shift" | "stretch";

export interface KeyframeTimelineCallbacks {
  onTimeChanged(time: number): void;
  onAddKeyframe(kind: TimelineTrackKind): void;
  onSetTransformKeyframes(): void;
  onSetVisibleKeyframes(rows: TimelineVisibleRowTarget[]): void;
  onTrimLayerIn(): void;
  onTrimLayerOut(): void;
  onSplitLayer(): void;
  onSetWorkAreaToLayer(): void;
  onSelectLayerKeyframes(): void;
  onFitLayerKeyframes(): void;
  onSequenceLayers(): void;
  onEditLayerRange(objectId: string, start: number, end: number, keyframeEditMode: TimelineLayerKeyframeEditMode): void;
  onDeleteKeyframes(keyframeIds: string[]): void;
  onRippleDeleteKeyframes(keyframeIds: string[]): void;
  onCopyKeyframes(keyframeIds: string[]): void;
  onCopyVisibleTimeKeyframes(): void;
  onCutVisibleTimeKeyframes(): void;
  onPasteKeyframes(): void;
  onPasteInsertKeyframes(): void;
  onSelectWorkAreaKeyframes(): void;
  onSelectVisibleKeyframes(workAreaOnly: boolean): void;
  onSelectVisibleTimeKeyframes(): void;
  onPreviewSelectedRange(): void;
  onDuplicateKeyframes(keyframeIds: string[]): void;
  onDuplicateVisibleTimeKeyframes(): void;
  onDeleteVisibleTimeKeyframes(): void;
  onInsertVisibleTimeGap(rows: TimelineVisibleRowTarget[]): void;
  onLiftVisibleWorkArea(rows: TimelineVisibleRowTarget[]): void;
  onExtractVisibleWorkArea(rows: TimelineVisibleRowTarget[]): void;
  onNudgeKeyframes(direction: -1 | 1, keyframeIds: string[]): void;
  onMoveKeyframesToPlayhead(keyframeIds: string[]): void;
  onCenterKeyframesOnPlayhead(keyframeIds: string[]): void;
  onRoveKeyframesAcrossTime(keyframeIds: string[]): void;
  onReverseKeyframes(keyframeIds: string[]): void;
  onSnapKeyframesToFrames(keyframeIds: string[]): void;
  onDistributeKeyframes(keyframeIds: string[]): void;
  onFitKeyframesToWorkArea(keyframeIds: string[]): void;
  onStaggerKeyframesFromPlayhead(keyframeIds: string[]): void;
  onCascadeKeyframesFromPlayhead(keyframeIds: string[]): void;
  onEditKeyframes(keyframeIds: string[], patch: TimelineKeyframeEditPatch): void;
  onAddMarker(label: string, color?: string): void;
  onDeleteMarker(markerId: string | null): void;
  onRenameMarker(markerId: string, label: string): void;
  onSetMarkerColor(markerId: string, color: string): void;
  onMoveMarker(markerId: string, time: number): void;
  onStepMarker(direction: -1 | 1): void;
  onClearTrack(kind: TimelineTrackKind): void;
  onToggleTrack(kind: TimelineTrackKind, targetId?: string): void;
  onToggleTrackLock(kind: TimelineTrackKind, targetId?: string): void;
  onToggleTrackSolo(kind: TimelineTrackKind, targetId?: string): void;
  onFitSelectedRange(): void;
  onTrackKindChanged(): void;
  onTrackLabelSelected(targetId: string, kind: TimelineTrackKind): void;
  onStepKeyframe(direction: -1 | 1): void;
  onStepVisibleKeyframe(direction: -1 | 1): void;
  onStepSelectedKeyBoundary(direction: -1 | 1): void;
  onStepFrame(direction: -1 | 1): void;
  onSetInterpolation(keyframeIds: string[], interpolation: TimelineInterpolation): void;
  onDragStarted(): void;
  onKeyframeMoved(keyframeId: string, time: number): void;
  onKeyframeValueChanged(keyframeId: string, axis: TimelineAxis, value: number): void;
  onDragFinished(): void;
  onSettingsChanged(patch: TimelineSettingsPatch): void;
  onTogglePlayback(): void;
}

export interface TimelineVisibleRowTarget {
  targetId: string;
  kind: TimelineTrackKind;
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
type TimelineLayerDragMode = "move" | "trimStart" | "trimEnd";
type TimelineRowDescriptor = {
  kind: TimelineTrackKind;
  axis?: TimelineAxis;
};

type TimelineLayerDragState = {
  pointerId: number;
  button: HTMLButtonElement;
  objectId: string;
  mode: TimelineLayerDragMode;
  startClientX: number;
  originalStart: number;
  originalEnd: number;
  nextStart: number;
  nextEnd: number;
  keyframeEditMode: TimelineLayerKeyframeEditMode;
  duration: number;
  width: number;
  moved: boolean;
};

type TimelineMarkerDragState = {
  pointerId: number;
  button: HTMLButtonElement;
  markerId: string;
  startClientX: number;
  originalTime: number;
  nextTime: number;
  duration: number;
  width: number;
  moved: boolean;
};

type TimelineOverviewDragState = {
  pointerId: number;
  mode: "pan" | "scrub";
  startClientX: number;
  startVisibleTime: number;
  duration: number;
  width: number;
};

type TimelineDetailSource = {
  targetName: string;
  track: TimelineTrackDocument;
  keyframe: TimelineKeyframeDocument;
};

const CAMERA_TARGET_ID = "__camera__";
const LIGHT_TARGET_ID = "__lights__";
const ROW_FILTER_STORAGE_KEY = "geometry-studio-timeline-row-filter";
const ROW_SEARCH_STORAGE_KEY = "geometry-studio-timeline-row-search";
const DOCK_HEIGHT_STORAGE_KEY = "geometry-studio-timeline-dock-height";
const FOLLOW_PLAYHEAD_STORAGE_KEY = "geometry-studio-timeline-follow-playhead";
const LAYER_STRIP_COLLAPSED_STORAGE_KEY = "geometry-studio-timeline-layer-strip-collapsed";
const ROW_FILTER_SEQUENCE: TimelineRowFilter[] = ["focus", "keyed", "all"];
const MIN_DOCK_HEIGHT = 190;
const DEFAULT_ROW_HEIGHT = 30;
const DEFAULT_HEADER_HEIGHT = 28;

export class KeyframeTimelinePanel {
  private readonly timeline: Timeline;
  private readonly root = query<HTMLElement>("#keyframe-dock");
  private readonly resizeHandle = query<HTMLButtonElement>("#timeline-resize-handle");
  private readonly labels = query<HTMLDivElement>("#timeline-track-labels");
  private readonly markerStrip = query<HTMLDivElement>("#timeline-marker-strip");
  private readonly layerStrip = query<HTMLDivElement>("#timeline-layer-strip");
  private readonly canvasHost = query<HTMLDivElement>("#timeline-canvas");
  private readonly overviewTrack = query<HTMLButtonElement>("#timeline-overview-track");
  private readonly overviewKeys = query<HTMLSpanElement>("#timeline-overview-keys");
  private readonly overviewWork = query<HTMLSpanElement>("#timeline-overview-work");
  private readonly overviewViewport = query<HTMLSpanElement>("#timeline-overview-viewport");
  private readonly overviewPlayhead = query<HTMLSpanElement>("#timeline-overview-playhead");
  private readonly toolbar = query<HTMLDivElement>("#timeline-toolbar");
  private readonly trackSelect = query<HTMLSelectElement>("#timeline-track-kind");
  private readonly rowFilterSelect = query<HTMLSelectElement>("#timeline-row-filter");
  private readonly rowSearchInput = query<HTMLInputElement>("#timeline-row-search");
  private readonly playButton = query<HTMLButtonElement>("#timeline-play-toggle");
  private readonly addKeyframeButton = query<HTMLButtonElement>("#timeline-add-keyframe");
  private readonly setTransformButton = query<HTMLButtonElement>("#timeline-set-transform");
  private readonly setVisibleButton = query<HTMLButtonElement>("#timeline-set-visible");
  private readonly layerStripToggleButton = query<HTMLButtonElement>("#timeline-layer-strip-toggle");
  private readonly layerStripInlineToggleButton = query<HTMLButtonElement>("#timeline-layer-strip-inline-toggle");
  private readonly layerStripRestoreButton = query<HTMLButtonElement>("#timeline-layer-strip-restore");
  private readonly copyTimeButton = query<HTMLButtonElement>("#timeline-copy-time");
  private readonly cutTimeButton = query<HTMLButtonElement>("#timeline-cut-time");
  private readonly pasteButton = query<HTMLButtonElement>("#timeline-paste-keyframes");
  private readonly pasteInsertButton = query<HTMLButtonElement>("#timeline-paste-insert-keyframes");
  private readonly duplicateTimeButton = query<HTMLButtonElement>("#timeline-duplicate-time");
  private readonly deleteTimeButton = query<HTMLButtonElement>("#timeline-delete-time");
  private readonly insertGapButton = query<HTMLButtonElement>("#timeline-insert-gap");
  private readonly liftWorkButton = query<HTMLButtonElement>("#timeline-lift-work");
  private readonly extractWorkButton = query<HTMLButtonElement>("#timeline-extract-work");
  private readonly keyframeTargetButtons = [
    query<HTMLButtonElement>("#timeline-delete-keyframe"),
    query<HTMLButtonElement>("#timeline-ripple-delete-keyframes"),
    query<HTMLButtonElement>("#timeline-copy-keyframes"),
    query<HTMLButtonElement>("#timeline-preview-selection"),
    query<HTMLButtonElement>("#timeline-nudge-left"),
    query<HTMLButtonElement>("#timeline-nudge-right"),
    query<HTMLButtonElement>("#timeline-move-to-playhead"),
    query<HTMLButtonElement>("#timeline-center-keyframes"),
    query<HTMLButtonElement>("#timeline-rove-keyframes"),
    query<HTMLButtonElement>("#timeline-reverse-keyframes"),
    query<HTMLButtonElement>("#timeline-snap-keyframes"),
    query<HTMLButtonElement>("#timeline-distribute-keyframes"),
    query<HTMLButtonElement>("#timeline-fit-keyframes"),
    query<HTMLButtonElement>("#timeline-stagger-keyframes"),
    query<HTMLButtonElement>("#timeline-cascade-keyframes"),
    query<HTMLButtonElement>("#timeline-duplicate-keyframe"),
    query<HTMLButtonElement>("#timeline-zoom-selection")
  ];
  private readonly toggleTrackButton = query<HTMLButtonElement>("#timeline-toggle-track");
  private readonly lockTrackButton = query<HTMLButtonElement>("#timeline-lock-track");
  private readonly soloTrackButton = query<HTMLButtonElement>("#timeline-solo-track");
  private readonly clearTrackButton = query<HTMLButtonElement>("#timeline-clear-track");
  private readonly selectionToolButton = query<HTMLButtonElement>("#timeline-selection-tool");
  private readonly panToolButton = query<HTMLButtonElement>("#timeline-pan-tool");
  private readonly followPlayheadButton = query<HTMLButtonElement>("#timeline-follow-playhead");
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
  private readonly interpolationButtons = [...document.querySelectorAll<HTMLButtonElement>(".interpolation-button")];
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
  private readonly markerColorInput = query<HTMLInputElement>("#timeline-marker-color");
  private readonly playheadController: TimelinePlayheadController;
  private readonly workAreaController: TimelineWorkAreaController;
  private selectedKeyframeIds = new Set<string>();
  private lastTimelineDocument: SceneTimelineDocument | null = null;
  private lastEntries: SceneEntry[] = [];
  private lastSelectedId = "";
  private lastPlaying = false;
  private lastEntryNames = new Map<string, string>();
  private activeMarkerId: string | null = null;
  private selectedAxis: TimelineAxis | null = null;
  private rowFilter: TimelineRowFilter = loadTimelineRowFilter();
  private rowSearchText = loadTimelineRowSearch();
  private followPlayhead = loadTimelineFollowPlayhead();
  private layerStripCollapsed = loadLayerStripCollapsed();
  private dopeSheetTool: TimelineDopeSheetTool = "selection";
  private readonly valueGraph: TimelineValueGraph;
  private resizeState: { pointerId: number; startY: number; startHeight: number } | null = null;
  private markerDragState: TimelineMarkerDragState | null = null;
  private overviewDragState: TimelineOverviewDragState | null = null;
  private layerDragState: TimelineLayerDragState | null = null;
  private suppressMarkerClick = false;
  private suppressLayerClick = false;
  private timelineScroller: HTMLElement | null = null;
  private syncingScroll = false;
  private layerStretchModifierActive = false;
  private updating = false;
  private readonly handleResizeMove = (event: PointerEvent) => this.resizeDock(event);
  private readonly handleResizeEnd = (event: PointerEvent) => this.finishResize(event);
  private readonly handleMarkerDragMove = (event: PointerEvent) => this.dragMarker(event);
  private readonly handleMarkerDragEnd = (event: PointerEvent) => this.finishMarkerDrag(event);
  private readonly handleOverviewDragMove = (event: PointerEvent) => this.dragOverview(event);
  private readonly handleOverviewDragEnd = (event: PointerEvent) => this.finishOverviewDrag(event);
  private readonly handleLayerDragMove = (event: PointerEvent) => this.dragLayerRange(event);
  private readonly handleLayerDragEnd = (event: PointerEvent) => this.finishLayerRangeDrag(event);
  private readonly handleTimelineScroll = () => this.syncLabelsFromCanvasScroll();
  private readonly handleWindowResize = () => this.syncToolbarOverflow();
  private readonly handleLayerStretchModifierKey = (event: KeyboardEvent) => this.trackLayerStretchModifier(event);
  private readonly handleWindowBlur = () => { this.layerStretchModifierActive = false; };

  constructor(private readonly callbacks: KeyframeTimelineCallbacks) {
    this.applyStoredDockHeight();
    this.applyLayerStripCollapsed(this.layerStripCollapsed, false);
    this.playheadController = new TimelinePlayheadController({
      markerStrip: this.markerStrip,
      getTimelineDocument: () => this.lastTimelineDocument,
      onTimeChanged: (time) => this.callbacks.onTimeChanged(time),
      onWorkAreaEdgeChanged: (edge, time) => this.callbacks.onSettingsChanged(edge === "start" ? { workStart: time } : { workEnd: time })
    });
    this.workAreaController = new TimelineWorkAreaController({
      markerStrip: this.markerStrip,
      workStartInput: this.workStartInput,
      workEndInput: this.workEndInput,
      getTimelineDocument: () => this.lastTimelineDocument,
      onCommit: (patch) => this.callbacks.onSettingsChanged(patch)
    });
    this.valueGraph = new TimelineValueGraph({
      root: this.root,
      toggleButton: query<HTMLButtonElement>("#timeline-graph-toggle"),
      panel: query<HTMLDivElement>("#timeline-graph-panel"),
      title: query<HTMLElement>("#timeline-graph-title"),
      range: query<HTMLElement>("#timeline-graph-range"),
      svg: query<SVGSVGElement>("#timeline-value-graph"),
      marquee: query<SVGRectElement>("#timeline-graph-marquee"),
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
      onKeyframesMarqueeSelected: (keyframes, mode) => this.selectGraphKeyframes(keyframes, mode),
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
    this.setDopeSheetTool("selection");
    this.bindEvents();
    this.syncZoomState();
    this.syncToolbarOverflow();
  }

  update(timelineDocument: SceneTimelineDocument, entries: Iterable<SceneEntry>, selectedId: string, playing: boolean): void {
    this.updating = true;
    const entryList = Array.from(entries);
    this.lastTimelineDocument = timelineDocument;
    this.lastEntries = entryList;
    this.lastSelectedId = selectedId;
    this.lastPlaying = playing;
    this.lastEntryNames = new Map(entryList.map((entry) => [entry.id, entry.name]));
    this.pruneSelectedKeyframes(timelineDocument);
    this.root.classList.toggle("playing", playing);
    this.root.classList.toggle("auto-key-active", timelineDocument.autoKey);
    this.playButton.innerHTML = `<span data-icon="${playing ? "Pause" : "Play"}"></span><span>${playing ? "Pause" : "Play"}</span>`;
    hydrateIcons(this.playButton);
    this.timeInput.value = formatNumber(timelineDocument.currentTime);
    this.durationInput.value = formatNumber(timelineDocument.duration);
    this.workStartInput.value = formatNumber(timelineDocument.workStart);
    this.workEndInput.value = formatNumber(timelineDocument.workEnd);
    this.fpsInput.value = String(timelineDocument.fps);
    this.loopInput.checked = timelineDocument.loop;
    this.snapInput.checked = timelineDocument.snapEnabled;
    this.autoKeyInput.checked = timelineDocument.autoKey;
    this.snapStepInput.value = formatNumber(timelineDocument.snapStep);
    this.rowFilterSelect.value = this.rowFilter;
    this.rowSearchInput.value = this.rowSearchText;
    this.syncInterpolationControls(this.currentInterpolation(timelineDocument, selectedId));
    this.syncAddKeyframeButton(timelineDocument, selectedId);
    this.syncToggleTrackButton(timelineDocument, selectedId);
    this.syncLockTrackButton(timelineDocument, selectedId);
    this.syncSoloTrackButton(timelineDocument, selectedId);
    this.syncClearTrackButton(timelineDocument, selectedId);

    const visibleEntries = this.visibleEntries(timelineDocument, entryList, selectedId);
    const rowHeight = this.timelineRowHeight();
    const headerHeight = this.timelineHeaderHeight();
    this.renderLayerStrip(timelineDocument, entryList, selectedId);
    this.labels.innerHTML = this.renderLabels(timelineDocument, visibleEntries, selectedId);
    hydrateIcons(this.labels);
    this.syncTimecode(timelineDocument);
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
    this.syncFollowPlayheadButton();
    this.ensurePlayheadVisible(timelineDocument.currentTime, playing);
    this.renderMarkers(timelineDocument);
    this.renderOverview(timelineDocument);
    this.syncSelectionWidgets(timelineDocument, selectedId);
    this.renderGraph(timelineDocument, selectedId);
    this.lockDockScroll();
    this.syncToolbarOverflow();
    this.updating = false;
  }

  selectedTrackKind(): TimelineTrackKind {
    return this.trackSelect.value as TimelineTrackKind;
  }

  selectedKeyframeIdsList(): string[] {
    return [...this.selectedKeyframeIds];
  }

  selectKeyframes(keyframeIds: string[]): void {
    this.selectedKeyframeIds = new Set(keyframeIds);
    if (!this.lastTimelineDocument) return;
    this.syncSelectionWidgets(this.lastTimelineDocument, this.lastSelectedId);
    this.renderGraph(this.lastTimelineDocument, this.lastSelectedId);
    this.refreshCanvas();
  }

  selectAllActiveTrackKeyframes(): number {
    if (!this.lastTimelineDocument) return 0;
    const track = this.playheadTrack(this.lastTimelineDocument, this.lastSelectedId);
    this.selectedKeyframeIds = new Set(track?.keyframes.map((keyframe) => keyframe.id) ?? []);
    this.syncSelectionWidgets(this.lastTimelineDocument, this.lastSelectedId);
    this.renderGraph(this.lastTimelineDocument, this.lastSelectedId);
    this.refreshCanvas();
    return this.selectedKeyframeIds.size;
  }

  selectActiveTrackKeyframesInWorkArea(): number {
    if (!this.lastTimelineDocument) return 0;
    const track = this.playheadTrack(this.lastTimelineDocument, this.lastSelectedId);
    const workStart = Math.min(this.lastTimelineDocument.workStart, this.lastTimelineDocument.workEnd);
    const workEnd = Math.max(this.lastTimelineDocument.workStart, this.lastTimelineDocument.workEnd);
    this.selectedKeyframeIds = new Set(track?.keyframes
      .filter((keyframe) => keyframe.time >= workStart - 0.001 && keyframe.time <= workEnd + 0.001)
      .map((keyframe) => keyframe.id) ?? []);
    this.syncSelectionWidgets(this.lastTimelineDocument, this.lastSelectedId);
    this.renderGraph(this.lastTimelineDocument, this.lastSelectedId);
    this.refreshCanvas();
    return this.selectedKeyframeIds.size;
  }

  selectVisibleRowKeyframes(workAreaOnly = false): number {
    if (!this.lastTimelineDocument) return 0;
    const timelineDocument = this.lastTimelineDocument;
    const workStart = Math.min(timelineDocument.workStart, timelineDocument.workEnd);
    const workEnd = Math.max(timelineDocument.workStart, timelineDocument.workEnd);
    const selectedIds = new Set<string>();
    this.visibleRowTargets().forEach((target) => {
      const track = this.trackForTarget(timelineDocument, target.targetId, target.kind);
      track?.keyframes.forEach((keyframe) => {
        const insideWorkArea = keyframe.time >= workStart - 0.001 && keyframe.time <= workEnd + 0.001;
        if (!workAreaOnly || insideWorkArea) selectedIds.add(keyframe.id);
      });
    });
    this.selectedKeyframeIds = selectedIds;
    this.selectedAxis = null;
    this.syncSelectionWidgets(timelineDocument, this.lastSelectedId);
    this.renderGraph(timelineDocument, this.lastSelectedId);
    this.refreshCanvas();
    return this.selectedKeyframeIds.size;
  }

  selectVisibleRowKeyframesAtCurrentTime(): number {
    if (!this.lastTimelineDocument) return 0;
    const timelineDocument = this.lastTimelineDocument;
    const currentTime = timelineDocument.currentTime;
    const tolerance = Math.max(0.001, timelineDocument.snapEnabled ? timelineDocument.snapStep * 0.5 : 0.001);
    const selectedIds = new Set<string>();
    this.visibleRowTargets().forEach((target) => {
      const track = this.trackForTarget(timelineDocument, target.targetId, target.kind);
      track?.keyframes.forEach((keyframe) => {
        if (Math.abs(keyframe.time - currentTime) <= tolerance) selectedIds.add(keyframe.id);
      });
    });
    this.selectedKeyframeIds = selectedIds;
    this.selectedAxis = null;
    this.syncSelectionWidgets(timelineDocument, this.lastSelectedId);
    this.renderGraph(timelineDocument, this.lastSelectedId);
    this.refreshCanvas();
    return this.selectedKeyframeIds.size;
  }

  visibleRowKeyframeTimes(): number[] {
    if (!this.lastTimelineDocument) return [];
    const timelineDocument = this.lastTimelineDocument;
    const times = new Set<number>();
    this.visibleRowTargets().forEach((target) => {
      const track = this.trackForTarget(timelineDocument, target.targetId, target.kind);
      track?.keyframes.forEach((keyframe) => times.add(roundTimelineTime(keyframe.time)));
    });
    return [...times].sort((left, right) => left - right);
  }

  visibleRowTargetsList(): TimelineVisibleRowTarget[] {
    return this.visibleRowTargets();
  }

  cycleRowFilter(): string {
    const currentIndex = ROW_FILTER_SEQUENCE.indexOf(this.rowFilter);
    const next = ROW_FILTER_SEQUENCE[(currentIndex + 1) % ROW_FILTER_SEQUENCE.length] ?? "focus";
    this.applyRowFilter(next);
    return rowFilterLabel(next);
  }

  focusRowSearch(): void {
    this.rowSearchInput.focus();
    this.rowSearchInput.select();
  }

  revealRows(kind: TimelineTrackKind, search = "", filter: "focus" | "keyed" | "all" = "focus"): void {
    this.trackSelect.value = kind;
    this.selectedAxis = null;
    this.rowFilter = filter;
    this.rowSearchText = normalizeRowSearch(search);
    this.rowFilterSelect.value = this.rowFilter;
    this.rowSearchInput.value = this.rowSearchText;
    storeTimelineRowFilter(this.rowFilter);
    storeTimelineRowSearch(this.rowSearchText);
    if (!this.lastTimelineDocument) return;
    this.update(this.lastTimelineDocument, this.lastEntries, this.lastSelectedId, this.lastPlaying);
    this.scrollActiveRowIntoView();
  }

  zoomTimeline(direction: -1 | 1): void {
    if (direction > 0) this.timeline.zoomOut(0.25);
    else this.timeline.zoomIn(0.25);
    this.syncZoomState();
    this.refreshCanvas();
  }

  fitTimelineToDuration(): void {
    this.fitTimeline();
  }

  fitTimelineToRange(start: number, end: number): void {
    const timelineDocument = this.lastTimelineDocument;
    const fallbackDuration = Number(this.durationInput.value) || 8;
    const duration = Math.max(timelineDocument?.duration ?? fallbackDuration, 0.5);
    const rawStart = clamp(Math.min(start, end), 0, duration);
    const rawEnd = clamp(Math.max(start, end), 0, duration);
    const minimumSpan = Math.max(timelineDocument?.snapStep ?? 1 / 30, 1 / (timelineDocument?.fps ?? 30), 0.5);
    const center = clamp((rawStart + rawEnd) / 2, 0, duration);
    const span = Math.max(rawEnd - rawStart, minimumSpan);
    let viewStart = clamp(center - span / 2, 0, duration);
    let viewEnd = clamp(center + span / 2, 0, duration);
    if (viewEnd - viewStart < span) {
      if (viewStart === 0) viewEnd = clamp(span, 0, duration);
      else if (viewEnd === duration) viewStart = clamp(duration - span, 0, duration);
    }

    const clientWidth = Math.max(this.timeline.getClientWidth(), 1);
    const padding = Math.min(Math.max(clientWidth * 0.14, 40), 140);
    const availableWidth = Math.max(clientWidth - padding * 2, clientWidth * 0.4, 1);
    const zoom = Math.max(0.05, Math.min(8, (Math.max(viewEnd - viewStart, minimumSpan) * 80) / availableWidth));
    this.timeline.setZoom(zoom);
    this.timeline.scrollLeft = Math.max(0, this.timeline.valToPx(viewStart) - padding);
    this.syncZoomState();
    this.timeline.redraw();
  }

  toggleFollowPlayhead(): boolean {
    this.followPlayhead = !this.followPlayhead;
    storeTimelineFollowPlayhead(this.followPlayhead);
    this.syncFollowPlayheadButton();
    if (this.lastTimelineDocument) this.ensurePlayheadVisible(this.lastTimelineDocument.currentTime, true);
    return this.followPlayhead;
  }

  setDopeSheetTool(tool: TimelineDopeSheetTool): TimelineDopeSheetTool {
    this.dopeSheetTool = tool;
    this.timeline.setInteractionMode(tool === "pan" ? TimelineInteractionMode.Pan : TimelineInteractionMode.Selection);
    this.syncDopeSheetToolButtons();
    return this.dopeSheetTool;
  }

  setClipboardState(summary: { count: number; duration: number } | null): void {
    const disabled = !summary || summary.count === 0;
    const keyText = summary?.count === 1 ? "1 keyframe" : `${summary?.count ?? 0} keyframes`;
    this.pasteButton.disabled = disabled;
    this.pasteInsertButton.disabled = disabled;
    this.pasteButton.title = disabled
      ? "Copy keyframes before pasting"
      : `Paste ${keyText} at the playhead`;
    this.pasteInsertButton.title = disabled
      ? "Copy keyframes before insert-pasting"
      : `Paste ${keyText} and shift later destination keys by ${formatNumber(summary.duration)}s`;
  }

  setPlaybackTime(timelineDocument: SceneTimelineDocument, playing: boolean): void {
    this.updating = true;
    this.root.classList.toggle("playing", playing);
    this.root.classList.toggle("auto-key-active", timelineDocument.autoKey);
    this.playButton.innerHTML = `<span data-icon="${playing ? "Pause" : "Play"}"></span><span>${playing ? "Pause" : "Play"}</span>`;
    hydrateIcons(this.playButton);
    this.timeInput.value = formatNumber(timelineDocument.currentTime);
    this.timeline.setTime(timelineDocument.currentTime);
    this.ensurePlayheadVisible(timelineDocument.currentTime, playing);
    this.syncRowKeyButtons(timelineDocument);
    this.syncRowValueReadouts(timelineDocument);
    this.syncTimecode(timelineDocument);
    this.renderMarkers(timelineDocument);
    this.syncOverviewIndicators(timelineDocument);
    this.syncAddKeyframeButton(timelineDocument, this.lastSelectedId);
    this.syncSelectionWidgets(timelineDocument, this.lastSelectedId);
    this.renderGraph(timelineDocument, this.lastSelectedId);
    this.lockDockScroll();
    this.updating = false;
  }

  private bindEvents(): void {
    this.resizeHandle.addEventListener("pointerdown", (event) => this.startResize(event));
    this.resizeHandle.addEventListener("dblclick", () => this.resetDockHeight());
    this.labels.addEventListener("scroll", () => this.syncCanvasScrollFromLabels());
    this.toolbar.addEventListener("scroll", () => this.syncToolbarOverflow());
    this.toolbar.addEventListener("wheel", (event) => this.scrollToolbarWithWheel(event), { passive: false });
    this.toolbar.addEventListener("keydown", (event) => this.scrollToolbarWithKeyboard(event));
    window.addEventListener("resize", this.handleWindowResize);
    window.addEventListener("keydown", this.handleLayerStretchModifierKey);
    window.addEventListener("keyup", this.handleLayerStretchModifierKey);
    window.addEventListener("blur", this.handleWindowBlur);
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
    this.setVisibleButton.addEventListener("click", () => {
      this.callbacks.onSetVisibleKeyframes(this.visibleRowTargets());
    });
    query<HTMLButtonElement>("#timeline-layer-in").addEventListener("click", () => this.callbacks.onTrimLayerIn());
    query<HTMLButtonElement>("#timeline-layer-out").addEventListener("click", () => this.callbacks.onTrimLayerOut());
    query<HTMLButtonElement>("#timeline-split-layer").addEventListener("click", () => this.callbacks.onSplitLayer());
    query<HTMLButtonElement>("#timeline-layer-work").addEventListener("click", () => this.callbacks.onSetWorkAreaToLayer());
    query<HTMLButtonElement>("#timeline-select-layer-keys").addEventListener("click", () => this.callbacks.onSelectLayerKeyframes());
    query<HTMLButtonElement>("#timeline-fit-layer-keys").addEventListener("click", () => this.callbacks.onFitLayerKeyframes());
    query<HTMLButtonElement>("#timeline-sequence-layers").addEventListener("click", () => this.callbacks.onSequenceLayers());
    this.layerStripToggleButton.addEventListener("click", () => {
      this.applyLayerStripCollapsed(!this.layerStripCollapsed, true);
    });
    this.layerStripInlineToggleButton.addEventListener("click", () => {
      this.applyLayerStripCollapsed(true, true);
    });
    this.layerStripRestoreButton.addEventListener("click", () => {
      this.applyLayerStripCollapsed(false, true);
    });
    query<HTMLButtonElement>("#timeline-delete-keyframe").addEventListener("click", () => {
      this.callbacks.onDeleteKeyframes([...this.selectedKeyframeIds]);
    });
    query<HTMLButtonElement>("#timeline-ripple-delete-keyframes").addEventListener("click", () => {
      this.callbacks.onRippleDeleteKeyframes([...this.selectedKeyframeIds]);
    });
    query<HTMLButtonElement>("#timeline-copy-keyframes").addEventListener("click", () => {
      this.callbacks.onCopyKeyframes([...this.selectedKeyframeIds]);
    });
    this.copyTimeButton.addEventListener("click", () => {
      this.callbacks.onCopyVisibleTimeKeyframes();
    });
    this.cutTimeButton.addEventListener("click", () => {
      this.callbacks.onCutVisibleTimeKeyframes();
    });
    this.pasteButton.addEventListener("click", () => {
      this.callbacks.onPasteKeyframes();
    });
    this.pasteInsertButton.addEventListener("click", () => {
      this.callbacks.onPasteInsertKeyframes();
    });
    query<HTMLButtonElement>("#timeline-select-workarea").addEventListener("click", () => {
      this.callbacks.onSelectWorkAreaKeyframes();
    });
    query<HTMLButtonElement>("#timeline-select-visible").addEventListener("click", () => {
      this.callbacks.onSelectVisibleKeyframes(false);
    });
    query<HTMLButtonElement>("#timeline-select-time").addEventListener("click", () => {
      this.callbacks.onSelectVisibleTimeKeyframes();
    });
    query<HTMLButtonElement>("#timeline-preview-selection").addEventListener("click", () => {
      this.callbacks.onPreviewSelectedRange();
    });
    query<HTMLButtonElement>("#timeline-nudge-left").addEventListener("click", () => {
      this.callbacks.onNudgeKeyframes(-1, [...this.selectedKeyframeIds]);
    });
    query<HTMLButtonElement>("#timeline-nudge-right").addEventListener("click", () => {
      this.callbacks.onNudgeKeyframes(1, [...this.selectedKeyframeIds]);
    });
    query<HTMLButtonElement>("#timeline-move-to-playhead").addEventListener("click", () => {
      this.callbacks.onMoveKeyframesToPlayhead([...this.selectedKeyframeIds]);
    });
    query<HTMLButtonElement>("#timeline-center-keyframes").addEventListener("click", () => {
      this.callbacks.onCenterKeyframesOnPlayhead([...this.selectedKeyframeIds]);
    });
    query<HTMLButtonElement>("#timeline-rove-keyframes").addEventListener("click", () => {
      this.callbacks.onRoveKeyframesAcrossTime([...this.selectedKeyframeIds]);
    });
    query<HTMLButtonElement>("#timeline-reverse-keyframes").addEventListener("click", () => {
      this.callbacks.onReverseKeyframes([...this.selectedKeyframeIds]);
    });
    query<HTMLButtonElement>("#timeline-snap-keyframes").addEventListener("click", () => {
      this.callbacks.onSnapKeyframesToFrames([...this.selectedKeyframeIds]);
    });
    query<HTMLButtonElement>("#timeline-distribute-keyframes").addEventListener("click", () => {
      this.callbacks.onDistributeKeyframes([...this.selectedKeyframeIds]);
    });
    query<HTMLButtonElement>("#timeline-fit-keyframes").addEventListener("click", () => {
      this.callbacks.onFitKeyframesToWorkArea([...this.selectedKeyframeIds]);
    });
    query<HTMLButtonElement>("#timeline-stagger-keyframes").addEventListener("click", () => {
      this.callbacks.onStaggerKeyframesFromPlayhead([...this.selectedKeyframeIds]);
    });
    query<HTMLButtonElement>("#timeline-cascade-keyframes").addEventListener("click", () => {
      this.callbacks.onCascadeKeyframesFromPlayhead([...this.selectedKeyframeIds]);
    });
    query<HTMLButtonElement>("#timeline-add-marker").addEventListener("click", () => {
      this.callbacks.onAddMarker(this.markerLabelInput.value.trim(), this.markerColorInput.value);
    });
    query<HTMLButtonElement>("#timeline-delete-marker").addEventListener("click", () => {
      this.callbacks.onDeleteMarker(this.activeMarkerId);
    });
    query<HTMLButtonElement>("#timeline-prev-marker").addEventListener("click", () => this.callbacks.onStepMarker(-1));
    query<HTMLButtonElement>("#timeline-next-marker").addEventListener("click", () => this.callbacks.onStepMarker(1));
    this.markerLabelInput.addEventListener("change", () => {
      if (this.activeMarkerId) this.callbacks.onRenameMarker(this.activeMarkerId, this.markerLabelInput.value);
    });
    this.markerColorInput.addEventListener("change", () => {
      if (this.activeMarkerId) this.callbacks.onSetMarkerColor(this.activeMarkerId, this.markerColorInput.value);
    });
    this.markerStrip.addEventListener("pointerdown", (event) => this.playheadController.startDrag(event));
    this.markerStrip.addEventListener("pointerdown", (event) => this.workAreaController.startDrag(event));
    this.markerStrip.addEventListener("pointerdown", (event) => this.startMarkerDrag(event));
    this.overviewTrack.addEventListener("pointerdown", (event) => this.startOverviewDrag(event));
    this.markerStrip.addEventListener("click", (event) => {
      if (this.suppressMarkerClick) {
        this.suppressMarkerClick = false;
        event.preventDefault();
        return;
      }
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>(".timeline-marker");
      if (!button) return;
      const time = Number(button.dataset.time);
      if (Number.isFinite(time)) this.callbacks.onTimeChanged(time);
    });
    this.layerStrip.addEventListener("pointerdown", (event) => this.startLayerRangeDrag(event));
    this.layerStrip.addEventListener("click", (event) => {
      if (this.suppressLayerClick) {
        this.suppressLayerClick = false;
        event.preventDefault();
        return;
      }
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>(".timeline-layer-bar");
      const objectId = button?.dataset.objectId;
      if (!objectId) return;
      this.callbacks.onTrackLabelSelected(objectId, this.selectedTrackKind());
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
    this.duplicateTimeButton.addEventListener("click", () => {
      this.callbacks.onDuplicateVisibleTimeKeyframes();
    });
    this.deleteTimeButton.addEventListener("click", () => {
      this.callbacks.onDeleteVisibleTimeKeyframes();
    });
    this.insertGapButton.addEventListener("click", () => {
      this.callbacks.onInsertVisibleTimeGap(this.visibleRowTargets());
    });
    this.liftWorkButton.addEventListener("click", () => {
      this.callbacks.onLiftVisibleWorkArea(this.visibleRowTargets());
    });
    this.extractWorkButton.addEventListener("click", () => {
      this.callbacks.onExtractVisibleWorkArea(this.visibleRowTargets());
    });
    this.clearTrackButton.addEventListener("click", () => {
      this.callbacks.onClearTrack(this.selectedTrackKind());
    });
    this.toggleTrackButton.addEventListener("click", () => this.callbacks.onToggleTrack(this.selectedTrackKind()));
    this.lockTrackButton.addEventListener("click", () => this.callbacks.onToggleTrackLock(this.selectedTrackKind()));
    this.soloTrackButton.addEventListener("click", () => this.callbacks.onToggleTrackSolo(this.selectedTrackKind()));
    this.labels.addEventListener("click", (event) => {
      const keyButton = (event.target as HTMLElement).closest<HTMLButtonElement>(".timeline-row-key");
      const switchButton = (event.target as HTMLElement).closest<HTMLButtonElement>(".timeline-row-switch");
      const row = (event.target as HTMLElement).closest<HTMLElement>(".timeline-track-label");
      if (!row) return;
      const kind = row.dataset.trackKind as TimelineTrackKind | undefined;
      const axis = parseTimelineAxis(row.dataset.trackAxis);
      const targetId = row.dataset.objectId;
      if (!kind || !targetId) return;
      this.trackSelect.value = kind;
      this.selectedAxis = axis;
      this.callbacks.onTrackLabelSelected(targetId, kind);
      if (switchButton) {
        const action = switchButton.dataset.rowAction;
        if (action === "toggle") this.callbacks.onToggleTrack(kind, targetId);
        if (action === "solo") this.callbacks.onToggleTrackSolo(kind, targetId);
        if (action === "lock") this.callbacks.onToggleTrackLock(kind, targetId);
        return;
      }
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
    query<HTMLButtonElement>("#timeline-prev-visible-keyframe").addEventListener("click", () => this.callbacks.onStepVisibleKeyframe(-1));
    query<HTMLButtonElement>("#timeline-next-visible-keyframe").addEventListener("click", () => this.callbacks.onStepVisibleKeyframe(1));
    query<HTMLButtonElement>("#timeline-selected-start").addEventListener("click", () => this.callbacks.onStepSelectedKeyBoundary(-1));
    query<HTMLButtonElement>("#timeline-selected-end").addEventListener("click", () => this.callbacks.onStepSelectedKeyBoundary(1));
    query<HTMLButtonElement>("#timeline-zoom-out").addEventListener("click", () => this.zoomTimeline(-1));
    query<HTMLButtonElement>("#timeline-zoom-in").addEventListener("click", () => this.zoomTimeline(1));
    query<HTMLButtonElement>("#timeline-zoom-fit").addEventListener("click", () => this.fitTimelineToDuration());
    query<HTMLButtonElement>("#timeline-zoom-selection").addEventListener("click", () => this.callbacks.onFitSelectedRange());
    this.selectionToolButton.addEventListener("click", () => this.setDopeSheetTool("selection"));
    this.panToolButton.addEventListener("click", () => this.setDopeSheetTool("pan"));
    this.followPlayheadButton.addEventListener("click", () => this.toggleFollowPlayhead());
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
      this.applyRowFilter(parseTimelineRowFilter(this.rowFilterSelect.value));
    });
    this.rowSearchInput.addEventListener("input", () => {
      this.applyRowSearch(this.rowSearchInput.value);
    });
    this.rowSearchInput.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      this.applyRowSearch("");
      this.rowSearchInput.blur();
    });
    this.interpolationSelect.addEventListener("change", () => {
      this.applyInterpolation(this.interpolationSelect.value as TimelineInterpolation);
    });
    this.interpolationButtons.forEach((button) => {
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

  private applyLayerStripCollapsed(collapsed: boolean, persist: boolean): void {
    this.layerStripCollapsed = collapsed;
    this.root.classList.toggle("layer-strip-collapsed", collapsed);
    const label = collapsed ? "Show overview and object layer ranges" : "Minimize overview and object layer ranges";
    const title = collapsed
      ? "Show overview and object layer ranges"
      : "Minimize overview and object layer ranges";
    [this.layerStripToggleButton, this.layerStripInlineToggleButton, this.layerStripRestoreButton].forEach((button) => {
      button.setAttribute("aria-expanded", String(!collapsed));
      button.setAttribute("aria-label", label);
      button.title = title;
    });
    this.layerStripToggleButton.innerHTML = `<span data-icon="${collapsed ? "PanelTopOpen" : "PanelTopClose"}"></span>`;
    this.layerStripInlineToggleButton.innerHTML = `<span data-icon="${collapsed ? "PanelTopOpen" : "PanelTopClose"}"></span>`;
    this.layerStripRestoreButton.innerHTML = `<span data-icon="PanelTopOpen"></span><span>Show Ranges</span>`;
    hydrateIcons(this.layerStripToggleButton);
    hydrateIcons(this.layerStripInlineToggleButton);
    hydrateIcons(this.layerStripRestoreButton);
    if (persist) storeLayerStripCollapsed(collapsed);
    if (this.lastTimelineDocument) this.renderLayerStrip(this.lastTimelineDocument, this.lastEntries, this.lastSelectedId);
    window.setTimeout(() => this.refreshCanvas(), 0);
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
    this.syncOverviewViewport();
    this.syncToolbarOverflow();
  }

  private syncToolbarOverflow(): void {
    const hasLeftOverflow = this.toolbar.scrollLeft > 1;
    const hasRightOverflow = this.toolbar.scrollLeft + this.toolbar.clientWidth < this.toolbar.scrollWidth - 1;
    toggleDatasetFlag(this.toolbar, "overflowLeft", hasLeftOverflow);
    toggleDatasetFlag(this.toolbar, "overflowRight", hasRightOverflow);
  }

  private scrollToolbarWithWheel(event: WheelEvent): void {
    const canScroll = this.toolbar.scrollWidth > this.toolbar.clientWidth + 1;
    if (!canScroll || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    event.preventDefault();
    this.toolbar.scrollBy({ left: event.deltaY, behavior: "auto" });
    this.syncToolbarOverflow();
  }

  private scrollToolbarWithKeyboard(event: KeyboardEvent): void {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight" && event.key !== "Home" && event.key !== "End") return;
    const canScroll = this.toolbar.scrollWidth > this.toolbar.clientWidth + 1;
    if (!canScroll) return;

    event.preventDefault();
    if (event.key === "Home") {
      this.toolbar.scrollTo({ left: 0, behavior: "auto" });
    } else if (event.key === "End") {
      this.toolbar.scrollTo({ left: this.toolbar.scrollWidth, behavior: "auto" });
    } else {
      const direction = event.key === "ArrowLeft" ? -1 : 1;
      this.toolbar.scrollBy({ left: direction * 160, behavior: "auto" });
    }
    this.syncToolbarOverflow();
  }

  private applyRowFilter(filter: TimelineRowFilter): void {
    this.rowFilter = filter;
    this.rowFilterSelect.value = filter;
    storeTimelineRowFilter(filter);
    if (this.lastTimelineDocument) this.update(this.lastTimelineDocument, this.lastEntries, this.lastSelectedId, this.lastPlaying);
  }

  private applyRowSearch(value: string): void {
    this.rowSearchText = normalizeRowSearch(value);
    this.rowSearchInput.value = this.rowSearchText;
    storeTimelineRowSearch(this.rowSearchText);
    if (this.lastTimelineDocument) this.update(this.lastTimelineDocument, this.lastEntries, this.lastSelectedId, this.lastPlaying);
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
    this.syncOverviewViewport();
  }

  private syncCanvasScrollFromLabels(): void {
    if (!this.timelineScroller || this.syncingScroll) return;
    this.syncingScroll = true;
    this.timelineScroller.scrollTop = this.labels.scrollTop;
    this.syncingScroll = false;
    this.syncOverviewViewport();
  }

  private timelineRowHeight(): number {
    return cssNumber(this.root, "--timeline-track-row-height", DEFAULT_ROW_HEIGHT);
  }

  private timelineHeaderHeight(): number {
    return cssNumber(this.root, "--timeline-track-top-padding", DEFAULT_HEADER_HEIGHT);
  }

  private visibleEntries(timelineDocument: SceneTimelineDocument, entries: Iterable<SceneEntry>, selectedId: string): SceneEntry[] {
    const entryList = Array.from(entries);
    if (this.hasRowSearch()) return entryList;
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
    this.workAreaController.render(timelineDocument);
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
    this.playheadController.render(timelineDocument);
    this.syncMarkerEditor(timelineDocument, activeMarker);
  }

  private renderOverview(timelineDocument: SceneTimelineDocument): void {
    const duration = Math.max(timelineDocument.duration, 0.001);
    const keyframes = this.timelineOverviewKeyframes(timelineDocument);
    const maxTicks = 420;
    const step = Math.max(1, Math.ceil(keyframes.length / maxTicks));
    this.overviewKeys.innerHTML = "";
    keyframes.forEach((keyframe, index) => {
      if (index % step !== 0) return;
      const tick = document.createElement("span");
      tick.className = "timeline-overview-key";
      tick.dataset.keyframeId = keyframe.id;
      tick.classList.toggle("selected", this.selectedKeyframeIds.has(keyframe.id));
      tick.style.left = `${clamp((keyframe.time / duration) * 100, 0, 100)}%`;
      tick.title = `Key at ${formatNumber(keyframe.time)}s`;
      this.overviewKeys.appendChild(tick);
    });
    this.syncOverviewIndicators(timelineDocument);
  }

  private syncOverviewIndicators(timelineDocument: SceneTimelineDocument): void {
    const duration = Math.max(timelineDocument.duration, 0.001);
    const workStart = clamp(Math.min(timelineDocument.workStart, timelineDocument.workEnd), 0, duration);
    const workEnd = clamp(Math.max(timelineDocument.workStart, timelineDocument.workEnd), 0, duration);
    this.overviewWork.style.left = `${(workStart / duration) * 100}%`;
    this.overviewWork.style.width = `${Math.max(((workEnd - workStart) / duration) * 100, 0.4)}%`;
    this.overviewPlayhead.style.left = `${clamp((timelineDocument.currentTime / duration) * 100, 0, 100)}%`;
    this.syncOverviewViewport();
  }

  private syncOverviewViewport(): void {
    if (!this.lastTimelineDocument) return;
    const duration = Math.max(this.lastTimelineDocument.duration, 0.001);
    const scroller = this.timelineScroller ?? this.canvasHost.querySelector<HTMLElement>(".scroll-container");
    if (!scroller) {
      this.overviewViewport.style.left = "0%";
      this.overviewViewport.style.width = "100%";
      return;
    }

    const visibleStart = clamp(this.timeline.pxToVal(scroller.scrollLeft), 0, duration);
    const visibleEnd = clamp(this.timeline.pxToVal(scroller.scrollLeft + scroller.clientWidth), 0, duration);
    this.overviewViewport.style.left = `${(visibleStart / duration) * 100}%`;
    this.overviewViewport.style.width = `${Math.max(((visibleEnd - visibleStart) / duration) * 100, 0.8)}%`;
  }

  private startOverviewDrag(event: PointerEvent): void {
    if (event.button !== 0 || !this.lastTimelineDocument) return;
    const rect = this.overviewTrack.getBoundingClientRect();
    if (rect.width <= 0) return;
    const duration = Math.max(this.lastTimelineDocument.duration, 0.001);
    const scroller = this.timelineScroller ?? this.canvasHost.querySelector<HTMLElement>(".scroll-container");
    const visibleStart = scroller ? clamp(this.timeline.pxToVal(scroller.scrollLeft), 0, duration) : 0;
    const visibleEnd = scroller ? clamp(this.timeline.pxToVal(scroller.scrollLeft + scroller.clientWidth), 0, duration) : duration;
    const pointerTime = this.overviewTimeFromClientX(event.clientX, rect, duration);
    const insideViewport = pointerTime >= visibleStart && pointerTime <= visibleEnd;
    const mode = insideViewport && scroller && scroller.scrollWidth > scroller.clientWidth ? "pan" : "scrub";

    this.overviewDragState = {
      pointerId: event.pointerId,
      mode,
      startClientX: event.clientX,
      startVisibleTime: visibleStart,
      duration,
      width: rect.width
    };
    this.overviewTrack.classList.add("dragging");
    try {
      this.overviewTrack.setPointerCapture(event.pointerId);
    } catch {
      // Synthetic pointer events in automated checks do not always create an active pointer capture target.
    }
    this.overviewTrack.addEventListener("pointermove", this.handleOverviewDragMove);
    this.overviewTrack.addEventListener("pointerup", this.handleOverviewDragEnd);
    this.overviewTrack.addEventListener("pointercancel", this.handleOverviewDragEnd);
    if (mode === "scrub") this.callbacks.onTimeChanged(pointerTime);
    event.preventDefault();
  }

  private dragOverview(event: PointerEvent): void {
    const state = this.overviewDragState;
    if (!state || event.pointerId !== state.pointerId) return;
    if (state.mode === "pan") {
      const deltaTime = ((event.clientX - state.startClientX) / state.width) * state.duration;
      const nextVisibleTime = clamp(state.startVisibleTime + deltaTime, 0, state.duration);
      this.timeline.scrollLeft = Math.max(0, this.timeline.valToPx(nextVisibleTime));
      this.syncOverviewViewport();
      return;
    }

    const rect = this.overviewTrack.getBoundingClientRect();
    this.callbacks.onTimeChanged(this.overviewTimeFromClientX(event.clientX, rect, state.duration));
  }

  private finishOverviewDrag(event: PointerEvent): void {
    const state = this.overviewDragState;
    if (!state || event.pointerId !== state.pointerId) return;
    this.overviewTrack.classList.remove("dragging");
    this.overviewTrack.removeEventListener("pointermove", this.handleOverviewDragMove);
    this.overviewTrack.removeEventListener("pointerup", this.handleOverviewDragEnd);
    this.overviewTrack.removeEventListener("pointercancel", this.handleOverviewDragEnd);
    try {
      if (this.overviewTrack.hasPointerCapture(event.pointerId)) this.overviewTrack.releasePointerCapture(event.pointerId);
    } catch {
      // See the matching setPointerCapture guard in startOverviewDrag.
    }
    this.overviewDragState = null;
  }

  private overviewTimeFromClientX(clientX: number, rect: DOMRect, duration: number): number {
    const normalized = clamp((clientX - rect.left) / Math.max(rect.width, 1), 0, 1);
    const rawTime = normalized * duration;
    return this.snapTimelineUiTime(rawTime);
  }

  private timelineOverviewKeyframes(timelineDocument: SceneTimelineDocument): TimelineKeyframeDocument[] {
    return [
      ...timelineDocument.camera.tracks.flatMap((track) => track.keyframes),
      ...timelineDocument.lights.tracks.flatMap((track) => track.keyframes),
      ...timelineDocument.objects.flatMap((object) => object.tracks.flatMap((track) => track.keyframes))
    ].sort((left, right) => left.time - right.time);
  }

  private syncOverviewSelectedKeys(): void {
    this.overviewKeys.querySelectorAll<HTMLElement>(".timeline-overview-key").forEach((tick) => {
      tick.classList.toggle("selected", this.selectedKeyframeIds.has(tick.dataset.keyframeId ?? ""));
    });
  }

  private startMarkerDrag(event: PointerEvent): void {
    if (event.defaultPrevented || event.button !== 0 || !this.lastTimelineDocument) return;
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>(".timeline-marker");
    if (!button) return;
    const markerId = button.dataset.markerId;
    const originalTime = Number(button.dataset.time);
    if (!markerId || !Number.isFinite(originalTime)) return;

    const stripRect = this.markerStrip.getBoundingClientRect();
    if (stripRect.width <= 0) return;
    this.markerDragState = {
      pointerId: event.pointerId,
      button,
      markerId,
      startClientX: event.clientX,
      originalTime,
      nextTime: originalTime,
      duration: Math.max(this.lastTimelineDocument.duration, 0.001),
      width: stripRect.width,
      moved: false
    };
    button.classList.add("dragging");
    button.setPointerCapture(event.pointerId);
    button.addEventListener("pointermove", this.handleMarkerDragMove);
    button.addEventListener("pointerup", this.handleMarkerDragEnd);
    button.addEventListener("pointercancel", this.handleMarkerDragEnd);
    event.preventDefault();
  }

  private dragMarker(event: PointerEvent): void {
    const state = this.markerDragState;
    if (!state || event.pointerId !== state.pointerId) return;
    const deltaTime = ((event.clientX - state.startClientX) / state.width) * state.duration;
    const nextTime = this.snapTimelineUiTime(clamp(state.originalTime + deltaTime, 0, state.duration), { ignoreTimes: [state.originalTime] });
    state.nextTime = nextTime;
    state.moved ||= Math.abs(event.clientX - state.startClientX) > 2;
    this.previewMarkerTime(state.button, nextTime, state.duration);
  }

  private finishMarkerDrag(event: PointerEvent): void {
    const state = this.markerDragState;
    if (!state || event.pointerId !== state.pointerId) return;
    state.button.classList.remove("dragging");
    state.button.removeEventListener("pointermove", this.handleMarkerDragMove);
    state.button.removeEventListener("pointerup", this.handleMarkerDragEnd);
    state.button.removeEventListener("pointercancel", this.handleMarkerDragEnd);
    if (state.button.hasPointerCapture(event.pointerId)) state.button.releasePointerCapture(event.pointerId);
    this.markerDragState = null;

    if (state.moved && Math.abs(state.nextTime - state.originalTime) > 0.001) {
      this.suppressMarkerClick = true;
      this.callbacks.onMoveMarker(state.markerId, state.nextTime);
    }
  }

  private previewMarkerTime(button: HTMLButtonElement, time: number, duration: number): void {
    const left = Math.min(100, Math.max(0, (time / Math.max(duration, 0.001)) * 100));
    button.dataset.time = formatNumber(time);
    button.style.left = `${left}%`;
    button.title = `${button.textContent ?? "Marker"} at ${formatNumber(time)}s`;
  }

  private renderLayerStrip(timelineDocument: SceneTimelineDocument, entries: SceneEntry[], selectedId: string): void {
    if (this.layerStripCollapsed) {
      this.root.style.setProperty("--timeline-layer-strip-height", "0px");
      this.layerStrip.innerHTML = "";
      return;
    }
    const rowHeight = Math.max(18, this.timelineRowHeight());
    const maxVisibleRows = 5;
    const visibleRows = Math.max(1, Math.min(entries.length, maxVisibleRows));
    const stripHeight = entries.length > 0 ? visibleRows * rowHeight + 6 : 0;
    this.root.style.setProperty("--timeline-layer-strip-height", `${stripHeight}px`);
    this.layerStrip.innerHTML = "";
    if (entries.length === 0) return;

    const duration = Math.max(timelineDocument.duration, 0.001);
    const content = document.createElement("div");
    content.className = "timeline-layer-strip-content";
    content.style.height = `${entries.length * rowHeight + 6}px`;

    entries.forEach((entry, index) => {
      const range = objectLayerRange(timelineDocument, entry.id) ?? { start: 0, end: 0 };
      const start = clamp(range.start, 0, duration);
      const end = clamp(Math.max(range.end, start), 0, duration);
      const left = (start / duration) * 100;
      const width = Math.max(((end - start) / duration) * 100, 0.8);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "timeline-layer-bar";
      button.classList.toggle("active", entry.id === selectedId);
      button.dataset.objectId = entry.id;
      button.dataset.layerStart = formatNumber(start);
      button.dataset.layerEnd = formatNumber(end);
      button.style.top = `${3 + index * rowHeight}px`;
      button.style.left = `${left}%`;
      button.style.width = `${Math.min(width, 100 - left)}%`;
      button.style.borderLeftColor = entry.color.getStyle();
      button.title = `${entry.name}: ${formatNumber(start)}-${formatNumber(end)}s. Drag to move; drag edges to trim; Alt-drag an edge to stretch keys.`;
      button.innerHTML = `
        <span class="timeline-layer-handle timeline-layer-handle-start" data-layer-action="trim-start" aria-hidden="true"></span>
        <span class="timeline-layer-bar-name">${escapeHtml(entry.name)}</span>
        <span class="timeline-layer-bar-time">${formatNumber(start)}-${formatNumber(end)}s</span>
        <span class="timeline-layer-handle timeline-layer-handle-end" data-layer-action="trim-end" aria-hidden="true"></span>
      `;
      content.appendChild(button);
    });
    appendLayerPlayhead(content, timelineDocument);
    this.layerStrip.appendChild(content);
  }

  private startLayerRangeDrag(event: PointerEvent): void {
    if (event.button !== 0 || !this.lastTimelineDocument) return;
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>(".timeline-layer-bar");
    if (!button) return;
    const objectId = button.dataset.objectId;
    const originalStart = Number(button.dataset.layerStart);
    const originalEnd = Number(button.dataset.layerEnd);
    if (!objectId || !Number.isFinite(originalStart) || !Number.isFinite(originalEnd)) return;

    const stripRect = this.layerStrip.getBoundingClientRect();
    if (stripRect.width <= 0) return;
    const handle = (event.target as HTMLElement).closest<HTMLElement>("[data-layer-action]");
    const mode: TimelineLayerDragMode = handle?.dataset.layerAction === "trim-start"
      ? "trimStart"
      : handle?.dataset.layerAction === "trim-end"
        ? "trimEnd"
        : "move";
    this.layerDragState = {
      pointerId: event.pointerId,
      button,
      objectId,
      mode,
      startClientX: event.clientX,
      originalStart,
      originalEnd,
      nextStart: originalStart,
      nextEnd: originalEnd,
      keyframeEditMode: mode === "move" ? "shift" : this.isLayerStretchModifierActive(event) ? "stretch" : "none",
      duration: Math.max(this.lastTimelineDocument.duration, 0.001),
      width: stripRect.width,
      moved: false
    };
    button.classList.add("dragging");
    button.classList.toggle("stretching", mode !== "move" && this.isLayerStretchModifierActive(event));
    button.setPointerCapture(event.pointerId);
    button.addEventListener("pointermove", this.handleLayerDragMove);
    button.addEventListener("pointerup", this.handleLayerDragEnd);
    button.addEventListener("pointercancel", this.handleLayerDragEnd);
    event.preventDefault();
  }

  private dragLayerRange(event: PointerEvent): void {
    const state = this.layerDragState;
    if (!state || event.pointerId !== state.pointerId || !this.lastTimelineDocument) return;
    const deltaTime = ((event.clientX - state.startClientX) / state.width) * state.duration;
    const span = Math.max(state.originalEnd - state.originalStart, this.minimumLayerSpan());
    let nextStart = state.originalStart;
    let nextEnd = state.originalEnd;

    if (state.mode === "trimStart") {
      nextStart = this.snapLayerTime(clamp(state.originalStart + deltaTime, 0, state.originalEnd - this.minimumLayerSpan()), { ignoreTimes: [state.originalStart] });
      nextStart = Math.min(nextStart, state.originalEnd - this.minimumLayerSpan());
    } else if (state.mode === "trimEnd") {
      nextEnd = this.snapLayerTime(clamp(state.originalEnd + deltaTime, state.originalStart + this.minimumLayerSpan(), state.duration), { ignoreTimes: [state.originalEnd] });
      nextEnd = Math.max(nextEnd, state.originalStart + this.minimumLayerSpan());
    } else {
      nextStart = this.snapLayerTime(clamp(state.originalStart + deltaTime, 0, state.duration - span), { ignoreTimes: [state.originalStart, state.originalEnd] });
      nextEnd = nextStart + span;
    }

    state.nextStart = roundTimelineTime(clamp(nextStart, 0, state.duration));
    state.nextEnd = roundTimelineTime(clamp(nextEnd, state.nextStart + this.minimumLayerSpan(), state.duration));
    state.moved ||= Math.abs(event.clientX - state.startClientX) > 2;
    this.previewLayerRange(state.button, state.nextStart, state.nextEnd, state.duration);
  }

  private finishLayerRangeDrag(event: PointerEvent): void {
    const state = this.layerDragState;
    if (!state || event.pointerId !== state.pointerId) return;
    state.button.classList.remove("dragging");
    state.button.classList.remove("stretching");
    state.button.removeEventListener("pointermove", this.handleLayerDragMove);
    state.button.removeEventListener("pointerup", this.handleLayerDragEnd);
    state.button.removeEventListener("pointercancel", this.handleLayerDragEnd);
    if (state.button.hasPointerCapture(event.pointerId)) state.button.releasePointerCapture(event.pointerId);
    this.layerDragState = null;

    const changed = Math.abs(state.nextStart - state.originalStart) > 0.001 || Math.abs(state.nextEnd - state.originalEnd) > 0.001;
    if (state.moved && changed) {
      this.suppressLayerClick = true;
      this.callbacks.onEditLayerRange(state.objectId, state.nextStart, state.nextEnd, state.keyframeEditMode);
    }
  }

  private previewLayerRange(button: HTMLButtonElement, start: number, end: number, duration: number): void {
    const left = (start / duration) * 100;
    const width = Math.max(((end - start) / duration) * 100, 0.8);
    button.dataset.layerStart = formatNumber(start);
    button.dataset.layerEnd = formatNumber(end);
    button.style.left = `${left}%`;
    button.style.width = `${Math.min(width, 100 - left)}%`;
    button.title = `${button.querySelector(".timeline-layer-bar-name")?.textContent ?? "Layer"}: ${formatNumber(start)}-${formatNumber(end)}s. Drag to move; drag edges to trim; Alt-drag an edge to stretch keys.`;
    const timeLabel = button.querySelector<HTMLElement>(".timeline-layer-bar-time");
    if (timeLabel) timeLabel.textContent = `${formatNumber(start)}-${formatNumber(end)}s`;
  }

  private minimumLayerSpan(): number {
    return Math.max(Math.min(this.lastTimelineDocument?.snapStep ?? 1 / 30, 0.25), 0.001);
  }

  private snapLayerTime(time: number, options: TimelineSnapOptions = {}): number {
    return this.snapTimelineUiTime(time, { ...options, includeLayerRanges: true });
  }

  private snapTimelineUiTime(time: number, options: TimelineSnapOptions = {}): number {
    const timelineDocument = this.lastTimelineDocument;
    if (!timelineDocument) return roundTimelineTime(time);
    return snapTimelineEditorTime(timelineDocument, time, options);
  }

  private trackLayerStretchModifier(event: KeyboardEvent): void {
    if (event.key !== "Alt") return;
    this.layerStretchModifierActive = event.type === "keydown";
  }

  private isLayerStretchModifierActive(event: PointerEvent): boolean {
    return event.altKey || this.layerStretchModifierActive;
  }

  private syncMarkerEditor(timelineDocument: SceneTimelineDocument, marker = this.currentMarker(timelineDocument)): void {
    this.activeMarkerId = marker?.id ?? null;
    this.markerLabelInput.disabled = false;
    this.markerLabelInput.value = marker?.label ?? "";
    this.markerLabelInput.placeholder = marker ? "Rename marker" : `Marker ${timelineDocument.markers.length + 1}`;
    this.markerColorInput.disabled = false;
    this.markerColorInput.value = marker?.color ?? markerPaletteColor(timelineDocument.markers.length);
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
    if (this.hasRowSearch()) return kinds;
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

  private filteredRowDescriptors(targetName: string, kinds: TimelineTrackKind[], includeAxes: boolean): TimelineRowDescriptor[] {
    return this.rowDescriptors(kinds, includeAxes).filter((row) => this.matchesRowSearch(targetName, row.kind, row.axis));
  }

  private matchesRowSearch(targetName: string, kind: TimelineTrackKind, axis?: TimelineAxis): boolean {
    return timelineRowMatchesSearch(targetName, kind, axis, this.rowSearchText);
  }

  private hasRowSearch(): boolean {
    return this.rowSearchText.length > 0;
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
    const soloActive = hasSoloTimelineTracks(timelineDocument);
    const objectTimelines = new Map(timelineDocument.objects.map((object) => [object.objectId, object]));
    const objectLabels = entries
      .flatMap((entry) => {
        const objectTimeline = objectTimelines.get(entry.id);
        const visibleKinds = this.visibleTrackKinds(OBJECT_TRACKS, objectTimeline?.tracks ?? [], entry.id, selectedId);
        const visibleRows = this.filteredRowDescriptors(entry.name, visibleKinds, true);
        return visibleRows.map((row) => {
          const track = objectTimeline?.tracks.find((candidate) => candidate.kind === row.kind);
          return this.renderTrackLabel({
            targetId: entry.id,
            targetName: entry.name,
            kind: row.kind,
            axis: row.axis,
            active: entry.id === selectedId && activeKind === row.kind,
            enabled: track?.enabled ?? true,
            locked: track?.locked ?? false,
            solo: track?.solo ?? false,
            muted: Boolean(soloActive && track?.enabled && track.keyframes.length > 0 && !track.solo),
            hasKeyframes: Boolean(track?.keyframes.length),
            hasPlayheadKey: hasPlayheadKey(track, timelineDocument.currentTime),
            valueText: this.objectRowValueText(entry, row.kind, row.axis)
          });
        });
      })
      .join("");
    const cameraKinds = this.visibleTrackKinds(CAMERA_TRACKS, timelineDocument.camera.tracks, CAMERA_TARGET_ID, selectedId);
    const cameraRows = this.filteredRowDescriptors("Camera", cameraKinds, true);
    const cameraLabels = cameraRows.map((row) => {
      const track = timelineDocument.camera.tracks.find((candidate) => candidate.kind === row.kind);
      return this.renderTrackLabel({
        targetId: CAMERA_TARGET_ID,
        targetName: "Camera",
        kind: row.kind,
        axis: row.axis,
        active: isCameraTrack(activeKind) && activeKind === row.kind,
        enabled: track?.enabled ?? true,
        locked: track?.locked ?? false,
        solo: track?.solo ?? false,
        muted: Boolean(soloActive && track?.enabled && track.keyframes.length > 0 && !track.solo),
        hasKeyframes: Boolean(track?.keyframes.length),
        hasPlayheadKey: hasPlayheadKey(track, timelineDocument.currentTime),
        valueText: this.timelineRowValueText(track, row.kind, timelineDocument.currentTime, row.axis),
        extraClass: "camera-track-label"
      });
    }).join("");
    const lightKinds = this.visibleTrackKinds(LIGHT_TRACKS, timelineDocument.lights.tracks, LIGHT_TARGET_ID, selectedId);
    const lightRows = this.filteredRowDescriptors("Lights", lightKinds, true);
    const lightLabels = lightRows.map((row) => {
      const track = timelineDocument.lights.tracks.find((candidate) => candidate.kind === row.kind);
      return this.renderTrackLabel({
        targetId: LIGHT_TARGET_ID,
        targetName: "Lights",
        kind: row.kind,
        axis: row.axis,
        active: isLightTrack(activeKind) && activeKind === row.kind,
        enabled: track?.enabled ?? true,
        locked: track?.locked ?? false,
        solo: track?.solo ?? false,
        muted: Boolean(soloActive && track?.enabled && track.keyframes.length > 0 && !track.solo),
        hasKeyframes: Boolean(track?.keyframes.length),
        hasPlayheadKey: hasPlayheadKey(track, timelineDocument.currentTime),
        valueText: this.timelineRowValueText(track, row.kind, timelineDocument.currentTime, row.axis),
        extraClass: "light-track-label"
      });
    }).join("");
    const emptyMessage = this.hasRowSearch() ? `No rows match "${escapeHtml(this.rowSearchText)}"` : "Select an object to keyframe";
    return `${objectLabels}${cameraLabels}${lightLabels}` || `<div class="timeline-empty">${emptyMessage}</div>`;
  }

  private renderTrackLabel(options: {
    targetId: string;
    targetName: string;
    kind: TimelineTrackKind;
    axis?: TimelineAxis;
    active: boolean;
    enabled: boolean;
    locked: boolean;
    solo: boolean;
    muted: boolean;
    hasKeyframes: boolean;
    hasPlayheadKey: boolean;
    valueText?: string;
    extraClass?: string;
  }): string {
    const label = trackLabel(options.kind, options.axis);
    const detail = options.valueText ? `${label} | ${options.valueText}` : label;
    const keyText = options.locked
      ? "Track locked"
      : options.hasPlayheadKey
        ? "Update key at playhead"
        : "Set key at playhead";
    return `
      <div class="${this.labelClass(options.active, options.enabled, options.locked, options.solo, options.muted, options.hasKeyframes, [options.extraClass ?? "", options.axis ? "axis-track-label" : ""].join(" "))}" role="button" tabindex="0" data-object-id="${options.targetId}" data-track-kind="${options.kind}" ${options.axis ? `data-track-axis="${options.axis}"` : ""} aria-label="${options.targetName} ${label}">
        <span class="track-swatch" style="background:${TRACK_COLORS[options.kind]}"></span>
        <span class="track-label-text">
          <strong>${options.targetName}</strong>
          <small>${detail}</small>
        </span>
        <span class="timeline-row-switches">
          <button class="timeline-row-switch" type="button" data-row-action="toggle" aria-label="${options.enabled ? "Disable" : "Enable"} track: ${options.targetName} ${label}" title="${options.enabled ? "Disable track" : "Enable track"}" ${options.hasKeyframes ? "" : "disabled"}>
            <span data-icon="${options.enabled ? "Eye" : "EyeOff"}"></span>
          </button>
          <button class="timeline-row-switch" type="button" data-row-action="solo" aria-label="${options.solo ? "Unsolo" : "Solo"} track: ${options.targetName} ${label}" title="${options.solo ? "Unsolo track" : "Solo track"}" ${options.hasKeyframes ? "" : "disabled"}>
            <span data-icon="${options.solo ? "CircleDot" : "Circle"}"></span>
          </button>
          <button class="timeline-row-switch" type="button" data-row-action="lock" aria-label="${options.locked ? "Unlock" : "Lock"} track: ${options.targetName} ${label}" title="${options.locked ? "Unlock track" : "Lock track"}" ${options.hasKeyframes ? "" : "disabled"}>
            <span data-icon="${options.locked ? "Lock" : "Unlock"}"></span>
          </button>
        </span>
        <button class="timeline-row-key" type="button" aria-label="${keyText}: ${options.targetName} ${label}" title="${keyText}" ${options.locked ? "disabled" : ""}>
          <span data-icon="${options.locked ? "Lock" : options.hasPlayheadKey ? "Diamond" : "DiamondPlus"}"></span>
        </button>
      </div>
    `;
  }

  private syncRowValueReadouts(timelineDocument: SceneTimelineDocument): void {
    const entryById = new Map(this.lastEntries.map((entry) => [entry.id, entry]));
    this.labels.querySelectorAll<HTMLElement>(".timeline-track-label").forEach((row) => {
      const kind = row.dataset.trackKind as TimelineTrackKind | undefined;
      const targetId = row.dataset.objectId;
      const valueLabel = row.querySelector<HTMLElement>(".track-label-text small");
      if (!kind || !targetId || !valueLabel) return;
      const axis = parseTimelineAxis(row.dataset.trackAxis);
      const label = trackLabel(kind, axis ?? undefined);
      let valueText = "";
      if (targetId === CAMERA_TARGET_ID) {
        valueText = this.timelineRowValueText(
          timelineDocument.camera.tracks.find((track) => track.kind === kind),
          kind,
          timelineDocument.currentTime,
          axis ?? undefined
        );
      } else if (targetId === LIGHT_TARGET_ID) {
        valueText = this.timelineRowValueText(
          timelineDocument.lights.tracks.find((track) => track.kind === kind),
          kind,
          timelineDocument.currentTime,
          axis ?? undefined
        );
      } else {
        const entry = entryById.get(targetId);
        valueText = entry ? this.objectRowValueText(entry, kind, axis ?? undefined) : "";
      }
      valueLabel.textContent = valueText ? `${label} | ${valueText}` : label;
    });
  }

  private objectRowValueText(entry: SceneEntry, kind: TimelineTrackKind, axis?: TimelineAxis): string {
    return formatRowValue(kind, timelineValueForEntry(entry, kind), axis);
  }

  private timelineRowValueText(track: TimelineTrackDocument | undefined, kind: TimelineTrackKind, time: number, axis?: TimelineAxis): string {
    if (!track?.keyframes.length) return "";
    const value = evaluateTimelineTrack(track, time);
    return value ? formatRowValue(kind, value, axis) : "";
  }

  private visibleRowTargets(): TimelineVisibleRowTarget[] {
    const targets = new Map<string, TimelineVisibleRowTarget>();
    this.labels.querySelectorAll<HTMLElement>(".timeline-track-label").forEach((row) => {
      const targetId = row.dataset.objectId;
      const kind = row.dataset.trackKind as TimelineTrackKind | undefined;
      if (!targetId || !kind) return;
      const key = `${targetId}:${kind}`;
      if (!targets.has(key)) targets.set(key, { targetId, kind });
    });
    return [...targets.values()];
  }

  private labelClass(active: boolean, enabled: boolean, locked: boolean, solo: boolean, muted: boolean, hasKeyframes: boolean, extra = ""): string {
    return [
      "timeline-track-label",
      extra,
      active ? "active" : "",
      hasKeyframes ? "has-keyframes" : "",
      hasKeyframes && solo ? "solo-track" : "",
      muted ? "muted-track" : "",
      locked ? "locked-track" : "",
      hasKeyframes && !enabled ? "disabled-track" : ""
    ].filter(Boolean).join(" ");
  }

  private createModel(timelineDocument: SceneTimelineDocument, entries: SceneEntry[], selectedId: string, rowHeight: number): TimelineModel {
    const objectTimelines = new Map(timelineDocument.objects.map((object) => [object.objectId, object]));
    const rows: TimelineUiRow[] = [];
    entries.forEach((entry) => {
      const objectTimeline = objectTimelines.get(entry.id);
      const visibleKinds = this.visibleTrackKinds(OBJECT_TRACKS, objectTimeline?.tracks ?? [], entry.id, selectedId);
      const visibleRows = this.filteredRowDescriptors(entry.name, visibleKinds, true);
      visibleRows.forEach((row, index) => {
        const track = objectTimeline?.tracks.find((candidate) => candidate.kind === row.kind);
        const locked = Boolean(track?.locked);
        rows.push({
          targetId: entry.id,
          trackKind: row.kind,
          axis: row.axis,
          min: 0,
          max: timelineDocument.duration,
          keyframesDraggable: !locked,
          groupsDraggable: !locked,
          style: {
            height: rowHeight,
            marginBottom: index === visibleRows.length - 1 ? 8 : 2,
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
            draggable: !locked
          })) ?? []
        });
      });
    });
    const visibleCameraKinds = this.visibleTrackKinds(CAMERA_TRACKS, timelineDocument.camera.tracks, CAMERA_TARGET_ID, selectedId);
    const visibleCameraRows = this.filteredRowDescriptors("Camera", visibleCameraKinds, true);
    visibleCameraRows.forEach((row, index) => {
      const track = timelineDocument.camera.tracks.find((candidate) => candidate.kind === row.kind);
      const locked = Boolean(track?.locked);
      rows.push({
        targetId: CAMERA_TARGET_ID,
        trackKind: row.kind,
        axis: row.axis,
        min: 0,
        max: timelineDocument.duration,
        keyframesDraggable: !locked,
        groupsDraggable: !locked,
        style: {
          height: rowHeight,
          marginBottom: index === visibleCameraRows.length - 1 ? 0 : 2,
          fillColor: index % 2 === 0 ? "rgba(238,244,255,0.74)" : "rgba(244,239,255,0.74)",
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
          targetId: CAMERA_TARGET_ID,
          trackKind: row.kind,
          axis: row.axis,
          val: keyframe.time,
          style: this.keyframeStyle(row.kind, keyframe.interpolation),
          selected: this.selectedKeyframeIds.has(keyframe.id),
          selectable: true,
          draggable: !locked
        })) ?? []
      });
    });
    const visibleLightKinds = this.visibleTrackKinds(LIGHT_TRACKS, timelineDocument.lights.tracks, LIGHT_TARGET_ID, selectedId);
    const visibleLightRows = this.filteredRowDescriptors("Lights", visibleLightKinds, true);
    visibleLightRows.forEach((row, index) => {
      const track = timelineDocument.lights.tracks.find((candidate) => candidate.kind === row.kind);
      const locked = Boolean(track?.locked);
      rows.push({
        targetId: LIGHT_TARGET_ID,
        trackKind: row.kind,
        axis: row.axis,
        min: 0,
        max: timelineDocument.duration,
        keyframesDraggable: !locked,
        groupsDraggable: !locked,
        style: {
          height: rowHeight,
          marginBottom: index === visibleLightRows.length - 1 ? 0 : 2,
          fillColor: index % 2 === 0 ? "rgba(255,247,229,0.78)" : "rgba(244,249,255,0.78)",
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
          targetId: LIGHT_TARGET_ID,
          trackKind: row.kind,
          axis: row.axis,
          val: keyframe.time,
          style: this.keyframeStyle(row.kind, keyframe.interpolation),
          selected: this.selectedKeyframeIds.has(keyframe.id),
          selectable: true,
          draggable: !locked
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

  private syncLockTrackButton(timelineDocument: SceneTimelineDocument, selectedId: string): void {
    const state = this.selectedTrackState(timelineDocument, selectedId);
    this.lockTrackButton.disabled = !state.hasKeyframes;
    this.lockTrackButton.classList.toggle("danger", state.hasKeyframes && state.locked);
    this.lockTrackButton.innerHTML = `<span data-icon="${state.locked ? "Lock" : "Unlock"}"></span><span>${state.locked ? "Locked" : "Unlocked"}</span>`;
    hydrateIcons(this.lockTrackButton);
  }

  private syncSoloTrackButton(timelineDocument: SceneTimelineDocument, selectedId: string): void {
    const state = this.selectedTrackState(timelineDocument, selectedId);
    this.soloTrackButton.disabled = !state.hasKeyframes;
    this.soloTrackButton.classList.toggle("active", state.hasKeyframes && state.solo);
    this.soloTrackButton.classList.toggle("danger", state.hasKeyframes && state.muted);
    const label = state.solo ? "Solo On" : state.muted ? "Muted" : "Solo Off";
    this.soloTrackButton.innerHTML = `<span data-icon="${state.solo ? "CircleDot" : "Circle"}"></span><span>${label}</span>`;
    hydrateIcons(this.soloTrackButton);
  }

  private syncClearTrackButton(timelineDocument: SceneTimelineDocument, selectedId: string): void {
    const state = this.selectedTrackState(timelineDocument, selectedId);
    this.clearTrackButton.disabled = !state.hasKeyframes || state.locked;
    this.clearTrackButton.title = !state.hasKeyframes
      ? "Add keyframes before clearing the active track"
      : state.locked
        ? "Unlock the active track before clearing it"
        : "Clear all keyframes from the active track";
  }

  private syncAddKeyframeButton(timelineDocument: SceneTimelineDocument, selectedId: string): void {
    const hasPlayheadKey = Boolean(this.playheadKeyframe(timelineDocument, selectedId));
    this.addKeyframeButton.innerHTML = `<span data-icon="${hasPlayheadKey ? "Diamond" : "DiamondPlus"}"></span><span>${hasPlayheadKey ? "Update Key" : "Set Key"}</span>`;
    this.addKeyframeButton.title = hasPlayheadKey
      ? "Update the keyframe at the current playhead time"
      : "Create a keyframe at the current playhead time";
    hydrateIcons(this.addKeyframeButton);
  }

  private syncRowKeyButtons(timelineDocument: SceneTimelineDocument): void {
    this.labels.querySelectorAll<HTMLElement>(".timeline-track-label").forEach((row) => {
      const button = row.querySelector<HTMLButtonElement>(".timeline-row-key");
      const kind = row.dataset.trackKind as TimelineTrackKind | undefined;
      const targetId = row.dataset.objectId;
      if (!button || !kind || !targetId) return;

      const track = this.trackForTarget(timelineDocument, targetId, kind);
      const locked = Boolean(track?.locked);
      const playheadKey = hasPlayheadKey(track, timelineDocument.currentTime);
      const stateKey = `${locked}-${playheadKey}`;
      if (button.dataset.keyState === stateKey) return;

      const keyText = locked ? "Track locked" : playheadKey ? "Update key at playhead" : "Set key at playhead";
      const rowLabel = row.getAttribute("aria-label") ?? trackLabel(kind, parseTimelineAxis(row.dataset.trackAxis) ?? undefined);
      button.dataset.keyState = stateKey;
      button.title = keyText;
      button.setAttribute("aria-label", `${keyText}: ${rowLabel}`);
      button.innerHTML = `<span data-icon="${locked ? "Lock" : playheadKey ? "Diamond" : "DiamondPlus"}"></span>`;
      hydrateIcons(button);
    });
  }

  private trackForTarget(timelineDocument: SceneTimelineDocument, targetId: string, kind: TimelineTrackKind): TimelineTrackDocument | undefined {
    if (targetId === CAMERA_TARGET_ID) return timelineDocument.camera.tracks.find((track) => track.kind === kind);
    if (targetId === LIGHT_TARGET_ID) return timelineDocument.lights.tracks.find((track) => track.kind === kind);
    return timelineDocument.objects
      .find((objectTimeline) => objectTimeline.objectId === targetId)
      ?.tracks.find((track) => track.kind === kind);
  }

  private selectedTrackState(timelineDocument: SceneTimelineDocument, selectedId: string): { enabled: boolean; locked: boolean; solo: boolean; muted: boolean; hasKeyframes: boolean } {
    const selectedTrack = this.selectedTrackKind();
    const track = isCameraTrack(selectedTrack)
      ? timelineDocument.camera.tracks.find((candidate) => candidate.kind === selectedTrack)
      : isLightTrack(selectedTrack)
        ? timelineDocument.lights.tracks.find((candidate) => candidate.kind === selectedTrack)
        : timelineDocument.objects
          .find((object) => object.objectId === selectedId)
          ?.tracks.find((candidate) => candidate.kind === selectedTrack);
    const soloActive = hasSoloTimelineTracks(timelineDocument);
    const hasKeyframes = Boolean(track && track.keyframes.length > 0);
    return {
      enabled: track?.enabled ?? true,
      locked: track?.locked ?? false,
      solo: track?.solo ?? false,
      muted: Boolean(soloActive && track?.enabled && hasKeyframes && !track.solo),
      hasKeyframes
    };
  }

  private syncSelectionWidgets(timelineDocument: SceneTimelineDocument, selectedId: string): void {
    const sources = this.detailSources(timelineDocument, selectedId);
    this.selectionLabel.textContent = this.selectedKeyframeIds.size
      ? `${this.selectedKeyframeIds.size} keyframe${this.selectedKeyframeIds.size === 1 ? "" : "s"} selected`
      : sources.length
        ? "Playhead keyframe active"
      : "No keyframe selected";
    this.syncKeyframeTargetButtons(sources.length);
    this.syncInterpolationAvailability(sources.length);
    this.syncKeyframeEditor(timelineDocument, selectedId, sources);
    this.syncInterpolationControls(this.currentInterpolation(timelineDocument, selectedId));
    this.syncOverviewSelectedKeys();
  }

  private syncKeyframeTargetButtons(targetCount: number): void {
    const disabled = targetCount === 0;
    this.keyframeTargetButtons.forEach((button) => {
      button.dataset.enabledTitle ??= button.title;
      button.disabled = disabled;
      button.title = disabled
        ? "Select keyframes or park the playhead on an active-track keyframe"
        : button.dataset.enabledTitle ?? "";
    });
  }

  private syncInterpolationAvailability(targetCount: number): void {
    const disabled = targetCount === 0;
    this.interpolationSelect.disabled = disabled;
    this.interpolationSelect.title = disabled
      ? "Select keyframes or park the playhead on an active-track keyframe"
      : "Keyframe interpolation";
    this.interpolationButtons.forEach((button) => {
      button.dataset.enabledTitle ??= button.title;
      button.disabled = disabled;
      button.title = disabled
        ? "Select keyframes or park the playhead on an active-track keyframe"
        : button.dataset.enabledTitle ?? "";
    });
  }

  private syncTimecode(timelineDocument: SceneTimelineDocument): void {
    const visibleKeys = this.visiblePlayheadKeyframeCount(timelineDocument);
    const visibleText = `${visibleKeys} visible ${visibleKeys === 1 ? "key" : "keys"}`;
    this.timecodeLabel.textContent = `${formatTimecode(timelineDocument.currentTime, timelineDocument.fps)} | ${visibleText}`;
    this.timecodeLabel.title = `${visibleText} at the current playhead time under the active row filter and search.`;
    this.syncVisibleTimeActionButtons(visibleKeys);
  }

  private syncVisibleTimeActionButtons(visibleKeys: number): void {
    const disabled = visibleKeys === 0;
    [this.copyTimeButton, this.cutTimeButton, this.duplicateTimeButton, this.deleteTimeButton].forEach((button) => {
      button.disabled = disabled;
    });
  }

  private visiblePlayheadKeyframeCount(timelineDocument: SceneTimelineDocument): number {
    const tolerance = Math.max(0.001, timelineDocument.snapEnabled ? timelineDocument.snapStep * 0.5 : 0.001);
    let count = 0;
    this.visibleRowTargets().forEach((target) => {
      const track = this.trackForTarget(timelineDocument, target.targetId, target.kind);
      track?.keyframes.forEach((keyframe) => {
        if (Math.abs(keyframe.time - timelineDocument.currentTime) <= tolerance) count += 1;
      });
    });
    return count;
  }

  private pruneSelectedKeyframes(timelineDocument: SceneTimelineDocument): void {
    if (this.selectedKeyframeIds.size === 0) return;
    const validIds = new Set<string>();
    timelineDocument.camera.tracks.forEach((track) => track.keyframes.forEach((keyframe) => validIds.add(keyframe.id)));
    timelineDocument.lights.tracks.forEach((track) => track.keyframes.forEach((keyframe) => validIds.add(keyframe.id)));
    timelineDocument.objects.forEach((objectTimeline) => {
      objectTimeline.tracks.forEach((track) => track.keyframes.forEach((keyframe) => validIds.add(keyframe.id)));
    });
    this.selectedKeyframeIds.forEach((id) => {
      if (!validIds.has(id)) this.selectedKeyframeIds.delete(id);
    });
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
    if (interpolation === "easeIn" || interpolation === "easeOut") {
      return {
        shape: TimelineKeyframeShape.Rhomb,
        width: interpolation === "easeIn" ? 13 : 15,
        height: interpolation === "easeIn" ? 15 : 13,
        fillColor: baseColor,
        selectedFillColor: "#ffffff",
        strokeColor: interpolation === "easeIn" ? "#111827" : "#f8fafc",
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
    const zoom = Math.max(0.05, Math.min(8, (duration * 80) / Math.max(clientWidth - 32, 1)));
    this.timeline.setZoom(zoom);
    this.timeline.scrollLeft = 0;
    this.syncZoomState();
    this.timeline.redraw();
  }

  private syncZoomState(): void {
    this.root.dataset.zoomLevel = formatNumber(1 / Math.max(this.timeline.getZoom(), 0.001));
  }

  private syncDopeSheetToolButtons(): void {
    const selectionActive = this.dopeSheetTool === "selection";
    this.selectionToolButton.classList.toggle("active", selectionActive);
    this.panToolButton.classList.toggle("active", !selectionActive);
    this.selectionToolButton.setAttribute("aria-pressed", String(selectionActive));
    this.panToolButton.setAttribute("aria-pressed", String(!selectionActive));
    this.root.dataset.timelineTool = this.dopeSheetTool;
  }

  private syncFollowPlayheadButton(): void {
    this.followPlayheadButton.classList.toggle("active", this.followPlayhead);
    this.followPlayheadButton.setAttribute("aria-pressed", String(this.followPlayhead));
    this.followPlayheadButton.title = this.followPlayhead ? "Following playhead" : "Follow playhead";
  }

  private scrollActiveRowIntoView(): void {
    window.requestAnimationFrame(() => {
      this.labels.querySelector<HTMLElement>(".timeline-track-label.active")?.scrollIntoView({ block: "nearest" });
    });
  }

  private ensurePlayheadVisible(time: number, force = false): void {
    if (!this.followPlayhead && !force) return;
    if (this.root.classList.contains("collapsed")) return;
    const scroller = this.timelineScroller ?? this.canvasHost.querySelector<HTMLElement>(".scroll-container");
    if (!scroller) return;

    const playheadX = this.timeline.valToPx(time);
    const viewportStart = scroller.scrollLeft;
    const viewportEnd = viewportStart + scroller.clientWidth;
    const padding = Math.min(Math.max(scroller.clientWidth * 0.2, 48), 160);
    if (playheadX < viewportStart + padding) {
      this.timeline.scrollLeft = Math.max(0, playheadX - padding);
    } else if (playheadX > viewportEnd - padding) {
      this.timeline.scrollLeft = Math.max(0, playheadX - scroller.clientWidth + padding);
    }
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
    if (mode === "preserve") {
      this.selectedKeyframeIds = new Set(this.selectedKeyframeIds);
    } else if (mode === "toggle") {
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

  private selectGraphKeyframes(keyframes: TimelineGraphKeySelection[], mode: TimelineGraphSelectionMode): void {
    if (keyframes.length === 0 && mode === "add") return;
    const next = mode === "add" ? new Set(this.selectedKeyframeIds) : new Set<string>();
    keyframes.forEach((keyframe) => next.add(keyframe.keyframeId));
    this.selectedKeyframeIds = next;
    this.selectedAxis = commonGraphSelectionAxis(keyframes);
    if (!this.lastTimelineDocument) return;
    this.syncSelectionWidgets(this.lastTimelineDocument, this.lastSelectedId);
    this.renderGraph(this.lastTimelineDocument, this.lastSelectedId);
    this.refreshCanvas();
  }

  private rowDescriptors(kinds: TimelineTrackKind[], expandAxes: boolean): TimelineRowDescriptor[] {
    return kinds.flatMap((kind) =>
      expandAxes && CHANNEL_EXPANDED_TRACKS.has(kind)
        ? TIMELINE_AXES.slice(0, trackAxisConfig(kind).enabledAxes).map((axis) => ({ kind, axis }))
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
    this.interpolationButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.interpolation === value);
    });
    this.easePath.setAttribute("d", interpolationPath(value));
    this.easeLabel.textContent = interpolationLabel(value);
  }
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

function loadTimelineRowSearch(): string {
  try {
    return normalizeRowSearch(window.localStorage.getItem(ROW_SEARCH_STORAGE_KEY) ?? "");
  } catch {
    return "";
  }
}

function storeTimelineRowSearch(value: string): void {
  try {
    if (value) window.localStorage.setItem(ROW_SEARCH_STORAGE_KEY, value);
    else window.localStorage.removeItem(ROW_SEARCH_STORAGE_KEY);
  } catch {
    // Row search is an editor preference; blocked storage should not affect timeline editing.
  }
}

function normalizeRowSearch(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, 64);
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

function loadTimelineFollowPlayhead(): boolean {
  try {
    return window.localStorage.getItem(FOLLOW_PLAYHEAD_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function storeTimelineFollowPlayhead(enabled: boolean): void {
  try {
    if (enabled) window.localStorage.setItem(FOLLOW_PLAYHEAD_STORAGE_KEY, "true");
    else window.localStorage.removeItem(FOLLOW_PLAYHEAD_STORAGE_KEY);
  } catch {
    // Follow-playhead is an editor preference; blocked storage should not affect timeline editing.
  }
}

function loadLayerStripCollapsed(): boolean {
  try {
    return window.localStorage.getItem(LAYER_STRIP_COLLAPSED_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function storeLayerStripCollapsed(collapsed: boolean): void {
  try {
    if (collapsed) window.localStorage.setItem(LAYER_STRIP_COLLAPSED_STORAGE_KEY, "true");
    else window.localStorage.removeItem(LAYER_STRIP_COLLAPSED_STORAGE_KEY);
  } catch {
    // Layer-strip visibility is an editor preference; blocked storage should not affect timeline editing.
  }
}

function parseTimelineRowFilter(value: string | null): TimelineRowFilter {
  return value === "keyed" || value === "all" || value === "focus" ? value : "focus";
}

function rowFilterLabel(filter: TimelineRowFilter): string {
  if (filter === "keyed") return "Keyed Rows";
  if (filter === "all") return "All Rows";
  return "Focus Rows";
}

function parseTimelineAxis(value: string | undefined): TimelineAxis | null {
  return value === "x" || value === "y" || value === "z" ? value : null;
}

function isTimelineInterpolation(value: string): value is TimelineInterpolation {
  return value === "linear" || value === "easeIn" || value === "easeOut" || value === "smooth" || value === "hold";
}

function interpolationPath(interpolation: TimelineInterpolation): string {
  if (interpolation === "hold") return "M4 28 H40 V6 H68";
  if (interpolation === "easeIn") return "M4 28 C30 28 46 18 68 6";
  if (interpolation === "easeOut") return "M4 28 C26 16 42 6 68 6";
  if (interpolation === "smooth") return "M4 28 C20 28 22 6 36 17 C50 28 52 6 68 6";
  return "M4 28 L68 6";
}

function interpolationLabel(interpolation: TimelineInterpolation): string {
  if (interpolation === "hold") return "Hold";
  if (interpolation === "easeIn") return "Ease In";
  if (interpolation === "easeOut") return "Ease Out";
  if (interpolation === "smooth") return "Easy Ease";
  return "Linear";
}

function commonSelectedAxis(keyframes: TimelineUiKeyframe[]): TimelineAxis | null {
  const first = keyframes[0]?.axis;
  if (!first) return null;
  return keyframes.every((keyframe) => keyframe.axis === first) ? first : null;
}

function commonGraphSelectionAxis(keyframes: TimelineGraphKeySelection[]): TimelineAxis | null {
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

function hasPlayheadKey(track: TimelineTrackDocument | undefined, currentTime: number): boolean {
  return Boolean(track?.keyframes.some((keyframe) => Math.abs(keyframe.time - currentTime) < 0.001));
}

function roundTimelineTime(time: number): number {
  return Math.round(time * 1000) / 1000;
}

function formatRowValue(kind: TimelineTrackKind, value: [number, number, number], axis?: TimelineAxis): string {
  if (axis) return formatNumber(value[AXIS_INDEX[axis]]);
  if (kind === "objectColor" || kind.endsWith("Color")) return formatColorValue(value);
  if (kind === "objectTextureSource") return textureSourceLabelFromValue(value[0]);
  if (kind === "objectVisibility") return value[0] >= 0.5 ? "On" : "Off";
  if (kind === "objectTextureRotation") return `${formatNumber(radToDeg(value[0]))} deg`;
  const axisCount = trackAxisConfig(kind).enabledAxes;
  return value.slice(0, axisCount).map((channel) => formatNumber(channel)).join(", ");
}

function formatColorValue(value: [number, number, number]): string {
  return `#${value.map((channel) => componentToHex(channel)).join("")}`;
}

function componentToHex(value: number): string {
  return Math.round(clamp(value, 0, 1) * 255).toString(16).padStart(2, "0");
}

function radToDeg(value: number): number {
  return value * 180 / Math.PI;
}

function markerPaletteColor(index: number): string {
  const colors = ["#f4ad2f", "#df6b80", "#4f8df7", "#20bfa9", "#7c70f4"];
  return colors[index % colors.length];
}

function cssNumber(element: HTMLElement, property: string, fallback: number): number {
  const value = Number.parseFloat(getComputedStyle(element).getPropertyValue(property));
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function toggleDatasetFlag(element: HTMLElement, key: string, enabled: boolean): void {
  if (enabled) element.dataset[key] = "true";
  else delete element.dataset[key];
}

function commonValue(values: number[]): string {
  if (values.length === 0) return "";
  const first = values[0];
  return values.every((value) => Math.abs(value - first) < 0.0001) ? formatNumber(first) : "";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
