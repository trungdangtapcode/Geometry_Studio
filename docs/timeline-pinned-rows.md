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
- The command palette includes `Pin Active Timeline Row`.
- `Pinned Rows` in the timeline row filter shows pinned rows plus the active
  row.
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
rows hide, reloads the app, and confirms the pinned row and filter persist.
