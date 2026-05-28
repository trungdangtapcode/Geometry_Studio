import {
  Timeline,
  type TimelineKeyframe,
  TimelineKeyframeShape,
  type TimelineModel,
  type TimelineRow
} from "animation-timeline-js";
import type { SceneEntry, SceneTimelineDocument, TimelineInterpolation, TimelineTrackKind } from "../editor/types";
import { formatNumber, hydrateIcons, query } from "../utils/dom";

type TimelineSettingsPatch = Partial<Pick<SceneTimelineDocument, "duration" | "workStart" | "workEnd" | "fps" | "loop" | "snapEnabled" | "snapStep" | "autoKey">>;

export interface KeyframeTimelineCallbacks {
  onTimeChanged(time: number): void;
  onAddKeyframe(kind: TimelineTrackKind): void;
  onDeleteKeyframes(keyframeIds: string[]): void;
  onCopyKeyframes(keyframeIds: string[]): void;
  onPasteKeyframes(): void;
  onDuplicateKeyframes(keyframeIds: string[]): void;
  onNudgeKeyframes(direction: -1 | 1, keyframeIds: string[]): void;
  onClearTrack(kind: TimelineTrackKind): void;
  onToggleTrack(kind: TimelineTrackKind): void;
  onTrackKindChanged(): void;
  onTrackLabelSelected(targetId: string, kind: TimelineTrackKind): void;
  onStepKeyframe(direction: -1 | 1): void;
  onStepFrame(direction: -1 | 1): void;
  onSetInterpolation(keyframeIds: string[], interpolation: TimelineInterpolation): void;
  onDragStarted(): void;
  onKeyframeMoved(keyframeId: string, time: number): void;
  onDragFinished(): void;
  onSettingsChanged(patch: TimelineSettingsPatch): void;
  onTogglePlayback(): void;
}

type TimelineUiKeyframe = TimelineKeyframe & {
  id: string;
  targetId: string;
  trackKind: TimelineTrackKind;
};

