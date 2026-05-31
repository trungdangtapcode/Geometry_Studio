# Timeline Layer Groups

## Purpose

Dense object, camera, and light tracks need a fast way to reduce visual noise.
After Effects solves this with disclosure rows for each layer. Geometry Studio
now follows that pattern by rendering object, camera, and light group rows above
their editable property tracks.

## Behavior

- Click an object, camera, or light group row to select that timeline target.
- Double-click an object group row, or focus it and press `F2`, to rename the
  object directly from the timeline. `Enter` commits and `Escape` cancels.
- Click the small box/diamond control on an object group row to record a full
  Position, Rotation, and Scale pose key at the playhead for that object.
- Click the disclosure control on a group row to collapse or expand its tracks.
- `Alt`-click a disclosure control to collapse all groups or expand all groups,
  matching the clicked group's next state.
- With keyboard focus on a group row, `Enter` / `Space` selects the target,
  `Left Arrow` collapses it, and `Right Arrow` expands it.
- Command Palette actions `Collapse Timeline Groups` and `Expand Timeline
  Groups` apply the same operation without using the mouse.
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

The public `collapseAllTimelineGroups()` and `expandAllTimelineGroups()` panel
methods are exposed through the app command palette. Disclosure `Alt` clicks
call the same shared state path, so bulk disclosure behavior stays consistent.

Timeline group rename uses the same object rename callback as the inspector, so
the object root, outliner, inspector, timeline labels, scene JSON, and undo
history all stay on one naming path.

Timeline group pose keying uses the same transform-key command as the toolbar
`Set Pose` action. The panel passes the object id to the editor shell, and
`main.ts` selects that object, captures its current Position, Rotation, and
Scale values, writes or updates the three transform tracks at the playhead, and
selects the created keyframes for immediate retiming.

The implementation does not replace `animation-timeline-js`; it uses the
existing row model and adds a lightweight grouping layer around it.

## Validation

Automated browser coverage lives in
`Source/tests/timeline-group-collapse.spec.ts`. The test verifies that an object
group can be collapsed, its property rows disappear, row search reveals matching
properties, clearing search restores the collapse state, row clicks select the
target without collapsing it, object groups can be renamed in place, object
group pose keying creates three selected transform keys, `Alt`-click collapses
all groups, the Command Palette expands all groups, and the state persists after
reload.
