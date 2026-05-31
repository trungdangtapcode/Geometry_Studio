# Timeline Selected Key Boundaries

## Status

Implemented as an AE-style navigation helper for dense keyframe editing. It does
not change the scene schema because it only moves the playhead to existing
selected keyframe times.

## User-Facing Behavior

- The transport cluster includes First Selected Keyframe and Last Selected
  Keyframe buttons.
- `Shift+Home` jumps the playhead to the earliest selected keyframe.
- `Shift+End` jumps the playhead to the latest selected keyframe.
- The timeline selection readout shows the selected range and span, for example
  `4 keyframes selected | 1-5s | span 4s`.
- If no keyframes are selected, the editor shows a toast instead of changing
  time.
- Plain `Home` and `End` remain mapped to Work In and Work Out.
- The command uses the current selection across resolved timeline keyframe
  sources, so grouped keys and axis-row selections work with the same selection
  model used by nudge, fit, rove, distribute, and reverse.

## Design Rationale

Professional timeline editing often alternates between range operations and
boundary checks. After selecting a block of keys, the user needs to confirm the
first pose, last pose, and interpolated motion without manually scrubbing. This
feature keeps that workflow direct:

1. Select a keyframe range.
2. Jump to the first selected key to inspect the start pose.
3. Jump to the last selected key to inspect the ending pose.
4. Scrub or play between those bounds.

The shortcut uses `Shift+Home` and `Shift+End` instead of `Alt+Home` and
`Alt+End` because `Alt+Home` is commonly reserved by browsers for homepage
navigation. Avoiding browser-reserved keys makes the editor more reliable in
static-server, Playwright, and classroom-evaluation environments.

## Implementation Notes

The UI layer declares a dedicated callback:

```ts
onStepSelectedKeyBoundary(direction: -1 | 1): void
```

`ui/timelinePanel.ts` owns the button event binding and delegates the command to
`main.ts`. `main.ts` resolves selected keyframe IDs with
`resolveActiveTimelineKeyframeSources`, calculates the minimum or maximum
selected time, then calls `setTimelineTime`.

No command history entry is created because the command only moves the
playhead. It does not mutate scene data.

## Testing

Automated coverage verifies:

- The first/last selected keyframe buttons are visible in the core smoke test.
- A selected Work In/Out keyframe range can jump to its first boundary by
  toolbar button.
- The same selected range can jump to its last boundary by toolbar button.
- `Shift+Home` and `Shift+End` perform the same boundary jumps.

Manual check:

1. Create four Position keys at `0`, `1`, `3`, and `5` seconds.
2. Set Work In to `1` and Work Out to `3`.
3. Select Work Area.
4. Press First Selected Keyframe and confirm the time is `1`.
5. Press Last Selected Keyframe and confirm the time is `3`.
6. Repeat with `Shift+Home` and `Shift+End`.
