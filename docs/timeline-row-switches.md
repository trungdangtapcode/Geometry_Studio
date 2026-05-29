# Timeline Row Switches

## Purpose

After Effects exposes important layer and property switches directly on the
timeline row. Geometry Studio now follows that pattern for keyed tracks so users
do not have to select a row and move back to the toolbar for common track
operations.

## Behavior

Each timeline row shows compact switches beside the row label:

- Eye: enable or disable the keyed track during playback.
- Solo: isolate the keyed track when solo filtering is active.
- Lock: prevent editing, deleting, or changing the keyed track.
- Diamond: add or update the keyframe at the current playhead time.

Switches are disabled until a row has keyframes. Clicking a row switch also
selects the row so the toolbar, value graph, and keyframe editor stay in sync.

## Architecture

The switch UI is rendered by `Source/src/ui/timelinePanel.ts` in
`renderTrackLabel()`. The callbacks now accept an optional `targetId`, allowing
row switches to operate on object rows that are not currently selected while
preserving existing toolbar behavior for the active track.

The editor shell resolves a target-aware track through `activeTimelineTrack()`.
Camera and light tracks are resolved by track kind; object tracks use the row's
object id when provided.

## Validation

Playwright covers row switches by baking a rotation track, then toggling enable,
solo, and lock directly from the rotation row.
