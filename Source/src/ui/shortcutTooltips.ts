import type { CommandPaletteCommand } from "./commandPalette";

export interface ShortcutTooltipBinding {
  selector: string;
  commandId?: string;
  label?: string;
  shortcut?: string;
  hint?: string;
}

const TOOLTIP_ID = "shortcut-tooltip";
const SHORTCUT_PATTERN = /\((Ctrl|Cmd|Meta|Alt|Shift|Space|F\d{1,2}|Delete|Escape|Enter|Home|End|Left|Right|Up|Down|[A-Z0-9+\-[\]=;',./` ]+)\)$/i;

let activeTarget: HTMLElement | null = null;
let tooltip: HTMLDivElement | null = null;
let installed = false;

export function installShortcutTooltips(commands: CommandPaletteCommand[], bindings: ShortcutTooltipBinding[]): void {
  applyShortcutBindings(commands, bindings);
  if (installed) return;
  installed = true;
  document.addEventListener("mouseover", handlePointerOver);
  document.addEventListener("mouseout", handlePointerOut);
  document.addEventListener("focusin", handleFocusIn);
  document.addEventListener("focusout", hideTooltip);
  window.addEventListener("scroll", hideTooltip, true);
  window.addEventListener("resize", hideTooltip);
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") hideTooltip();
  });
}

function applyShortcutBindings(commands: CommandPaletteCommand[], bindings: ShortcutTooltipBinding[]): void {
  const commandsById = new Map(commands.map((command) => [command.id, command]));
  bindings.forEach((binding) => {
    const command = binding.commandId ? commandsById.get(binding.commandId) : null;
    document.querySelectorAll<HTMLElement>(binding.selector).forEach((element) => {
      const label = binding.label ?? command?.title ?? elementLabel(element);
      const shortcut = binding.shortcut ?? command?.shortcut;
      element.dataset.shortcutTooltipTitle = label;
      if (binding.hint) element.dataset.shortcutTooltipHint = binding.hint;
      if (shortcut) {
        element.dataset.shortcut = shortcut;
        element.setAttribute("aria-keyshortcuts", toAriaKeyShortcuts(shortcut));
      }
      const title = shortcut ? `${label}\nShortcut: ${shortcut}` : label;
      element.setAttribute("title", title);
    });
  });
}

function handlePointerOver(event: MouseEvent): void {
  const target = tooltipTarget(event.target);
  if (!target || target === activeTarget) return;
  if (shouldSuppressTooltip(target)) return;
  showTooltip(target);
}

function handlePointerOut(event: MouseEvent): void {
  if (!activeTarget) return;
  const next = event.relatedTarget instanceof Node ? event.relatedTarget : null;
  if (next && activeTarget.contains(next)) return;
  hideTooltip();
}

function handleFocusIn(event: FocusEvent): void {
  const target = tooltipTarget(event.target);
  if (target && !shouldSuppressTooltip(target)) showTooltip(target);
}

function tooltipTarget(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null;
  return target.closest<HTMLElement>("[data-shortcut-tooltip-title], [data-native-title], [title]");
}

function showTooltip(target: HTMLElement): void {
  const data = tooltipData(target);
  if (!data) return;
  activeTarget = target;
  const node = tooltipElement();
  node.innerHTML = `
    <strong>${escapeHtml(data.label)}</strong>
    ${data.shortcut ? `<kbd>${escapeHtml(data.shortcut)}</kbd>` : ""}
  `;
  node.classList.toggle("has-shortcut", Boolean(data.shortcut));
  node.classList.add("visible");
  positionTooltip(node, target);
}

function tooltipData(target: HTMLElement): { label: string; shortcut: string; hint: string } | null {
  const nativeTitle = target.dataset.nativeTitle ?? target.getAttribute("title") ?? "";
  if (nativeTitle && !target.dataset.nativeTitle) {
    target.dataset.nativeTitle = nativeTitle;
    target.removeAttribute("title");
  }
  const explicitLabel = target.dataset.shortcutTooltipTitle ?? "";
  const explicitShortcut = target.dataset.shortcut ?? "";
  const explicitHint = target.dataset.shortcutTooltipHint ?? "";
  const parsed = parseTitleShortcut(nativeTitle);
  const label = explicitLabel || parsed.label || elementLabel(target);
  const shortcut = explicitShortcut || parsed.shortcut;
  if (!label && !shortcut) return null;
  return { label: compactLabel(label), shortcut, hint: explicitHint };
}

function hideTooltip(): void {
  activeTarget = null;
  tooltip?.classList.remove("visible");
}

function tooltipElement(): HTMLDivElement {
  if (tooltip) return tooltip;
  const existing = document.getElementById(TOOLTIP_ID);
  if (existing instanceof HTMLDivElement) {
    tooltip = existing;
    return tooltip;
  }
  tooltip = document.createElement("div");
  tooltip.id = TOOLTIP_ID;
  tooltip.className = "shortcut-tooltip";
  tooltip.setAttribute("role", "tooltip");
  document.body.appendChild(tooltip);
  return tooltip;
}

function positionTooltip(node: HTMLDivElement, target: HTMLElement): void {
  const margin = 10;
  const rect = target.getBoundingClientRect();
  const tooltipRect = node.getBoundingClientRect();
  const viewportWidth = document.documentElement.clientWidth;
  const viewportHeight = document.documentElement.clientHeight;
  let left = rect.left;
  let top = rect.bottom + margin;
  if (left + tooltipRect.width > viewportWidth - margin) left = viewportWidth - tooltipRect.width - margin;
  if (top + tooltipRect.height > viewportHeight - margin) top = rect.top - tooltipRect.height - margin;
  node.style.left = `${Math.max(margin, left)}px`;
  node.style.top = `${Math.max(margin, top)}px`;
}

function parseTitleShortcut(title: string): { label: string; shortcut: string } {
  const cleanTitle = title.trim();
  const shortcutLine = cleanTitle.match(/Shortcut:\s*(.+)$/im);
  if (shortcutLine) {
    return {
      label: cleanTitle.replace(/\n?Shortcut:\s*.+$/im, "").trim(),
      shortcut: shortcutLine[1]?.trim() ?? ""
    };
  }
  const match = cleanTitle.match(SHORTCUT_PATTERN);
  if (!match) return { label: cleanTitle, shortcut: "" };
  return {
    label: cleanTitle.replace(SHORTCUT_PATTERN, "").trim(),
    shortcut: match[1]?.trim() ?? ""
  };
}

function elementLabel(element: HTMLElement): string {
  const ariaLabel = element.getAttribute("aria-label");
  if (ariaLabel) return ariaLabel.trim();
  return (element.textContent ?? "").replace(/\s+/g, " ").trim();
}

function shouldSuppressTooltip(target: HTMLElement): boolean {
  const active = document.activeElement;
  if (
    active instanceof HTMLInputElement ||
    active instanceof HTMLTextAreaElement ||
    active instanceof HTMLSelectElement
  ) {
    return active !== target && !target.contains(active);
  }
  return false;
}

function compactLabel(label: string): string {
  const compact = label
    .replace(/\bTimeline\b/g, "")
    .replace(/\bKeyframe\b/g, "Key")
    .replace(/\bKeyframes\b/g, "Keys")
    .replace(/\bScreenshot\b/g, "Shot")
    .replace(/\s+/g, " ")
    .trim();
  return compact.length <= 28 ? compact : `${compact.slice(0, 25).trimEnd()}...`;
}

function toAriaKeyShortcuts(shortcut: string): string {
  return shortcut
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part
      .replace(/\bCtrl\b/gi, "Control")
      .replace(/\bCmd\b|\bMeta\b/gi, "Meta")
      .replace(/\bSpace\b/gi, "Space")
      .replace(/\s*\+\s*/g, "+"))
    .join(" ");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