type TimelineUiRow = TimelineRow & {
  targetId: string;
  trackKind: TimelineTrackKind;
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
  private readonly labels = query<HTMLDivElement>("#timeline-track-labels");
  private readonly trackSelect = query<HTMLSelectElement>("#timeline-track-kind");
  private readonly playButton = query<HTMLButtonElement>("#timeline-play-toggle");
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
  private readonly selectionLabel = query<HTMLSpanElement>("#timeline-selection");
  private readonly timecodeLabel = query<HTMLSpanElement>("#timeline-timecode");
  private selectedKeyframeIds = new Set<string>();
  private updating = false;

  constructor(private readonly callbacks: KeyframeTimelineCallbacks) {
    this.timeline = new Timeline({
      id: query<HTMLDivElement>("#timeline-canvas"),
      min: 0,
      max: 8,
      stepPx: 80,
      stepVal: 1,
      stepSmallPx: 8,
      snapEnabled: true,
      snapStep: 1 / 30,
      leftMargin: 6,
      headerHeight: 28,
      fillColor: "rgba(255,255,255,0.78)",
      headerFillColor: "rgba(244,247,249,0.92)",
      tickColor: "rgba(26,35,42,0.22)",
      labelsColor: "#687078",
      selectionColor: "rgba(32,191,169,0.18)",
      rowsStyle: {
        height: 30,
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
    this.interpolationSelect.value = this.currentInterpolation(timelineDocument, selectedId);
    this.syncToggleTrackButton(timelineDocument, selectedId);

    const visibleEntries = this.visibleEntries(timelineDocument, entries, selectedId);
    this.labels.innerHTML = this.renderLabels(timelineDocument, visibleEntries, selectedId);
    this.timeline.setOptions({
      max: timelineDocument.duration,
      snapEnabled: timelineDocument.snapEnabled,
      snapStep: timelineDocument.snapStep
    });
    this.timeline.setModel(this.createModel(timelineDocument, visibleEntries));
    this.timeline.setTime(timelineDocument.currentTime);
    this.timeline.rescale();
    this.selectionLabel.textContent = this.selectedKeyframeIds.size
      ? `${this.selectedKeyframeIds.size} keyframe${this.selectedKeyframeIds.size === 1 ? "" : "s"} selected`
      : "No keyframe selected";
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
    this.updating = false;
  }

  private bindEvents(): void {
    query<HTMLButtonElement>("#timeline-collapse").addEventListener("click", () => {
      this.root.classList.toggle("collapsed");
    });
    query<HTMLButtonElement>("#timeline-add-keyframe").addEventListener("click", () => {
      this.callbacks.onAddKeyframe(this.selectedTrackKind());
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
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>(".timeline-track-label");
      if (!button) return;
      const kind = button.dataset.trackKind as TimelineTrackKind | undefined;
      const targetId = button.dataset.objectId;
      if (!kind || !targetId) return;
      this.trackSelect.value = kind;
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
      if (!this.updating) this.callbacks.onTrackKindChanged();
    });
    this.interpolationSelect.addEventListener("change", () => {
      this.callbacks.onSetInterpolation([...this.selectedKeyframeIds], this.interpolationSelect.value as TimelineInterpolation);
    });

    this.timeline.onTimeChanged((event) => {
      if (this.updating) return;
      this.callbacks.onTimeChanged(event.val);
    });
    this.timeline.onSelected((event) => {
      this.selectedKeyframeIds = new Set(event.selected.map((keyframe) => (keyframe as TimelineUiKeyframe).id).filter(Boolean));
      this.selectionLabel.textContent = this.selectedKeyframeIds.size
        ? `${this.selectedKeyframeIds.size} keyframe${this.selectedKeyframeIds.size === 1 ? "" : "s"} selected`
        : "No keyframe selected";
    });
    this.timeline.onDragStarted(() => this.callbacks.onDragStarted());
    this.timeline.onKeyframeChanged((event) => {
      const keyframe = event.target.keyframe as TimelineUiKeyframe | undefined;
      if (!keyframe?.id) return;
      this.callbacks.onKeyframeMoved(keyframe.id, event.val);
    });
    this.timeline.onDragFinished(() => this.callbacks.onDragFinished());
  }

  private visibleEntries(timelineDocument: SceneTimelineDocument, entries: Iterable<SceneEntry>, selectedId: string): SceneEntry[] {
    const entryList = Array.from(entries);
    const keyedIds = new Set(timelineDocument.objects.map((object) => object.objectId));
    const selected = entryList.find((entry) => entry.id === selectedId);
    const keyed = entryList.filter((entry) => entry.id !== selectedId && keyedIds.has(entry.id));
    return selected ? [selected, ...keyed] : keyed;
  }

  private renderLabels(timelineDocument: SceneTimelineDocument, entries: SceneEntry[], selectedId: string): string {
    const activeKind = this.selectedTrackKind();
    const objectTimelines = new Map(timelineDocument.objects.map((object) => [object.objectId, object]));
    const objectLabels = entries
      .flatMap((entry) => OBJECT_TRACKS.map((kind) => {
        const track = objectTimelines.get(entry.id)?.tracks.find((candidate) => candidate.kind === kind);
        return `
        <button class="${this.labelClass(entry.id === selectedId && activeKind === kind, track?.enabled ?? true, Boolean(track?.keyframes.length))}" type="button" data-object-id="${entry.id}" data-track-kind="${kind}">
          <span class="track-swatch" style="background:${TRACK_COLORS[kind]}"></span>
          <span>
            <strong>${entry.name}</strong>
            <small>${TRACK_LABELS[kind]}</small>
          </span>
        </button>
      `;
      }))
      .join("");
    const cameraLabels = CAMERA_TRACKS.map((kind) => {
      const track = timelineDocument.camera.tracks.find((candidate) => candidate.kind === kind);
      return `
      <button class="${this.labelClass(isCameraTrack(activeKind) && activeKind === kind, track?.enabled ?? true, Boolean(track?.keyframes.length), "camera-track-label")}" type="button" data-object-id="${CAMERA_TARGET_ID}" data-track-kind="${kind}">
        <span class="track-swatch" style="background:${TRACK_COLORS[kind]}"></span>
        <span>
          <strong>Camera</strong>
          <small>${TRACK_LABELS[kind]}</small>
        </span>
      </button>
    `;
    }).join("");
    const lightLabels = LIGHT_TRACKS.map((kind) => {
      const track = timelineDocument.lights.tracks.find((candidate) => candidate.kind === kind);
      return `
      <button class="${this.labelClass(isLightTrack(activeKind) && activeKind === kind, track?.enabled ?? true, Boolean(track?.keyframes.length), "light-track-label")}" type="button" data-object-id="${LIGHT_TARGET_ID}" data-track-kind="${kind}">
        <span class="track-swatch" style="background:${TRACK_COLORS[kind]}"></span>
        <span>
          <strong>Lights</strong>
          <small>${TRACK_LABELS[kind]}</small>
        </span>
      </button>
    `;
    }).join("");
    return `${objectLabels || `<div class="timeline-empty">Select an object to keyframe</div>`}${cameraLabels}${lightLabels}`;
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

  private createModel(timelineDocument: SceneTimelineDocument, entries: SceneEntry[]): TimelineModel {
    const objectTimelines = new Map(timelineDocument.objects.map((object) => [object.objectId, object]));
    const rows: TimelineUiRow[] = [];
    entries.forEach((entry) => {
      const objectTimeline = objectTimelines.get(entry.id);
      OBJECT_TRACKS.forEach((kind, index) => {
        const track = objectTimeline?.tracks.find((candidate) => candidate.kind === kind);
        rows.push({
          targetId: entry.id,
          trackKind: kind,
          min: 0,
          max: timelineDocument.duration,
          keyframesDraggable: true,
          groupsDraggable: true,
          style: {
            height: 30,
            marginBottom: index === OBJECT_TRACKS.length - 1 ? 8 : 2,
            fillColor: index % 2 === 0 ? "rgba(255,255,255,0.66)" : "rgba(235,241,244,0.64)",
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
            targetId: entry.id,
            trackKind: kind,
            val: keyframe.time,
            style: this.keyframeStyle(kind, keyframe.interpolation),
            selected: this.selectedKeyframeIds.has(keyframe.id),
            selectable: true,
            draggable: true
          })) ?? []
        });
      });
    });
    CAMERA_TRACKS.forEach((kind, index) => {
      const track = timelineDocument.camera.tracks.find((candidate) => candidate.kind === kind);
      rows.push({
        targetId: CAMERA_TARGET_ID,
        trackKind: kind,
        min: 0,
        max: timelineDocument.duration,
        keyframesDraggable: true,
        groupsDraggable: true,
        style: {
          height: 30,
          marginBottom: index === CAMERA_TRACKS.length - 1 ? 0 : 2,
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
    LIGHT_TRACKS.forEach((kind, index) => {
      const track = timelineDocument.lights.tracks.find((candidate) => candidate.kind === kind);
      rows.push({
        targetId: LIGHT_TARGET_ID,
        trackKind: kind,
        min: 0,
        max: timelineDocument.duration,
        keyframesDraggable: true,
        groupsDraggable: true,
        style: {
          height: 30,
          marginBottom: index === LIGHT_TRACKS.length - 1 ? 0 : 2,
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

  private playheadKeyframe(timelineDocument: SceneTimelineDocument, selectedId: string) {
    const selectedTrack = this.selectedTrackKind();
    const track = isCameraTrack(selectedTrack)
      ? timelineDocument.camera.tracks.find((candidate) => candidate.kind === selectedTrack)
      : isLightTrack(selectedTrack)
        ? timelineDocument.lights.tracks.find((candidate) => candidate.kind === selectedTrack)
      : timelineDocument.objects
        .find((object) => object.objectId === selectedId)
        ?.tracks.find((candidate) => candidate.kind === selectedTrack);
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
}

function isCameraTrack(kind: TimelineTrackKind): kind is "cameraPosition" | "cameraTarget" | "cameraLens" {
  return kind === "cameraPosition" || kind === "cameraTarget" || kind === "cameraLens";
}

function isLightTrack(kind: TimelineTrackKind): boolean {
  return LIGHT_TRACKS.includes(kind);
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
