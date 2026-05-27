import {
  Timeline,
  type TimelineKeyframe,
  type TimelineModel,
  type TimelineRow
} from "animation-timeline-js";
import type { SceneEntry, SceneTimelineDocument, TimelineTrackKind } from "../editor/types";
import { capitalize, formatNumber, hydrateIcons, query } from "../utils/dom";

type TimelineSettingsPatch = Partial<Pick<SceneTimelineDocument, "duration" | "fps" | "loop" | "snapEnabled" | "snapStep">>;

export interface KeyframeTimelineCallbacks {
  onTimeChanged(time: number): void;
  onAddKeyframe(kind: TimelineTrackKind): void;
  onDeleteKeyframes(keyframeIds: string[]): void;
  onDragStarted(): void;
  onKeyframeMoved(keyframeId: string, time: number): void;
  onDragFinished(): void;
  onSettingsChanged(patch: TimelineSettingsPatch): void;
  onTogglePlayback(): void;
}

type TimelineUiKeyframe = TimelineKeyframe & {
  id: string;
  objectId: string;
  trackKind: TimelineTrackKind;
};

type TimelineUiRow = TimelineRow & {
  objectId: string;
  trackKind: TimelineTrackKind;
};

const TRACKS: TimelineTrackKind[] = ["position", "rotation", "scale"];

const TRACK_COLORS: Record<TimelineTrackKind, string> = {
  position: "#20bfa9",
  rotation: "#f4ad2f",
  scale: "#7c70f4"
};

export class KeyframeTimelinePanel {
  private readonly timeline: Timeline;
  private readonly root = query<HTMLElement>("#keyframe-dock");
  private readonly labels = query<HTMLDivElement>("#timeline-track-labels");
  private readonly trackSelect = query<HTMLSelectElement>("#timeline-track-kind");
  private readonly playButton = query<HTMLButtonElement>("#timeline-play-toggle");
  private readonly timeInput = query<HTMLInputElement>("#timeline-current-time");
  private readonly durationInput = query<HTMLInputElement>("#timeline-duration");
  private readonly fpsInput = query<HTMLInputElement>("#timeline-fps");
  private readonly snapInput = query<HTMLInputElement>("#timeline-snap");
  private readonly loopInput = query<HTMLInputElement>("#timeline-loop");
  private readonly snapStepInput = query<HTMLInputElement>("#timeline-snap-step");
  private readonly selectionLabel = query<HTMLDivElement>("#timeline-selection");
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
    this.durationInput.value = formatNumber(timelineDocument.duration);
    this.fpsInput.value = String(timelineDocument.fps);
    this.loopInput.checked = timelineDocument.loop;
    this.snapInput.checked = timelineDocument.snapEnabled;
    this.snapStepInput.value = formatNumber(timelineDocument.snapStep);

    const visibleEntries = this.visibleEntries(timelineDocument, entries, selectedId);
    this.labels.innerHTML = this.renderLabels(visibleEntries);
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

  setPlaybackTime(timelineDocument: SceneTimelineDocument, playing: boolean): void {
    this.updating = true;
    this.root.classList.toggle("playing", playing);
    this.playButton.innerHTML = `<span data-icon="${playing ? "Pause" : "Play"}"></span><span>${playing ? "Pause" : "Play"}</span>`;
    hydrateIcons(this.playButton);
    this.timeInput.value = formatNumber(timelineDocument.currentTime);
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
    query<HTMLButtonElement>("#timeline-start").addEventListener("click", () => this.callbacks.onTimeChanged(0));
    this.playButton.addEventListener("click", () => this.callbacks.onTogglePlayback());
    this.timeInput.addEventListener("change", () => this.callbacks.onTimeChanged(Number(this.timeInput.value)));
    this.durationInput.addEventListener("change", () => this.callbacks.onSettingsChanged({ duration: Number(this.durationInput.value) }));
    this.fpsInput.addEventListener("change", () => this.callbacks.onSettingsChanged({ fps: Number(this.fpsInput.value) }));
    this.snapStepInput.addEventListener("change", () => this.callbacks.onSettingsChanged({ snapStep: Number(this.snapStepInput.value) }));
    this.loopInput.addEventListener("change", () => this.callbacks.onSettingsChanged({ loop: this.loopInput.checked }));
    this.snapInput.addEventListener("change", () => this.callbacks.onSettingsChanged({ snapEnabled: this.snapInput.checked }));

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

  private renderLabels(entries: SceneEntry[]): string {
    if (entries.length === 0) return `<div class="timeline-empty">Select an object to keyframe</div>`;
    return entries
      .flatMap((entry) => TRACKS.map((kind) => `
        <button class="timeline-track-label" type="button" data-object-id="${entry.id}" data-track-kind="${kind}">
          <span class="track-swatch" style="background:${TRACK_COLORS[kind]}"></span>
          <span>
            <strong>${entry.name}</strong>
            <small>${capitalize(kind)}</small>
          </span>
        </button>
      `))
      .join("");
  }

  private createModel(timelineDocument: SceneTimelineDocument, entries: SceneEntry[]): TimelineModel {
    const objectTimelines = new Map(timelineDocument.objects.map((object) => [object.objectId, object]));
    const rows: TimelineUiRow[] = [];
    entries.forEach((entry) => {
      const objectTimeline = objectTimelines.get(entry.id);
      TRACKS.forEach((kind, index) => {
        const track = objectTimeline?.tracks.find((candidate) => candidate.kind === kind);
        rows.push({
          objectId: entry.id,
          trackKind: kind,
          min: 0,
          max: timelineDocument.duration,
          keyframesDraggable: true,
          groupsDraggable: true,
          style: {
            height: 30,
            marginBottom: index === TRACKS.length - 1 ? 8 : 2,
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
            objectId: entry.id,
            trackKind: kind,
            val: keyframe.time,
            selected: this.selectedKeyframeIds.has(keyframe.id),
            selectable: true,
            draggable: true
          })) ?? []
        });
      });
    });
    return { rows };
  }
}
