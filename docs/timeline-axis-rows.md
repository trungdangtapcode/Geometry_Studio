# Timeline Axis Rows

## Purpose

After Effects exposes transform properties as inspectable rows rather than a
single opaque vector. Geometry Studio now expands object Position, Rotation, and
Scale into X, Y, and Z rows in the timeline panel.

This makes transform animation easier to inspect:

- Position X / Y / Z show where translation keys exist.
- Rotation X / Y / Z show where Euler rotation keys exist.
- Scale X / Y / Z show where scale keys exist.

## Behavior

- Axis rows are UI rows only. The saved scene document still stores each
  transform property as one vector track.
- Clicking an axis row selects the same underlying parent track.
- Clicking an axis-row diamond records or updates the parent transform keyframe
  at the playhead.
- Selecting a keyframe on an axis row focuses the compact keyframe editor on
  that axis value.
- Dragging a keyframe on any axis row retimes the shared parent keyframe, so the
  X/Y/Z rows remain synchronized.

## Architecture

The implementation lives in `ui/timelinePanel.ts`. The panel converts
`position`, `rotation`, and `scale` object tracks into three row descriptors
before passing them to `animation-timeline-js`.

The durable schema is unchanged:

- no timeline version bump,
- no new JSON field,
- no separate X/Y/Z runtime clips,
- no duplicated keyframe data.

This follows the current architecture rule: Geometry Studio owns the timeline
document, while `animation-timeline-js` is only the visual editing surface.

## Tradeoff

Axis rows focus inspection and numeric editing, but the actual keyframe remains
a vector key. This is intentional for the current project because Three.js
playback and JSON persistence already rely on vector transform tracks. A future
graph editor can add true per-axis curve editing if needed.

## Testing

The Playwright smoke suite verifies that:

- keyed Position and Rotation tracks expand into three axis rows,
- Position X and Rotation Y rows are visible,
- grouped `Set TRS` keying creates visible Position and Scale axis rows,
- existing row-level keying and long timeline save/load workflows still pass.
