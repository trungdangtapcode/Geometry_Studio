# Timeline Visible Time Status

## Purpose

The timeline timecode includes a live visible-key count, for example
`00:00:01 | F0030 | 3 visible keys`. This makes pose-column commands easier to
predict before using `Copy Time`, `Cut Time`, `Dup Time`, or `Del Time`.

## Behavior

- The count respects the current row filter and row search.
- The count updates when the playhead moves, when row filters change, and when
  keyframes are added, pasted, cut, duplicated, or deleted.
- The same snap-aware tolerance used by `Select Time` determines whether a
  keyframe is considered to be at the playhead.
- The count is informational only; it does not change the current selection.

## Workflow

1. Filter or search the timeline to the property group being edited.
2. Move the playhead to a pose column.
3. Read the visible-key count in the timecode.
4. Use a visible-time command only when the count matches the intended pose
   column size.

This reduces accidental pose-column edits because the editor shows how many
filtered rows will be affected before the command runs.
