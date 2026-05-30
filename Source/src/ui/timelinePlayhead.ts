import type { SceneTimelineDocument } from "../editor/types";
import { clamp, formatNumber } from "../utils/dom";
import { snapTimelineEditorTime } from "./timelineSnapping";

type TimelinePlayheadDragState = {
  pointerId: number;
};

export interface TimelinePlayheadControllerOptions {
  markerStrip: HTMLDivElement;
  getTimelineDocument(): SceneTimelineDocument | null;
  onTimeChanged(time: number): void;
}

export class TimelinePlayheadController {
  private dragState: TimelinePlayheadDragState | null = null;
  private readonly handleDragMove = (event: PointerEvent) => this.drag(event);
  private readonly handleDragEnd = (event: PointerEvent) => this.finishDrag(event);

  constructor(private readonly options: TimelinePlayheadControllerOptions) {}

  render(timelineDocument: SceneTimelineDocument): void {
    const handle = document.createElement("button");
    handle.type = "button";
    handle.className = "timeline-ruler-playhead";
    handle.dataset.time = formatNumber(timelineDocument.currentTime);
    this.previewTime(handle, timelineDocument.currentTime, timelineDocument.duration);
    handle.innerHTML = `
      <span class="timeline-ruler-playhead-head" aria-hidden="true"></span>
      <span class="timeline-ruler-playhead-line" aria-hidden="true"></span>
    `;
    this.options.markerStrip.appendChild(handle);
  }

  startDrag(event: PointerEvent): void {
    if (event.button !== 0) return;
    const handle = (event.target as HTMLElement).closest<HTMLButtonElement>(".timeline-ruler-playhead");
    if (!handle || !this.options.getTimelineDocument()) return;

    this.dragState = {
      pointerId: event.pointerId
    };
    handle.classList.add("dragging");
    this.options.markerStrip.classList.add("scrubbing");
    document.addEventListener("pointermove", this.handleDragMove);
    document.addEventListener("pointerup", this.handleDragEnd);
    document.addEventListener("pointercancel", this.handleDragEnd);
    this.commitPointerTime(event);
    event.preventDefault();
  }

  private drag(event: PointerEvent): void {
    const state = this.dragState;
    if (!state || event.pointerId !== state.pointerId) return;
    this.commitPointerTime(event);
  }

  private finishDrag(event: PointerEvent): void {
    const state = this.dragState;
    if (!state || event.pointerId !== state.pointerId) return;
    this.options.markerStrip.classList.remove("scrubbing");
    this.options.markerStrip.querySelector(".timeline-ruler-playhead")?.classList.remove("dragging");
    document.removeEventListener("pointermove", this.handleDragMove);
    document.removeEventListener("pointerup", this.handleDragEnd);
    document.removeEventListener("pointercancel", this.handleDragEnd);
    this.dragState = null;
    event.preventDefault();
  }

  private commitPointerTime(event: PointerEvent): void {
    const timelineDocument = this.options.getTimelineDocument();
    if (!timelineDocument) return;
    const stripRect = this.options.markerStrip.getBoundingClientRect();
    if (stripRect.width <= 0) return;
    const rawTime = clamp((event.clientX - stripRect.left) / stripRect.width, 0, 1) * timelineDocument.duration;
    const nextTime = snapTimelineEditorTime(timelineDocument, rawTime, { includeLayerRanges: true });
    const handle = this.options.markerStrip.querySelector<HTMLButtonElement>(".timeline-ruler-playhead");
    if (handle) this.previewTime(handle, nextTime, timelineDocument.duration);
    this.options.onTimeChanged(nextTime);
  }

  private previewTime(handle: HTMLButtonElement, time: number, duration: number): void {
    const left = Math.min(100, Math.max(0, (time / Math.max(duration, 0.001)) * 100));
    handle.dataset.time = formatNumber(time);
    handle.style.left = `${left}%`;
    handle.title = `Current time ${formatNumber(time)}s. Drag to scrub.`;
    handle.setAttribute("aria-label", `Current time ${formatNumber(time)} seconds`);
  }
}

export function appendLayerPlayhead(container: HTMLElement, timelineDocument: SceneTimelineDocument): void {
  const line = document.createElement("div");
  line.className = "timeline-layer-playhead";
  line.style.left = `${Math.min(100, Math.max(0, (timelineDocument.currentTime / Math.max(timelineDocument.duration, 0.001)) * 100))}%`;
  line.setAttribute("aria-hidden", "true");
  container.appendChild(line);
}
