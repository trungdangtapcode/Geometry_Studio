import { icons } from "lucide";

type LucideIconNode = [string, Record<string, string>];

export function query<T extends Element>(selector: string, root: ParentNode = document): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Missing element: ${selector}`);
  return element;
}

export function hydrateIcons(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>("[data-icon]").forEach((element) => {
    const iconName = element.dataset.icon ?? "Circle";
    element.innerHTML = iconSvg(iconName);
  });
}

export function iconSvg(iconName: string): string {
  const iconMap = icons as unknown as Record<string, LucideIconNode[]>;
  const icon = iconMap[iconName] ?? iconMap.Circle;
  const children = icon
    .map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).map(([key, value]) => `${key}="${value}"`).join(" ")} />`)
    .join("");
  return `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${children}</svg>`;
}

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatNumber(value: number): string {
  return Number.isFinite(value) ? String(Math.round(value * 100) / 100) : "0";
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function cleanFileName(name: string): string {
  return name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim() || "Imported Model";
}

export function downloadText(filename: string, text: string, type = "application/json"): void {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function hasWebGL2(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2"));
  } catch {
    return false;
  }
}

export function safeJsonParse<T>(text: string): T {
  const parsed = JSON.parse(text) as T;
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid JSON document.");
  }
  return parsed;
}
