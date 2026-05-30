# Timeline Paste Insert

## Purpose

Paste Insert is a timeline edit command for placing copied keyframes while
making room on the destination tracks. It mirrors non-linear editor insert
behavior and complements the existing overwrite-style `Paste` command.

## User-Facing Behavior

- Toolbar command: `Paste Insert`.
- Keyboard shortcut: `Ctrl+Shift+V` or `Cmd+Shift+V`.
- Paste controls are disabled until the timeline clipboard contains keyframes.
- Uses the current playhead time as the paste start.
- Computes the copied keyframe block duration from the clipboard timing span.
- Shifts compatible destination-track keyframes at or after the playhead later
  by that duration.
- Pastes copied keyframes after the shift.
- Preserves copied values and interpolation.
- Respects the same object-target behavior as normal Paste:
  - ordinary object keys paste onto the currently selected object;
  - visible-time copied keys preserve their original object targets.
- Locked or incompatible destination tracks are skipped.

## Difference From Normal Paste

Normal `Paste` writes copied keyframes at the target time and replaces existing
keys at the same time. `Paste Insert` first opens space, then writes the copied
keys. This is useful when building animation timing without manually shifting
later poses.

## Implementation Notes

`pasteTimelineClipboard` accepts an `insertBeforePaste` option. When enabled, it
resolves the compatible paste destination tracks, shifts later destination
keyframes with `insertTimelineGapOnTracks`, then runs the existing paste logic.

This keeps Paste and Paste Insert on the same clipboard code path and avoids a
second target-resolution implementation.

## Test Coverage

Playwright verifies:

- Copying two Position keys.
- Adding a later destination key.
- Running `Ctrl+Shift+V` at the playhead.
- Confirming the pasted keys appear at the playhead and clipboard offset.
- Confirming later destination keys shift by the clipboard span.
- Confirming the result persists in exported scene JSON.
