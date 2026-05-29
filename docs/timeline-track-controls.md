# Timeline Track Controls

## Status

Track enable/disable, solo, and lock/unlock are implemented for timeline
schema v9. The schema stores `TimelineTrackDocument.enabled` for playback,
`TimelineTrackDocument.solo` for focused playback filtering, and
`TimelineTrackDocument.locked` for editing protection.

## User-Facing Behavior

- `Track On` / `Track Off` toggles the active timeline track.
- The button is disabled when the active track has no keyframes.
- Disabled tracks keep their keyframes in the scene JSON.
- Disabled tracks are skipped during object transform playback, camera
  playback, light playback, and object property playback.
- Re-enabling a track restores its animation because no keyframe data is lost.
- `Solo Off` / `Solo On` toggles focused playback for the active keyed track.
- When one or more keyed tracks are soloed, only soloed enabled tracks evaluate.
- Non-solo tracks keep their keyframes visible and editable, but the value graph
  reports `Muted by solo` when the track is excluded from runtime evaluation.
- Muted rows use a dashed swatch and reduced saturation so solo state is visible
  directly in the dope-sheet track list.
- `Unlocked` / `Locked` toggles editing protection for the active track.
- Locked tracks keep playing and drawing their value graph.
- Locked tracks reject key creation, update, deletion, retiming, value editing,
  interpolation changes, graph dragging, dope-sheet dragging, paste, duplicate,
  and clear-track commands.
- Locked row diamonds show a lock icon and graph keys render as locked points.

This gives the editor After Effects style non-destructive controls: disabling
tests motion/look changes, solo isolates the track currently being reviewed,
and locking protects finished animation from accidental edits.

## Runtime Rules

- Transform tracks return no evaluated value while disabled.
- Camera, light, material, texture, and visibility tracks return no evaluated
  value while disabled.
- If any enabled keyed track is soloed, runtime evaluation ignores every other
  enabled keyed track until solo is cleared.
- Locked tracks still evaluate normally because lock is an editor safety flag,
  not a playback flag.
- Save/Load round trips preserve `enabled`, `solo`, and `locked` flags through
  timeline schema normalization.

## Testing

The Playwright timeline workflow verifies that the active Position track can be
toggled off and that exported scene JSON preserves `enabled: false` while
keeping all keyframes.

Solo coverage verifies that soloing the active Position track marks its rows,
marks non-solo keyed rows as muted, keeps the soloed value graph live, and
mutes the Rotation graph until Rotation is soloed as well.

Additional lock coverage verifies that a locked Position track keeps its keys,
rejects delete and set-key attempts, renders locked graph points, and can be
unlocked before normal deletion.
