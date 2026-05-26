import type { SceneEntry } from "../editor/types";

export function updateEntryAnimation(entry: SceneEntry, delta: number, elapsed: number): void {
  if (entry.animation === "spin") {
    entry.root.rotation.y += delta * 1.1;
    entry.root.rotation.x += delta * 0.28;
  } else if (entry.animation === "orbit") {
    const radius = 2.5 + (entry.phase % 1.5);
    entry.root.position.x = entry.basePosition.x + Math.cos(elapsed * 0.75 + entry.phase) * radius;
    entry.root.position.z = entry.basePosition.z + Math.sin(elapsed * 0.75 + entry.phase) * radius;
    entry.root.rotation.y += delta * 0.8;
  } else if (entry.animation === "bounce") {
    entry.root.position.y = entry.basePosition.y + Math.abs(Math.sin(elapsed * 1.8 + entry.phase)) * 1.1;
  } else if (entry.animation === "pulse") {
    const pulse = 1 + Math.sin(elapsed * 2.2 + entry.phase) * 0.18;
    entry.root.scale.copy(entry.baseScale).multiplyScalar(pulse);
  }
}
