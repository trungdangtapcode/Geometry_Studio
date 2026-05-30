import type { SceneTimelineDocument } from "../editor/types";
import { clamp, formatNumber } from "../utils/dom";

type TimelineWorkAreaDragMode = "move" | "start" | "end";

type TimelineWorkAreaDragState = {
  pointerId: number;
  button: HTMLButtonElement;
  mode: TimelineWorkAreaDragMode;
  startClientX: number;
  originalStart: number;
  originalEnd: number;
  nextStart: number;
  nextEnd: number;
  duration: number;
  width: number;
  moved: boolean;
};

type TimelineWorkAreaPatch = Partial<Pick<SceneTimelineDocument, "workStart" | "workEnd">>;

export interface TimelineWorkAreaControllerOptions {
  markerStrip: HTMLDivElement;
  workStartInput: HTMLInputElement;
  workEndInput: HTMLInputElement;
  getTimelineDocument(): SceneTimelineDocument | null;
  onCommit(patch: TimelineWorkAreaPatch): void;
}

export class TimelineWorkAreaController {
  private dragState: TimelineWorkAreaDragState | null = null;
  private readonly handleDragMove = (event: PointerEvent) => this.drag(event);
  private readonly handleDragEnd = (event: PointerEvent) => this.finishDrag(event);

  constructor(private readonly options: TimelineWorkAreaControllerOptions) {}

  render(timelineDocument: SceneTimelineDocument): void {
    const duration = Math.max(timelineDocument.duration, 0.001);
    const start = clamp(Math.min(timelineDocument.workStart, timelineDocument.workEnd), 0, duration);
    const end = clamp(Math.max(timelineDocument.workStart, timelineDocument.workEnd), start + this.minimumSpan(), duration);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "timeline-work-area";
    button.dataset.workStart = formatNumber(start);
    button.dataset.workEnd = formatNumber(end);
    this.previewRange(button, start, end, duration);
    button.innerHTML = `
      <span class="timeline-work-area-handle timeline-work-area-handle-start" data-work-area-action="start" aria-hidden="true"></span>
      <span class="timeline-work-area-body" data-work-area-action="move">
        <span class="timeline-work-area-label">Work ${formatNumber(start)}-${formatNumber(end)}s</span>
      </span>
      <span class="timeline-work-area-handle timeline-work-area-handle-end" data-work-area-action="end" aria-hidden="true"></span>
    `;
    this.options.markerStrip.appendChild(button);
  }

  startDrag(event: PointerEvent): void {
    const timelineDocument = this.options.getTimelineDocument();
    if (event.button !== 0 || !timelineDocument) return;
    const actionTarget = (event.target as HTMLElement).closest<HTMLElement>("[data-work-area-action]");
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>(".timeline-work-area");
    if (!actionTarget || !button) return;

    const originalStart = Number(button.dataset.workStart);
    const originalEnd = Number(button.dataset.workEnd);
    if (!Number.isFinite(originalStart) || !Number.isFinite(originalEnd)) return;

    const stripRect = this.options.markerStrip.getBoundingClientRect();
    if (stripRect.width <= 0) return;
    const mode = parseWorkAreaDragMode(actionTarget.dataset.workAreaAction);
    this.dragState = {
      pointerId: event.pointerId,
      button,
      mode,
      startClientX: event.clientX,
      originalStart,
      originalEnd,
      nextStart: originalStart,
      nextEnd: originalEnd,
      duration: Math.max(timelineDocument.duration, 0.001),
      width: stripRect.width,
      moved: false
    };
    button.classList.add("dragging", `dragging-${mode}`);
    button.setPointerCapture(event.pointerId);
    button.addEventListener("pointermove", this.handleDragMove);
    button.addEventListener("pointerup", this.handleDragEnd);
    button.addEventListener("pointercancel", this.handleDragEnd);
    event.preventDefault();
  }

