# Timeline Layer Visibility

## Purpose

Selected layer visibility is the editor-level hide/show workflow for an object
layer. It matches the common After Effects idea of hiding a layer from the
composition view, while remaining separate from keyed timeline track switches.

## Controls

| Action | Control |
| --- | --- |
| Toggle selected layer visibility | Command Palette `Toggle Selected Layer Visibility` |
| Toggle selected layer visibility shortcut | `Alt+V` |
| Isolate selected object layer | Command Palette `Isolate Selected Layer Visibility` |
| Isolate selected object layer shortcut | `Alt+Shift+V` |
| Show every hidden object layer | Command Palette `Show All Object Layers` |
| Inspector checkbox | `Material > Visible` |

When a layer is hidden, the outliner row and timeline group row become faded
and crossed out. The group row also shows `Hidden` beside its row/key count.

## Behavior

- Visibility is stored on the object root, so it affects the viewport, render
  view, saved scene JSON, loaded scene JSON, and duplicated objects.
- The command records undo history before changing visibility.
- Hidden objects remain selectable from the Outliner and Timeline so they can
  be shown again without needing viewport picking.
- `Show All Object Layers` only changes object root visibility. It does not
  unlock tracks, unmute tracks, remove shy flags, or clear keyframes.
- `Isolate Selected Layer Visibility` makes the selected object layer visible
  and hides every other object layer. It is useful for screenshots and dense
  scene editing. Use `Undo` to restore the exact previous visibility mix, or
  use `Show All Object Layers` to make every object layer visible.

## Difference From Other Timeline Switches

| Switch | What It Controls |
| --- | --- |
| Layer visibility | Object root visibility in the viewport/render |
| Visibility track | Keyframed show/hide over time |
| Layer enable switch | Mutes or enables all keyed tracks on that object |
| Layer solo switch | Solos keyed tracks for playback evaluation |
| Layer shy switch | Hides timeline row clutter without changing the object |
| Isolate selected layer visibility | One-command viewport/render cleanup using object root visibility |

If an object has a keyed `Visibility` track, timeline playback can override the
static layer visibility at the current playhead time. Use the static layer
visibility command for quick scene organization, and use the `Visibility` track
when visibility must animate.

## Test Coverage

`Source/tests/timeline-layer-visibility.spec.ts` verifies:

- Command Palette toggle hides the selected layer.
- `Alt+V` shows it again.
- `Isolate Selected Layer Visibility` hides every non-selected object layer.
- `Alt+Shift+V` runs the isolation shortcut.
- Timeline and Outliner rows display hidden-layer state.
- Saved scene JSON preserves `visible: false`.
- `Show All Object Layers` restores hidden object layers.
