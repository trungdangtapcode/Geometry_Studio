# In-App Quick Help

## Purpose

The project now has enough timeline, rendering, camera, import, and editing
features that external documentation alone is not enough. The in-app Quick Help
overlay gives users a searchable control map inside the editor.

## Entry Points

- Bottom viewport bar: `Help`.
- Keyboard: `?`.
- Command palette: `Open Quick Help`.

## Content Scope

The overlay intentionally focuses on high-frequency workflows:

- command palette and density controls;
- viewport navigation and camera recovery;
- transform tools;
- `Set Key`, `Set TRS`, Auto-Key, row reveal, row filtering, row pinning, and
  Graph;
- playback, work area, and selected-range preview;
- interpolation and retiming commands;
- save/load, screenshot, WebM recording, Rendering Lab, and import.

The complete long-form tutorial remains in `docs/beginner-tutorial.md`, and the
full shortcut map remains in `docs/user-cheatsheet.md`.

## Architecture

`Source/src/ui/helpOverlay.ts` owns overlay open/close state and search
filtering. The static content lives in `Source/src/ui/template.ts` so it is
available in the offline `Release/` build without fetching Markdown files at
runtime.

The overlay is editor UI state only. It is not saved into scene JSON.

## Validation

Automated browser coverage lives in `Source/tests/quick-help.spec.ts`. The test
verifies:

- opening from the bottom `Help` button;
- filtering to a known timeline command;
- empty-state rendering;
- closing with `Escape`;
- opening with `?`;
- opening through the command palette.
