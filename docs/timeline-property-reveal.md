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
- `Alt+C` reveals Color rows.
- `Alt+T` reveals Opacity rows.
- `Alt+M` reveals all material/appearance rows, including Color, Opacity,
  Roughness, Metalness, Texture Source, Texture Repeat, Texture Offset, and
  Texture Rotation.
- `Alt+U` reveals texture/UV mapping rows.
- The Command Palette exposes the same actions as `Reveal Position Rows`,
  `Reveal Rotation Rows`, `Reveal Scale Rows`, `Reveal Color Rows`,
  `Reveal Opacity Rows`, `Reveal Material Rows`, and `Reveal Texture Rows`.
- Reveal commands select the matching active track, set the row filter to
  `Focus Rows`, populate row search with the property name, and scroll the
  active row into view.

Row search includes aliases, so searching for `material` shows the complete
appearance group instead of only rows whose literal label contains that word.
Searching for `texture` shows source and UV mapping rows.

The shortcuts use `Alt` because plain `T`, `R`, and `S` are already reserved
for viewport transform tools. That keeps the geometry editing workflow intact
while still preserving AE-style muscle memory. `Alt+M` and `Alt+U` provide fast
material and UV reveal workflows for the newer rendering and texture timeline
tracks.

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
row search text, and visible row labels. Coverage includes grouped `material`
and `texture` alias searches so new property groups stay discoverable.
