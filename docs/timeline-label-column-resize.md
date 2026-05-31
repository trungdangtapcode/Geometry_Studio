# Timeline Label Column Resize

## Purpose

After Effects and other timeline editors let users allocate more space to layer
names and property controls when scenes become dense. Geometry Studio now makes
the left timeline label column resizable instead of fixed-width.

## Behavior

- Drag the vertical handle between the label column and the dope sheet to resize
  the label column.
- Double-click the handle to reset to the density-specific default width.
- Focus the handle and press `Left Arrow` / `Right Arrow` to resize by keyboard.
- Hold `Shift` with the arrow keys for larger width steps.
- Press `Home` on the handle to reset and `End` to expand to the maximum width.
- The chosen width is stored in local storage and restored on reload.
- The same CSS variable drives the overview, graph editor, label column, and
  dope sheet layout, keeping all vertical timeline regions aligned.

## Architecture

`Source/src/ui/timelinePanel.ts` owns the label width preference as editor UI
state. The implementation sets `--timeline-track-label-width` on the timeline
dock, so existing CSS grid layouts continue to define the actual presentation.

The resize logic mirrors the existing timeline dock-height resize path:

- pointer drag updates the CSS variable live;
- pointer release stores the final width;
- double-click clears the stored width;
- window resize clamps stored widths to the available dock width.

Scene JSON is unchanged because label width is a user preference, not project
data.

## Validation

Automated browser coverage lives in
`Source/tests/timeline-label-resize.spec.ts`. The test verifies pointer resizing,
and local-storage persistence after reload.
