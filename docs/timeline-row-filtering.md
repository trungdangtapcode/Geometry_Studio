# Timeline Row Filtering

## Purpose

The timeline now includes row filtering so dense scenes remain editable without
turning the dope sheet into a long, noisy list.

## Modes

- `Focus Rows`: selected object tracks stay visible, keyed non-selected object
  tracks remain visible, and camera/light tracks stay available.
- `Keyed Rows`: only tracks with keyframes are shown, plus the currently active
  track so a new keyframe can still be added.
- `All Rows`: all object, camera, and light tracks are shown.

## Implementation

Filtering is an editor preference in `ui/timelinePanel.ts`; it is persisted in
local storage and intentionally excluded from scene JSON. The filter is applied
to both the left row labels and the `animation-timeline-js` row model so label
and canvas rows stay aligned.
