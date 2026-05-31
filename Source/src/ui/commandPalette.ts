import { query } from "../utils/dom";

const RECENT_COMMANDS_STORAGE_KEY = "geometry-studio-recent-commands";
const MAX_RECENT_COMMANDS = 6;

export interface CommandPaletteCommand {
  id: string;
  title: string;
  category: string;
  keywords?: string[];
  shortcut?: string;
  disabled?: () => boolean;
  run: () => void;
}

export class CommandPalette {
  private readonly root = query<HTMLElement>("#command-palette");
  private readonly searchInput = query<HTMLInputElement>("#command-palette-search");
  private readonly list = query<HTMLDivElement>("#command-palette-list");
  private commands: CommandPaletteCommand[] = [];
  private filteredCommands: CommandPaletteCommand[] = [];
  private recentCommandIds = loadRecentCommandIds();
  private activeIndex = 0;

  constructor() {
    this.root.addEventListener("click", (event) => {
      if (event.target === this.root) this.close();
    });
    this.searchInput.addEventListener("input", () => this.render());
    this.searchInput.addEventListener("keydown", (event) => this.handleKeydown(event));
    this.list.addEventListener("click", (event) => {
      const button = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>("[data-command-id]");
      if (!button) return;
      const command = this.filteredCommands.find((candidate) => candidate.id === button.dataset.commandId);
      if (command) this.runCommand(command);
    });
  }

  setCommands(commands: CommandPaletteCommand[]): void {
    this.commands = commands;
    if (this.isOpen()) this.render();
  }

  open(initialQuery = ""): void {
    this.searchInput.value = initialQuery;
    this.activeIndex = 0;
    this.root.classList.add("open");
    this.root.setAttribute("aria-hidden", "false");
    this.render();
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

  private handleKeydown(event: KeyboardEvent): void {
    if (event.key === "Escape") {
      event.preventDefault();
      this.close();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      this.moveActive(1);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      this.moveActive(-1);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const command = this.filteredCommands[this.activeIndex];
      if (command) this.runCommand(command);
    }
  }

  private render(): void {
    const queryText = normalizeSearch(this.searchInput.value);
    this.filteredCommands = this.filteredAndOrderedCommands(queryText);
    this.activeIndex = clampIndex(this.activeIndex, this.filteredCommands.length);
    this.list.innerHTML = "";

    if (this.filteredCommands.length === 0) {
      const empty = document.createElement("div");
      empty.className = "command-palette-empty";
      empty.textContent = "No commands";
      this.list.appendChild(empty);
      return;
    }

    this.filteredCommands.forEach((command, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "command-palette-item";
      button.classList.toggle("active", index === this.activeIndex);
      button.disabled = Boolean(command.disabled?.());
      button.dataset.commandId = command.id;

      const text = document.createElement("span");
      text.className = "command-palette-text";

      const title = document.createElement("strong");
      title.textContent = command.title;

      const category = document.createElement("span");
      category.textContent = this.isRecentCommand(command.id) && !queryText ? `${command.category} · Recent` : command.category;

      text.append(title, category);
      button.appendChild(text);

      if (command.shortcut) {
        const shortcut = document.createElement("kbd");
        shortcut.textContent = command.shortcut;
        button.appendChild(shortcut);
      }

      this.list.appendChild(button);
    });
    this.scrollActiveIntoView();
  }

  private moveActive(direction: -1 | 1): void {
    if (this.filteredCommands.length === 0) return;
    this.activeIndex = (this.activeIndex + direction + this.filteredCommands.length) % this.filteredCommands.length;
    this.render();
  }

  private runCommand(command: CommandPaletteCommand): void {
    if (command.disabled?.()) return;
    this.close();
    this.recordRecentCommand(command.id);
    command.run();
  }

  private scrollActiveIntoView(): void {
    this.list.querySelector<HTMLElement>(".command-palette-item.active")?.scrollIntoView({ block: "nearest" });
  }

  private filteredAndOrderedCommands(queryText: string): CommandPaletteCommand[] {
    const matches = this.commands.filter((command) => matchesCommand(command, queryText));
    if (queryText) return matches;

    const byId = new Map(this.commands.map((command) => [command.id, command]));
    const recent = this.recentCommandIds
      .map((id) => byId.get(id))
      .filter((command): command is CommandPaletteCommand => Boolean(command));
    const recentIds = new Set(recent.map((command) => command.id));
    return [...recent, ...matches.filter((command) => !recentIds.has(command.id))];
  }

  private recordRecentCommand(commandId: string): void {
    this.recentCommandIds = [commandId, ...this.recentCommandIds.filter((id) => id !== commandId)].slice(0, MAX_RECENT_COMMANDS);
    storeRecentCommandIds(this.recentCommandIds);
  }

  private isRecentCommand(commandId: string): boolean {
    return this.recentCommandIds.includes(commandId);
  }
}

function matchesCommand(command: CommandPaletteCommand, queryText: string): boolean {
  if (!queryText) return true;
  const haystack = normalizeSearch([
    command.title,
    command.category,
    command.shortcut ?? "",
    ...(command.keywords ?? [])
  ].join(" "));
  return queryText.split(" ").every((part) => haystack.includes(part));
}

function normalizeSearch(value: string): string {
  return value.trim().toLowerCase();
}

function clampIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  return Math.max(0, Math.min(index, length - 1));
}

function loadRecentCommandIds(): string[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(RECENT_COMMANDS_STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === "string").slice(0, MAX_RECENT_COMMANDS)
      : [];
  } catch {
    return [];
  }
}

function storeRecentCommandIds(commandIds: string[]): void {
  try {
    window.localStorage.setItem(RECENT_COMMANDS_STORAGE_KEY, JSON.stringify(commandIds.slice(0, MAX_RECENT_COMMANDS)));
  } catch {
    // Recent commands are a convenience preference; storage failures should not block command execution.
  }
}
