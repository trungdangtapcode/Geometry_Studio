# Timeline Keyframe Clipboard

## Status

Keyframe copy and paste is implemented as an editing workflow layer on top of
timeline schema v9. It does not add new saved fields; pasted keyframes are
stored as ordinary timeline keyframes.

## User-Facing Behavior

- Copy works from selected keyframes.
- If no keyframe is selected, Copy uses the keyframe under the playhead on the
  active track.
- Paste inserts copied keyframes at the current playhead time.
- Multi-keyframe copies preserve relative timing from the earliest copied
  keyframe.
- Interpolation mode and keyframe values are preserved.
- Existing keyframes at the same pasted time are replaced instead of duplicated.
- Object keyframes paste onto the currently selected object, making it possible
  to reuse motion or material animation on another object.
- Camera and light keyframes paste back into their global camera/light tracks.

## Controls

- Timeline toolbar: `Copy` and `Paste`.
- Keyboard: `Ctrl+C` / `Cmd+C` and `Ctrl+V` / `Cmd+V` when focus is outside
  form fields.

## Implementation Notes

The clipboard is intentionally in-memory and editor-local. It stores:

```ts
type TimelineClipboardKeyframe = {
  scope: "object" | "camera" | "lights";
  kind: TimelineTrackKind;
  relativeTime: number;
  value: [number, number, number];
  interpolation: TimelineInterpolation;
};
```

Keeping only relative time and track data avoids coupling clipboard entries to
old keyframe IDs. Paste creates fresh timeline IDs using the existing
`createTimelineKeyframe` helper.

## Testing

The Playwright timeline workflow verifies that:

- Copy and Paste buttons are visible.
- A Position keyframe can be copied from the active playhead track.
- Pasting at a later time creates a saved keyframe with the same value.
- The pasted keyframe survives scene JSON export.
