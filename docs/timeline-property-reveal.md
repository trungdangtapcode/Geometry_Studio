# Timeline Property Reveal Shortcuts

## Purpose

Property reveal shortcuts make the dope sheet feel closer to After Effects for
dense animation work. Instead of manually opening the track dropdown and typing
in the row search field, the editor can jump directly to the common animated
properties.

## Behavior

- `Alt+P` reveals Position rows.
- `Alt+R` reveals Rotation rows.
- `Alt+S` reveals Scale rows.
- `Alt+T` reveals Opacity rows.
- The Command Palette exposes the same actions as `Reveal Position Rows`,
  `Reveal Rotation Rows`, `Reveal Scale Rows`, and `Reveal Opacity Rows`.
- Reveal commands select the matching active track, set the row filter to
  `Focus Rows`, populate row search with the property name, and scroll the
  active row into view.

The shortcuts use `Alt` because plain `T`, `R`, and `S` are already reserved
for viewport transform tools. That keeps the geometry editing workflow intact
while still preserving AE-style muscle memory.

## Architecture

`KeyframeTimelinePanel.revealRows()` owns the UI state transition:

- update the active timeline track dropdown,
- clear any focused axis selection,
- set row filter and row search state,
- persist those editor-view preferences in local storage,
- refresh the timeline model once,
- scroll the active row into view.

`main.ts` maps keyboard shortcuts and Command Palette commands to that panel
method. Scene JSON is unchanged because this is editor view state, not project
animation data.

## Validation

Playwright verifies both direct keyboard reveal shortcuts and Command Palette
entry points. The smoke flow checks that reveal commands update the active track,
row search text, and visible row labels.
