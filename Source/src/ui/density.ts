export type UiDensity = "comfortable" | "compact" | "blender";

const STORAGE_KEY = "geometry-studio-ui-density";
const DEFAULT_DENSITY: UiDensity = "blender";
const DENSITIES = new Set<UiDensity>(["comfortable", "compact", "blender"]);

export function bindUiDensityControl(root: HTMLElement): void {
  const shell = root.classList.contains("studio-shell")
    ? root
    : root.querySelector<HTMLElement>(".studio-shell") ?? root;
  const select = root.querySelector<HTMLSelectElement>("#ui-density");

  const apply = (density: UiDensity, persist = true) => {
    shell.dataset.density = density;
    if (select) select.value = density;
    if (persist) storeUiDensity(density);
    window.dispatchEvent(new CustomEvent("studio-density-change", { detail: { density } }));
  };

  apply(loadUiDensity(), false);

  select?.addEventListener("change", () => {
    apply(parseUiDensity(select.value));
  });
}

function loadUiDensity(): UiDensity {
  try {
    return parseUiDensity(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return DEFAULT_DENSITY;
  }
}

function storeUiDensity(density: UiDensity): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, density);
  } catch {
    // The density setting is progressive enhancement; blocked storage should not affect the studio.
  }
}

function parseUiDensity(value: string | null): UiDensity {
  return DENSITIES.has(value as UiDensity) ? (value as UiDensity) : DEFAULT_DENSITY;
}
