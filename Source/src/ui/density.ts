export type UiDensity = "comfortable" | "compact" | "blender";

const DENSITY_STORAGE_KEY = "geometry-studio-ui-density";
const SCALE_STORAGE_KEY = "geometry-studio-ui-scale";
const DEFAULT_DENSITY: UiDensity = "blender";
const DEFAULT_SCALE = 1;
const DENSITIES = new Set<UiDensity>(["comfortable", "compact", "blender"]);
const UI_SCALES = [0.75, 0.85, 1, 1.1, 1.25] as const;

export function bindUiDensityControl(root: HTMLElement): void {
  const shell = root.classList.contains("studio-shell")
    ? root
    : root.querySelector<HTMLElement>(".studio-shell") ?? root;
  const densitySelect = root.querySelector<HTMLSelectElement>("#ui-density");
  const scaleSelect = root.querySelector<HTMLSelectElement>("#ui-scale");

  const apply = (density: UiDensity, persist = true) => {
    shell.dataset.density = density;
    if (densitySelect) densitySelect.value = density;
    if (persist) storeUiDensity(density);
    window.dispatchEvent(new CustomEvent("studio-density-change", { detail: { density } }));
  };
  const applyScale = (scale: number, persist = true) => {
    shell.style.setProperty("--ui-scale", String(scale));
    shell.dataset.scale = String(scale);
    if (scaleSelect) scaleSelect.value = String(scale);
    if (persist) storeUiScale(scale);
    window.dispatchEvent(new CustomEvent("studio-density-change", { detail: { scale } }));
  };

  apply(loadUiDensity(), false);
  applyScale(loadUiScale(), false);

  densitySelect?.addEventListener("change", () => {
    apply(parseUiDensity(densitySelect.value));
  });
  scaleSelect?.addEventListener("change", () => {
    applyScale(parseUiScale(scaleSelect.value));
  });
}

function loadUiDensity(): UiDensity {
  try {
    return parseUiDensity(window.localStorage.getItem(DENSITY_STORAGE_KEY));
  } catch {
    return DEFAULT_DENSITY;
  }
}

function storeUiDensity(density: UiDensity): void {
  try {
    window.localStorage.setItem(DENSITY_STORAGE_KEY, density);
  } catch {
    // The density setting is progressive enhancement; blocked storage should not affect the studio.
  }
}

function loadUiScale(): number {
  try {
    return parseUiScale(window.localStorage.getItem(SCALE_STORAGE_KEY));
  } catch {
    return DEFAULT_SCALE;
  }
}

function storeUiScale(scale: number): void {
  try {
    window.localStorage.setItem(SCALE_STORAGE_KEY, String(scale));
  } catch {
    // The scale setting is progressive enhancement; blocked storage should not affect the studio.
  }
}

function parseUiDensity(value: string | null): UiDensity {
  return DENSITIES.has(value as UiDensity) ? (value as UiDensity) : DEFAULT_DENSITY;
}

function parseUiScale(value: string | null): number {
  const numeric = Number(value);
  return UI_SCALES.some((scale) => Math.abs(scale - numeric) < 0.001) ? numeric : DEFAULT_SCALE;
}
