# Command Palette Recents

## Purpose

Geometry Studio has many timeline, viewport, rendering, and scene commands. The
command palette now behaves more like a professional editor launcher by
promoting recently used commands when opened with an empty search.

## Behavior

- Running a command records it in a local recent-command list.
- Opening the command palette with no search puts recent commands first.
- Recent entries keep their normal command category and add a `Recent` marker.
- Search mode still searches all commands normally.
- The list is stored in local storage and survives reloads.
- At most six recent commands are kept.

## Architecture

`Source/src/ui/commandPalette.ts` owns the recent-command preference. The
feature is intentionally editor-local state, not scene data, so it is stored
under `geometry-studio-recent-commands` in browser local storage.

The command palette still receives the same flat command list from `main.ts`.
When the search box is empty, it reorders that list into:

1. matching recent commands in most-recent-first order;
2. all remaining commands in their original order.

When the search box has text, the original search behavior is preserved.

## Validation

Automated browser coverage lives in `Source/tests/command-palette-recents.spec.ts`.
The test runs a command from search, reopens the palette, verifies the command
is first and labeled `Recent`, reloads the app, and verifies the recent command
is still first.
