# Timeline Track Controls

## Status

Track enable/disable and lock/unlock are implemented for timeline schema v9.
The schema stores `TimelineTrackDocument.enabled` for playback and
`TimelineTrackDocument.locked` for editing protection.

## User-Facing Behavior

- `Track On` / `Track Off` toggles the active timeline track.
- The button is disabled when the active track has no keyframes.
- Disabled tracks keep their keyframes in the scene JSON.
- Disabled tracks are skipped during object transform playback, camera
  playback, light playback, and object property playback.
- Re-enabling a track restores its animation because no keyframe data is lost.
- `Unlocked` / `Locked` toggles editing protection for the active track.
- Locked tracks keep playing and drawing their value graph.
- Locked tracks reject key creation, update, deletion, retiming, value editing,
  interpolation changes, graph dragging, dope-sheet dragging, paste, duplicate,
  and clear-track commands.
- Locked row diamonds show a lock icon and graph keys render as locked points.

This gives the editor After Effects style non-destructive controls: disabling
tests motion/look changes, while locking protects finished animation from
accidental edits.

## Runtime Rules

- Transform tracks return no evaluated value while disabled.
- Camera, light, material, texture, and visibility tracks return no evaluated
  value while disabled.
- Locked tracks still evaluate normally because lock is an editor safety flag,
  not a playback flag.
- Save/Load round trips preserve both the `enabled` and `locked` flags through
  timeline schema normalization.

## Testing

The Playwright timeline workflow verifies that the active Position track can be
toggled off and that exported scene JSON preserves `enabled: false` while
keeping all keyframes.

Additional lock coverage verifies that a locked Position track keeps its keys,
rejects delete and set-key attempts, renders locked graph points, and can be
unlocked before normal deletion.
