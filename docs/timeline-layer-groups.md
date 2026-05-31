# Timeline Layer Groups

## Purpose

Dense object, camera, and light tracks need a fast way to reduce visual noise.
After Effects solves this with disclosure rows for each layer. Geometry Studio
now follows that pattern by rendering object, camera, and light group rows above
their editable property tracks.

## Behavior

- Click an object, camera, or light group row to collapse or expand its tracks.
- Collapsed groups keep their summary row visible and hide their property rows.
- The group row shows target type, visible row count, and total keyframe count.
- Collapse state is stored as a local editor preference.
- Timeline row search temporarily reveals matching rows even if their group is
  collapsed, so search remains a reliable way to find hidden properties.

## Implementation

`Source/src/ui/timelinePanel.ts` keeps a local `Set<string>` of collapsed group
ids. Rendering inserts one group row into both the HTML label column and the
`animation-timeline-js` row model, preserving vertical alignment between labels
and the canvas. Property rows are omitted from both sides while collapsed.

The implementation does not replace `animation-timeline-js`; it uses the
existing row model and adds a lightweight grouping layer around it.

## Validation

Automated browser coverage lives in
`Source/tests/timeline-group-collapse.spec.ts`. The test verifies that an object
group can be collapsed, its property rows disappear, row search reveals matching
properties, clearing search restores the collapse state, and the state persists
after reload.
