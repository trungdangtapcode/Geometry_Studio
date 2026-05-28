# Timeline Resizable Dock

## Purpose

The timeline dock needs to work as a real editing surface, not only as a compact
control strip. The bottom dock is now taller by default and can be resized from
its top edge.

## Behavior

- Drag the small handle at the top of the timeline dock upward to increase
  timeline height.
- Drag downward to reduce it.
- Double-click the handle to reset to the density-specific default height.
- The chosen height is persisted in local storage.
- Collapsing the dock hides the resize handle and restores the compact collapsed
  state.

## Layout Rules

- The dock keeps density-specific control sizes for Blender, Compact, and
  Comfortable modes.
- The timeline canvas row height is read from the same CSS variables as the left
  track labels, so key rows and labels stay aligned.
- The timeline canvas and left labels synchronize vertical scrolling.
- Focus row filtering shows selected-object rows plus already-keyed rows, while
  camera and light rows appear when they are keyed or active. This prevents the
  timeline from opening with every possible global row crowding the key area.

## Testing

The Playwright smoke workflow verifies:

- The resize handle is visible.
- Dragging the handle increases the dock height.
- Animation preset buttons create visible keyframes in the timeline.
- Focus and Keyed row filters still expose the expected rows.
