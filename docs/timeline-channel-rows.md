# Timeline Channel Rows

## Purpose

Channel rows expose vector-valued timeline tracks as editable per-channel rows.
This brings the dope sheet closer to After Effects and Blender: users can focus
on one channel, inspect one value graph, and key or edit a single component
without mentally unpacking a three-number vector.

## Expanded Tracks

- Object Position, Rotation, and Scale use `X`, `Y`, and `Z` rows.
- Object Color uses `R`, `G`, and `B` rows.
- Texture Repeat and Texture Offset use `U` and `V` rows.
- Camera Position and Camera Target use `X`, `Y`, and `Z` rows.
- Camera Lens uses `FOV`, `Near`, and `Far` rows.
- Directional, point, and spot light Position use `X`, `Y`, and `Z` rows.
- Directional, point, and spot light Color use `R`, `G`, and `B` rows.

Scalar tracks such as Opacity, Roughness, Metalness, Visibility, Texture
Rotation, and light Intensity stay as single rows.

## Behavior

- Row labels use channel-aware names such as `Texture Repeat U`, `Camera Lens
  FOV`, and `Sun Color B`.
- Selecting a channel row focuses the keyframe editor and value graph on that
  channel.
- Row diamond buttons still create or update the underlying vector keyframe, so
  scene JSON remains compact and compatible with the existing runtime evaluator.
- Row search matches channel labels, making queries such as `texture repeat u`
  and `camera lens near` precise in dense scenes.
- Visible-row operations still deduplicate by target and track, so expanded
  rows do not accidentally count the same vector keyframe multiple times.

## Testing

The Playwright channel-row workflow switches to `All Rows`, verifies object,
texture, camera, and light channel labels, keys the camera FOV channel, confirms
the focused keyframe editor and value graph state, and verifies row search can
isolate the `Texture Repeat U` channel.
