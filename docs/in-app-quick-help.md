# In-App Quick Help

## Purpose

The project now has enough timeline, rendering, camera, import, and editing
features that external documentation alone is not enough. The in-app Quick Help
overlay gives users a searchable control map inside the editor.

## Entry Points

- Bottom viewport bar: `Help`.
- Keyboard: `?`.
- Command palette: `Open Quick Help`.
- Command palette filtered entries: `Open Shortcut Help`, `Open Timeline Help`,
  `Open Viewport Help`, and `Open Rendering Help`.

## Content Scope

The overlay intentionally focuses on high-frequency workflows:

- command palette and density controls;
- viewport navigation and camera recovery;
- transform tools;
- `Set Key`, `Set Pose`, Auto-Key, row reveal, row filtering, row pinning, and
  Graph;
- Command Palette motion presets that bake Turntable, Float Loop, Pop Intro,
  and Product Reveal into editable keys;
- playback, work area, and selected-range preview;
- timeline-toolbar interpolation dropdown, overshoot easing, visible-row
  before/after playhead selection, and retiming commands;
- save/load, screenshot, WebM recording, Rendering Lab, and import.

The top filter chips narrow the same content without requiring a search query:

- `All` shows the complete compact map.
- `Shortcuts` shows items with keyboard or mouse shortcuts.
- `Viewport` shows camera navigation and transform workflow items.
- `Timeline` shows keyframing, playback, and retiming items.
- `Rendering` shows output, import, and Rendering Lab items.

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
- switching category filters;
- filtering to a known timeline command;
- empty-state rendering;
- closing with `Escape`;
- opening with `?`;
- opening through the command palette.
