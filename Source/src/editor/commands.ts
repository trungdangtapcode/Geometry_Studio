import type { SceneDocument } from "./types";

export class CommandHistory {
  private past: SceneDocument[] = [];
  private future: SceneDocument[] = [];
  private limit = 40;

  record(snapshot: SceneDocument): void {
    this.past.push(snapshot);
    if (this.past.length > this.limit) this.past.shift();
    this.future = [];
  }

  undo(current: SceneDocument): SceneDocument | null {
    const previous = this.past.pop();
    if (!previous) return null;
    this.future.push(current);
    return previous;
  }

  redo(current: SceneDocument): SceneDocument | null {
    const next = this.future.pop();
    if (!next) return null;
    this.past.push(current);
    return next;
  }

  reset(): void {
    this.past = [];
    this.future = [];
  }

  canUndo(): boolean {
    return this.past.length > 0;
  }

  canRedo(): boolean {
    return this.future.length > 0;
  }
}
