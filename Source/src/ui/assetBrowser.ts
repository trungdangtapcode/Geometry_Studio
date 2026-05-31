import { query } from "../utils/dom";

type AssetBrowserState = "open" | "minimized" | "closed";
type AssetBrowserTab = "online" | "campus" | "built-in" | "materials" | "models";

interface StoredAssetBrowserState {
  state?: AssetBrowserState;
  tab?: string;
}

const ASSET_BROWSER_STORAGE_KEY = "geometry-studio-asset-browser-state";

export class AssetBrowser {
  private readonly browser = query<HTMLElement>("#asset-browser");
  private readonly toggleButton = query<HTMLButtonElement>("#asset-browser-toggle");
  private readonly minimizeButton = query<HTMLButtonElement>("#asset-browser-minimize");
  private readonly closeButton = query<HTMLButtonElement>("#asset-browser-close");
  private readonly restoreButton = query<HTMLButtonElement>("#asset-browser-restore");
  private readonly searchInput = query<HTMLInputElement>("#asset-browser-search");
  private readonly emptyState = query<HTMLElement>("#asset-browser-empty");
  private readonly cards = Array.from(this.browser.querySelectorAll<HTMLElement>(".asset-card"));
  private readonly tabs = Array.from(this.browser.querySelectorAll<HTMLButtonElement>(".asset-tab"));
  private activeTab: AssetBrowserTab = parseAssetBrowserTab(loadAssetBrowserState().tab);

  constructor() {
    this.bindTabs();
    this.bindStateButtons();
    this.searchInput.addEventListener("input", () => this.applyFilter());

    const storedState = loadAssetBrowserState();
    this.setState(storedState.state ?? "closed", false);
    this.applyFilter();
  }

  private bindTabs(): void {
    this.tabs.forEach((tab) => {
      this.syncTab(tab);
      tab.addEventListener("click", () => {
        this.activeTab = parseAssetBrowserTab(tab.dataset.assetTab);
        this.tabs.forEach((item) => this.syncTab(item));
        this.applyFilter();
        storeAssetBrowserState({ state: this.currentState(), tab: this.activeTab });
      });
    });
  }

  private syncTab(tab: HTMLButtonElement): void {
    const selected = tab.dataset.assetTab === this.activeTab;
    tab.classList.toggle("active", selected);
    tab.setAttribute("aria-pressed", String(selected));
  }

  private bindStateButtons(): void {
    this.toggleButton.addEventListener("click", () => {
      this.setState(this.browser.classList.contains("is-hidden") ? "open" : "closed");
    });
    this.minimizeButton.addEventListener("click", () => this.setState("minimized"));
    this.closeButton.addEventListener("click", () => this.setState("closed"));
    this.restoreButton.addEventListener("click", () => this.setState("open"));
  }

  private setState(state: AssetBrowserState, persist = true): void {
    this.browser.classList.toggle("is-hidden", state === "closed");
    this.browser.classList.toggle("is-minimized", state === "minimized");
    this.browser.setAttribute("aria-hidden", String(state === "closed"));
    this.toggleButton.classList.toggle("active", state !== "closed");
    this.toggleButton.setAttribute("aria-pressed", String(state !== "closed"));
    this.toggleButton.title = state === "closed" ? "Open asset browser" : "Close asset browser";
    if (persist) storeAssetBrowserState({ state, tab: this.activeTab });
  }

  private applyFilter(): void {
    const queryText = this.searchInput.value.trim().toLowerCase();
    let visibleCount = 0;

    this.cards.forEach((card) => {
      const categories = (card.dataset.assetCategory ?? "").split(/\s+/);
      const matchesTab = categoryMatchesTab(categories, card.dataset.assetProvider, this.activeTab);
      const matchesSearch = !queryText || (card.dataset.assetSearch ?? "").toLowerCase().includes(queryText);
      const visible = matchesTab && matchesSearch;
      card.hidden = !visible;
      if (visible) visibleCount += 1;
    });

    this.emptyState.hidden = visibleCount > 0;
  }

  private currentState(): AssetBrowserState {
    if (this.browser.classList.contains("is-hidden")) return "closed";
    if (this.browser.classList.contains("is-minimized")) return "minimized";
    return "open";
  }
}

function categoryMatchesTab(categories: string[], provider: string | undefined, tab: AssetBrowserTab): boolean {
  if (tab === "online") return categories.includes("online") && provider !== "campus";
  if (tab === "campus") return provider === "campus";
  if (tab === "built-in") return categories.includes("built-in");
  if (tab === "materials") return categories.includes("materials");
  return categories.includes("models");
}

function parseAssetBrowserTab(tab: string | undefined): AssetBrowserTab {
  return tab === "campus" || tab === "built-in" || tab === "materials" || tab === "models" ? tab : "online";
}

function loadAssetBrowserState(): StoredAssetBrowserState {
  try {
    const raw = window.localStorage.getItem(ASSET_BROWSER_STORAGE_KEY);
    return raw ? JSON.parse(raw) as StoredAssetBrowserState : {};
  } catch {
    return {};
  }
}

function storeAssetBrowserState(state: { state: AssetBrowserState; tab: AssetBrowserTab }): void {
  try {
    window.localStorage.setItem(ASSET_BROWSER_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // The asset browser still works when storage is unavailable.
  }
}
