# Timeline Row Filtering

## Purpose

The timeline now includes row filtering so dense scenes remain editable without
turning the dope sheet into a long, noisy list.

## Modes

- `Focus Rows`: selected object tracks stay visible, keyed non-selected object
  tracks remain visible, pinned tracks remain visible, and camera/light tracks
  stay available.
- `Selected Layer Rows`: only the selected object's full row set is shown. This
  is the clean isolate mode for editing one object without deleting pins or
  search text.
- `Selected Keyed Rows`: only the selected object's keyed tracks are shown, plus
  the active row and pinned rows. This mirrors the After Effects `U` habit of
  revealing animated properties on the selected layer without showing the whole
  scene.
- `Keyed Rows`: only tracks with keyframes are shown, plus the currently active
  track and pinned tracks so a new keyframe can still be added.
- `Pinned Rows`: starred timeline rows are shown, plus the currently active row.
- `All Rows`: all object, camera, and light tracks are shown.
- `Shift+U` jumps directly to `Selected Keyed Rows`.
- `U` cycles Focus -> Selected Layer -> Selected Keyed -> Keyed -> Pinned ->
  All -> Focus when focus is outside form fields.
- The command palette exposes direct jumps for `Show Focus Timeline Rows`,
  `Show Selected Layer Timeline Rows`, `Show Selected Keyed Timeline Rows`,
  `Show Keyed Timeline Rows`, `Show Pinned Timeline Rows`, and `Show All
  Timeline Rows`. These avoid repeated cycling when the timeline is dense.

## Implementation

Filtering is an editor preference in `ui/timelinePanel.ts`; it is persisted in
local storage and intentionally excluded from scene JSON. The filter is applied
to both the left row labels and the `animation-timeline-js` row model so label
and canvas rows stay aligned.

The keyboard cycle, command palette direct jumps, and select control all use the
same `setRowFilter` / `applyRowFilter` path, so the persisted preference,
dropdown state, row labels, canvas rows, and graph preview refresh together.
