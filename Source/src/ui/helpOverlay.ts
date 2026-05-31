import { query } from "../utils/dom";

export type QuickHelpFilter = "all" | "shortcuts" | "viewport" | "timeline" | "rendering";

export class QuickHelpOverlay {
  private readonly root = query<HTMLElement>("#quick-help");
  private readonly searchInput = query<HTMLInputElement>("#quick-help-search");
  private readonly closeButton = query<HTMLButtonElement>("#quick-help-close");
  private readonly emptyState = query<HTMLElement>("#quick-help-empty");
  private readonly filterButtons = Array.from(this.root.querySelectorAll<HTMLButtonElement>("[data-help-filter]"));
  private activeFilter: QuickHelpFilter = "all";

  constructor() {
    this.root.addEventListener("click", (event) => {
      if (event.target === this.root) this.close();
    });
    this.closeButton.addEventListener("click", () => this.close());
    this.searchInput.addEventListener("input", () => this.applyFilters());
    this.searchInput.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        this.close();
      }
    });
    this.filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        this.setFilter(readHelpFilter(button.dataset.helpFilter));
      });
    });
  }

  open(initialQuery = "", filter: QuickHelpFilter = "all"): void {
    this.searchInput.value = initialQuery;
    this.setFilter(filter, false);
    this.root.classList.add("open");
    this.root.setAttribute("aria-hidden", "false");
    this.applyFilters();
    this.searchInput.focus();
    this.searchInput.select();
  }

  close(): void {
    this.root.classList.remove("open");
    this.root.setAttribute("aria-hidden", "true");
  }

  toggle(): void {
    if (this.isOpen()) this.close();
    else this.open();
  }

  isOpen(): boolean {
    return this.root.classList.contains("open");
  }

  private setFilter(filter: QuickHelpFilter, shouldFocus = true): void {
    this.activeFilter = filter;
    this.filterButtons.forEach((button) => {
      const isActive = readHelpFilter(button.dataset.helpFilter) === filter;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
    this.applyFilters();
    if (shouldFocus) this.searchInput.focus();
  }

  private applyFilters(): void {
    const queryText = normalize(this.searchInput.value);
    let visibleItems = 0;

    this.root.querySelectorAll<HTMLElement>(".quick-help-section").forEach((section) => {
      let sectionHasMatch = false;
      section.querySelectorAll<HTMLElement>(".quick-help-item").forEach((item) => {
        const matchesQuery = !queryText || normalize(item.textContent ?? "").includes(queryText);
        const isVisible = matchesQuery && this.matchesActiveFilter(section, item);
        item.hidden = !isVisible;
        sectionHasMatch ||= isVisible;
        if (isVisible) visibleItems += 1;
      });
      section.hidden = !sectionHasMatch;
    });

    this.emptyState.hidden = visibleItems > 0;
  }

  private matchesActiveFilter(section: HTMLElement, item: HTMLElement): boolean {
    if (this.activeFilter === "all") return true;
    if (this.activeFilter === "shortcuts") return hasShortcutText(item);

    const categories = `${section.dataset.helpCategory ?? ""} ${item.dataset.helpCategory ?? ""}`;
    return normalize(categories).split(/\s+/).includes(this.activeFilter);
  }
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function readHelpFilter(value: string | undefined): QuickHelpFilter {
  if (value === "shortcuts" || value === "viewport" || value === "timeline" || value === "rendering") return value;
  return "all";
}

function hasShortcutText(item: HTMLElement): boolean {
  const shortcutText = normalize(item.querySelector("span")?.textContent ?? "");
  if (!shortcutText) return false;
  if (/\b(toolbar|panel|setting|header|bottom bar|left rail|command palette|commands)\b/.test(shortcutText)) return false;
  return /ctrl|cmd|shift|alt|space|f3|f9|left|right|wheel|drag|mmb|numpad|\?|\/|\+|^.$/.test(shortcutText);
}
