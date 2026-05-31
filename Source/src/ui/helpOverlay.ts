import { query } from "../utils/dom";

export class QuickHelpOverlay {
  private readonly root = query<HTMLElement>("#quick-help");
  private readonly searchInput = query<HTMLInputElement>("#quick-help-search");
  private readonly closeButton = query<HTMLButtonElement>("#quick-help-close");
  private readonly emptyState = query<HTMLElement>("#quick-help-empty");

  constructor() {
    this.root.addEventListener("click", (event) => {
      if (event.target === this.root) this.close();
    });
    this.closeButton.addEventListener("click", () => this.close());
    this.searchInput.addEventListener("input", () => this.filter());
    this.searchInput.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        this.close();
      }
    });
  }

  open(initialQuery = ""): void {
    this.searchInput.value = initialQuery;
    this.root.classList.add("open");
    this.root.setAttribute("aria-hidden", "false");
    this.filter();
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

  private filter(): void {
    const queryText = normalize(this.searchInput.value);
    let visibleItems = 0;

    this.root.querySelectorAll<HTMLElement>(".quick-help-section").forEach((section) => {
      let sectionHasMatch = false;
      section.querySelectorAll<HTMLElement>(".quick-help-item").forEach((item) => {
        const isVisible = !queryText || normalize(item.textContent ?? "").includes(queryText);
        item.hidden = !isVisible;
        sectionHasMatch ||= isVisible;
        if (isVisible) visibleItems += 1;
      });
      section.hidden = !sectionHasMatch;
    });

    this.emptyState.hidden = visibleItems > 0;
  }
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}
