# Timeline Paste Rev Insert

`Rev Insert` combines two timeline edit operations:

1. Reverse the copied keyframe block inside its copied timing span.
2. Insert the reversed block at the playhead by shifting later destination keys
   forward before writing the pasted keys.

This is useful when a user wants a copied motion to play backward but does not
want to overwrite the existing keyframes that already occur after the paste
point.

## User Workflow

1. Select keyframes on the active track.
2. Copy them with `Ctrl+C` or the `Copy` button.
3. Move the playhead to the destination time.
4. Click `Rev Insert`, or run `Paste Reversed Insert Keyframes` from the command
   palette.

Example: copied Position keys at `0s` and `2s` with values `1` and `5`, pasted
with `Rev Insert` at `4s`, become:

| Time | Value |
| --- | --- |
| `4s` | copied `2s` value |
| `6s` | copied `0s` value |

Any compatible destination key at or after `4s` shifts forward by `2s`.

## Implementation

- `Source/src/main.ts` exposes `pasteReverseInsertTimelineKeyframes()`, which
  calls the shared paste engine with `{ reverse: true, insert: true }`.
- `Source/src/ui/template.ts` adds the `Rev Insert` timeline toolbar button.
- `Source/src/ui/timelinePanel.ts` wires the button into the same clipboard
  availability state as `Paste`, `Paste Insert`, and `Paste Rev`.
- The command palette entry is `Paste Reversed Insert Keyframes`.

This avoids a separate timeline mutation path. Normal paste, insert paste,
reverse paste, and reverse insert paste all flow through the same clipboard
validation and scene history behavior.

## Validation

`tests/timeline-paste-reverse-insert.spec.ts` copies two Position keys, creates
a later destination key, runs `Rev Insert`, saves the scene JSON, and verifies
that:

- pasted keys appear in reversed timing order,
- the later destination key shifts forward by the copied block duration,
- no startup console errors are emitted.
