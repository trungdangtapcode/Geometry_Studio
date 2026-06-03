# Timeline Paste Rev Button

## Purpose

`Paste Rev` exposes reversed keyframe paste as a visible toolbar workflow. This
keeps an After Effects-style clipboard operation discoverable beside normal
`Paste` and `Paste Insert`.

## Behavior

- Requires copied timeline keyframes.
- Pastes at the playhead.
- Reverses timing inside the copied span.
- Preserves keyframe values, interpolation, and ease metadata.
- Uses the existing `timeline.paste-reverse` command handler.

Example:

| Copied timing/value | Paste Rev at `4s` |
| --- | --- |
| `0s x=1`, `2s x=5` | `4s x=5`, `6s x=1` |

## Architecture

- `Source/src/ui/template.ts` adds the `Paste Rev` toolbar button.
- `Source/src/ui/timelinePanel.ts` enables and labels it through the same
  clipboard state used by `Paste` and `Paste Insert`.
- `Source/src/main.ts` routes the button through `pasteReverseTimelineKeyframes`.
- The actual reverse logic remains in `reverseTimelineClipboard`.

## Validation

`tests/timeline-paste-reverse.spec.ts` copies two Position keys, clicks
`Paste Rev`, saves JSON, and verifies the pasted keys have reversed timing and
preserved values.
