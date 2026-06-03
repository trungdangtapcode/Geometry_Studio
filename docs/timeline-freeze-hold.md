# Timeline Freeze / Hold To Work Out

## Purpose

`Hold Selected Keyframes To Work Out` is a compact keyframe assistant for
creating a still pose without manually duplicating values. It follows the same
mental model as an After Effects freeze-frame workflow: choose the pose key,
extend it to the end of the preview range, and make the source key hold.

## Behavior

- Resolve selected keyframes through the standard timeline source path.
- Group selected sources by track.
- For each track, use the latest selected keyframe as the source pose.
- Set that source keyframe's interpolation to `hold`.
- Create a Work Out keyframe with the same value when no Work Out key exists.
- Update the existing Work Out keyframe when one already exists.
- Preserve ease metadata on the generated Work Out key.
- Skip locked tracks and keyframes that are already after Work Out.

The command is idempotent. Running it multiple times updates the same Work Out
key instead of creating duplicate keyframes.

## Architecture

- `Source/src/animation/timelineEditing.ts` owns the pure document operation in
  `holdResolvedKeyframesToWorkOut`.
- `Source/src/main.ts` owns Undo history, runtime rebuild, timeline refresh,
  and command registration.
- `Source/src/ui/timelinePanel.ts` exposes the button through the existing
  callback boundary.
- `Source/src/ui/template.ts` places the `Freeze` button beside other keyframe
  assistants.

This keeps document mutation out of the DOM layer and reuses the same playback,
motion-path, save/load, and Undo flows as the rest of the timeline editor.

## Validation

- TypeScript typecheck.
- Production build.
- `tests/timeline-hold-work-out.spec.ts` creates Position keys, clicks the
  visible `Freeze` button, saves the scene JSON, and verifies:
  - the source key becomes `hold`;
  - a Work Out key is created;
  - the Work Out key keeps the frozen value;
  - startup emits no console errors.
