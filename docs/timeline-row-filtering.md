# Timeline Row Filtering

## Purpose

The timeline now includes row filtering so dense scenes remain editable without
turning the dope sheet into a long, noisy list.

## Modes

- `Focus Rows`: selected object tracks stay visible, keyed non-selected object
  tracks remain visible, pinned tracks remain visible, and camera/light tracks
  stay available.
- `Keyed Rows`: only tracks with keyframes are shown, plus the currently active
  track and pinned tracks so a new keyframe can still be added.
- `Pinned Rows`: starred timeline rows are shown, plus the currently active row.
- `All Rows`: all object, camera, and light tracks are shown.
- `U` cycles Focus -> Keyed -> Pinned -> All -> Focus when focus is outside
  form fields, matching the reveal-animated-properties habit from
  motion-graphics tools.
- The command palette exposes direct jumps for `Show Focus Timeline Rows`,
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
