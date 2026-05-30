export type PlaybackDirection = -1 | 1;
export const PLAYBACK_RATES = [0.25, 0.5, 1, 2, 4] as const;

export interface TimelineTransportState {
  playing: boolean;
  direction: PlaybackDirection;
  rate: number;
}

export class TimelineTransport {
  private state: TimelineTransportState = {
    playing: false,
    direction: 1,
    rate: 1
  };

  get playing(): boolean {
    return this.state.playing;
  }

  get direction(): PlaybackDirection {
    return this.state.direction;
  }

  get rate(): number {
    return this.state.rate;
  }

  play(direction: PlaybackDirection): TimelineTransportState {
    return this.set(true, direction, this.nextRate(direction));
  }

  pause(): TimelineTransportState {
    return this.set(false, this.state.direction, this.state.rate);
  }

  setRate(rate: number): TimelineTransportState {
    return this.set(this.state.playing, this.state.direction, rate);
  }

  set(playing: boolean, direction: PlaybackDirection = this.state.direction, rate = this.state.rate): TimelineTransportState {
    this.state = {
      playing,
      direction,
      rate: clampPlaybackRate(rate)
    };
    return this.snapshot();
  }

  playbackDelta(delta: number): number {
    return delta * this.state.direction * this.state.rate;
  }

  buttonLabel(): string {
    return this.state.playing ? `Pause ${formatPlaybackRate(this.state.rate)}` : "Play";
  }

  statusLabel(): string {
    if (!this.state.playing) return "Ready";
    return `${this.state.direction > 0 ? "Forward" : "Reverse"} ${formatPlaybackRate(this.state.rate)}`;
  }

  iconName(): "Pause" | "Play" {
    return this.state.playing ? "Pause" : "Play";
  }

  private nextRate(direction: PlaybackDirection): number {
    if (!this.state.playing || this.state.direction !== direction) return this.state.rate;
    if (this.state.rate < 1) return 1;
    if (this.state.rate < 2) return 2;
    return 4;
  }

  private snapshot(): TimelineTransportState {
    return { ...this.state };
  }
}

export function clampPlaybackRate(rate: number): number {
  if (!Number.isFinite(rate)) return 1;
  if (rate <= 0.25) return 0.25;
  if (rate <= 0.5) return 0.5;
  if (rate <= 1) return 1;
  if (rate <= 2) return 2;
  return 4;
}

export function formatPlaybackRate(rate: number): string {
  const safeRate = clampPlaybackRate(rate);
  return `${Number.isInteger(safeRate) ? safeRate.toFixed(0) : safeRate}x`;
}
