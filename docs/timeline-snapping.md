# Timeline Landmark Snapping

## Status

Timeline snapping now uses authored timing landmarks in addition to the frame
grid. This matches the way After Effects users expect timing edits to lock onto
meaningful beats instead of only numerical intervals.

When Snap is enabled, these interactions can snap to nearby landmarks:

- Current Time Indicator dragging.
- Marker dragging.
- Work In/Out edge dragging and work-area body moves.
- Layer In/Out edge dragging and layer body moves.

## Snap Targets

The shared `ui/timelineSnapping.ts` module collects targets from:

- timeline start and duration end,
- Work In and Work Out,
- timeline markers,
- object, camera, and light keyframes,
- object layer range boundaries when the caller enables layer-range targets.

Track keyframes from disabled or locked tracks are ignored so hidden or protected
timing does not unexpectedly attract edits.

## Runtime Rules

- If Snap is disabled, edits use raw rounded time.
- If Snap is enabled and a nearby landmark is inside the snap tolerance, the edit
  uses that landmark.
- If no landmark is close enough, the edit falls back to the existing snap-step
  grid.
- Dragging a marker ignores its own original time so it can move away cleanly
  while still snapping to other markers and keyframes.
- Layer range drags ignore their own original boundary where appropriate so a
  small move is not trapped by the starting edge.

## Testing

Playwright covers landmark snapping through the draggable playhead workflow:

1. Add a marker at `2.25s`.
2. Set Snap to `0.5s`, where grid-only snapping would choose `2.5s`.
3. Drag the Current Time Indicator to the marker position.
4. Verify the current time snaps to `2.25s`.

Manual check:

1. Add two markers at off-grid times.
2. Enable Snap and use a coarse Snap value such as `0.5`.
3. Drag the playhead, a marker, the work-area edge, and a layer edge near the
   off-grid marker.
4. Confirm the edit lands on the marker instead of the nearest grid interval.
