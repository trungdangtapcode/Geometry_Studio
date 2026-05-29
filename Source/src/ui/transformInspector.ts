import * as THREE from "three";
import type { SceneEntry } from "../editor/types";
import { formatNumber, hydrateIcons } from "../utils/dom";

export type TransformProperty = "position" | "rotation" | "scale";
export type TransformAxis = "x" | "y" | "z";

export interface TransformKeyState {
  locked: boolean;
  hasPlayheadKey: boolean;
}

export interface TransformInspectorCallbacks {
  keyState(kind: TransformProperty): TransformKeyState;
  onSetKey(kind: TransformProperty): void;
  onValueChanged(kind: TransformProperty, axis: TransformAxis, value: number): void;
}

const AXES: TransformAxis[] = ["x", "y", "z"];

export function renderTransformInspector(
  grid: HTMLDivElement,
  entry: SceneEntry | null,
  callbacks: TransformInspectorCallbacks
): void {
  const rows = [
    ["position", "Position", entry?.root.position ?? new THREE.Vector3()],
    ["rotation", "Rotation", entry?.root.rotation ?? new THREE.Euler()],
    ["scale", "Scale", entry?.root.scale ?? new THREE.Vector3(1, 1, 1)]
  ] as const;

  grid.innerHTML = rows
    .map(([key, label, value]) => renderTransformRow(key, label, value, callbacks.keyState(key)))
    .join("");
  hydrateIcons(grid);

  grid.querySelectorAll<HTMLButtonElement>(".transform-key-button").forEach((button) => {
    button.addEventListener("click", () => {
      callbacks.onSetKey(button.dataset.prop as TransformProperty);
    });
  });

  grid.querySelectorAll<HTMLInputElement>(".transform-input").forEach((input) => {
    input.addEventListener("change", () => {
      callbacks.onValueChanged(
        input.dataset.prop as TransformProperty,
        input.dataset.axis as TransformAxis,
        Number(input.value)
      );
    });
  });
}

function renderTransformRow(
  key: TransformProperty,
  label: string,
  value: THREE.Vector3 | THREE.Euler,
  keyState: TransformKeyState
): string {
  const values = key === "rotation"
    ? [
      THREE.MathUtils.radToDeg((value as THREE.Euler).x),
      THREE.MathUtils.radToDeg((value as THREE.Euler).y),
      THREE.MathUtils.radToDeg((value as THREE.Euler).z)
    ]
    : [(value as THREE.Vector3).x, (value as THREE.Vector3).y, (value as THREE.Vector3).z];
  const keyText = keyState.locked
    ? "Track locked"
    : keyState.hasPlayheadKey
      ? "Update key at playhead"
      : "Set key at playhead";
  return `
    <div class="grid-label transform-row-label">
      <span>${label}</span>
      <button class="transform-key-button" type="button" data-prop="${key}" aria-label="${keyText}: ${label}" title="${keyText}" ${keyState.locked ? "disabled" : ""}>
        <span data-icon="${keyState.locked ? "Lock" : keyState.hasPlayheadKey ? "Diamond" : "DiamondPlus"}"></span>
      </button>
    </div>
    ${AXES.map((axis, index) => `
      <label class="axis-input">
        <span>${axis.toUpperCase()}</span>
        <input class="transform-input" data-prop="${key}" data-axis="${axis}" type="number" step="0.1" value="${formatNumber(values[index])}" />
      </label>
    `).join("")}
  `;
}