  private drag(event: PointerEvent): void {
    const state = this.dragState;
    if (!state || event.pointerId !== state.pointerId) return;
    const minimumSpan = this.minimumSpan();
    const deltaTime = ((event.clientX - state.startClientX) / state.width) * state.duration;
    const originalSpan = Math.max(state.originalEnd - state.originalStart, minimumSpan);
    let nextStart = state.originalStart;
    let nextEnd = state.originalEnd;

    if (state.mode === "start") {
      nextStart = this.snapTime(clamp(state.originalStart + deltaTime, 0, state.originalEnd - minimumSpan));
      nextStart = clamp(nextStart, 0, state.originalEnd - minimumSpan);
      nextEnd = state.originalEnd;
    } else if (state.mode === "end") {
      nextEnd = this.snapTime(clamp(state.originalEnd + deltaTime, state.originalStart + minimumSpan, state.duration));
      nextStart = state.originalStart;
      nextEnd = clamp(nextEnd, state.originalStart + minimumSpan, state.duration);
    } else {
      nextStart = this.snapTime(clamp(state.originalStart + deltaTime, 0, state.duration - originalSpan));
      nextStart = clamp(nextStart, 0, state.duration - originalSpan);
      nextEnd = nextStart + originalSpan;
    }

    state.nextStart = roundTimelineTime(clamp(nextStart, 0, state.duration - minimumSpan));
    state.nextEnd = roundTimelineTime(clamp(nextEnd, state.nextStart + minimumSpan, state.duration));
    state.moved ||= Math.abs(event.clientX - state.startClientX) > 2;
    this.previewRange(state.button, state.nextStart, state.nextEnd, state.duration);
    this.options.workStartInput.value = formatNumber(state.nextStart);
    this.options.workEndInput.value = formatNumber(state.nextEnd);
  }

  private finishDrag(event: PointerEvent): void {
    const state = this.dragState;
    if (!state || event.pointerId !== state.pointerId) return;
    state.button.classList.remove("dragging", "dragging-start", "dragging-end", "dragging-move");
    state.button.removeEventListener("pointermove", this.handleDragMove);
    state.button.removeEventListener("pointerup", this.handleDragEnd);
    state.button.removeEventListener("pointercancel", this.handleDragEnd);
    if (state.button.hasPointerCapture(event.pointerId)) state.button.releasePointerCapture(event.pointerId);
    this.dragState = null;

    const changed = Math.abs(state.nextStart - state.originalStart) > 0.001 || Math.abs(state.nextEnd - state.originalEnd) > 0.001;
    if (state.moved && changed) {
      this.options.onCommit({ workStart: state.nextStart, workEnd: state.nextEnd });
      return;
    }
    const timelineDocument = this.options.getTimelineDocument();
    if (!timelineDocument) return;
    this.options.workStartInput.value = formatNumber(timelineDocument.workStart);
    this.options.workEndInput.value = formatNumber(timelineDocument.workEnd);
  }

  private previewRange(button: HTMLButtonElement, start: number, end: number, duration: number): void {
    const left = (start / duration) * 100;
    const width = Math.max(((end - start) / duration) * 100, 0.8);
    button.dataset.workStart = formatNumber(start);
    button.dataset.workEnd = formatNumber(end);
    button.style.left = `${left}%`;
    button.style.width = `${Math.min(width, 100 - left)}%`;
    button.title = `Work area ${formatNumber(start)}-${formatNumber(end)}s. Drag body to move, edges to trim.`;
    button.setAttribute("aria-label", `Work area from ${formatNumber(start)} to ${formatNumber(end)} seconds`);
    const label = button.querySelector<HTMLElement>(".timeline-work-area-label");
    if (label) label.textContent = `Work ${formatNumber(start)}-${formatNumber(end)}s`;
  }

  private minimumSpan(): number {
    return Math.max(Math.min(this.options.getTimelineDocument()?.snapStep ?? 1 / 30, 0.25), 0.001);
  }

  private snapTime(time: number): number {
    const timelineDocument = this.options.getTimelineDocument();
    if (!timelineDocument?.snapEnabled || timelineDocument.snapStep <= 0) return roundTimelineTime(time);
    return roundTimelineTime(Math.round(time / timelineDocument.snapStep) * timelineDocument.snapStep);
  }
}

function parseWorkAreaDragMode(value: string | undefined): TimelineWorkAreaDragMode {
  if (value === "start" || value === "end") return value;
  return "move";
}

function roundTimelineTime(time: number): number {
  return Math.round(time * 1000) / 1000;
}
