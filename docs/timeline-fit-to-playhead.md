# Timeline Fit To Playhead

`Fit CTI` is a retiming command for the common motion-graphics workflow:
"make this selected animation end here."

CTI means current time indicator, the playhead in the timeline.

## User Workflow

1. Select at least two keyframes.
2. Move the playhead to the desired end time.
3. Click `Fit CTI`, or run `Fit Keyframes To Playhead` from the command
   palette.

The earliest selected keyframe stays fixed. The latest selected keyframe moves
to the playhead. Any selected keyframes between them keep their proportional
timing.

Example:

| Before | After fitting to `6s` |
| --- | --- |
| `0s`, `2s`, `4s` | `0s`, `3s`, `6s` |

## Rules

- Requires at least two selected keyframes.
- The playhead must be after the first selected keyframe.
- Locked tracks are not edited.
- The command uses the same history, snapping, collision handling, and runtime
  rebuild path as the other timeline retime commands.

## Implementation

- `Source/src/ui/template.ts` adds the `Fit CTI` toolbar button.
- `Source/src/ui/timelinePanel.ts` wires the button into the selected-keyframe
  action surface.
- `Source/src/main.ts` exposes `timeline.fit-playhead` and calls
  `fitResolvedKeyframesToRange()` with the selected range start and current
  playhead time.

## Validation

`tests/timeline-fit-playhead.spec.ts` creates three Position keys at `0s`,
`2s`, and `4s`, selects them, moves the playhead to `6s`, clicks `Fit CTI`,
saves scene JSON, and verifies that the resulting key times are `0s`, `3s`,
and `6s`.
