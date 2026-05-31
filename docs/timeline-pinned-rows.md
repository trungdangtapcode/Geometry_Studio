# Timeline Pinned Rows

## Purpose

Dense After Effects style timelines need a way to keep important properties
visible without relying on search every time. Geometry Studio now lets users pin
timeline rows and switch the row filter to `Pinned Rows`.

## Behavior

- Every timeline property row has a star action beside the eye/solo/lock
  controls.
- Clicking the star pins or unpins the whole track row.
- `Shift+P` pins or unpins the active timeline row.
- The toolbar pin button pins every currently visible timeline row. This is
  useful after using row search or reveal shortcuts to isolate a set of tracks.
- The toolbar pin-off button clears all pinned timeline rows.
- `Pin Selected Transform Rows` pins Position, Rotation, and Scale for the
  selected object in one command, giving the user a fast transform keying set.
- `Set Pinned` records keys on every pinned row, even when row search or the
  current filter hides those rows. This makes pinned rows work as a reusable
  keying set for Position/Rotation/Scale, camera, light, or material channels.
- `Select Pinned` selects keyframes on pinned rows, which makes pinned rows a
  reusable retiming/easing/copy-delete selection set as well as a keying set.
- `Select Pinned Row Keys At Playhead` and `Copy Pinned Row Keys At Playhead`
  work with only the pinned pose column at the current time, regardless of row
  search or row filter state.
- The command palette includes `Pin Active Timeline Row`, `Pin Visible Timeline
  Rows`, `Unpin Visible Timeline Rows`, `Clear Pinned Timeline Rows`, `Show
  Pinned Timeline Rows`, `Pin Selected Transform Rows`, and `Set Keys On Pinned
  Rows`, `Select Pinned Row Keyframes`, and `Select Pinned Row Work Area
  Keyframes`, `Select Pinned Row Keys At Playhead`, and `Copy Pinned Row Keys
  At Playhead`.
- `Pinned Rows` in the timeline row filter shows pinned rows plus the active
  row. The filter label shows the current pinned-row count.
- Pinned rows also remain visible in `Focus Rows` and `Keyed Rows`, so important
  tracks do not disappear when the timeline is reduced.
- The pinned-row list is stored in local storage and survives reloads.
- Pinned rows are editor UI preferences, not scene data, so they are not saved
  in scene JSON.

## Architecture

`Source/src/ui/timelinePanel.ts` stores pinned rows under
`geometry-studio-timeline-pinned-rows`. Row IDs use the timeline target and
track kind:

```text
targetId:trackKind
```

Axis-expanded rows share the same track key. For example, pinning one Rotation
axis keeps the Rotation X/Y/Z rows together, matching how the underlying
timeline document stores vector tracks.

## Validation

Automated browser coverage lives in `Source/tests/timeline-pinned-rows.spec.ts`.
The test pins a Rotation row, switches to `Pinned Rows`, confirms unrelated
rows hide, reloads the app, confirms the pinned row and filter persist, then
covers bulk visible-row pinning and clearing through the toolbar and command
palette. It also verifies that `Set Keys On Pinned Rows` can key a pinned row
while that row is hidden by row search, and that `Pin Selected Transform Rows`
creates a three-track transform keying set for `Set Pinned`, `Select Pinned`,
and pinned playhead-time copy/selection.
