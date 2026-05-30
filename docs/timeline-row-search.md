# Timeline Row Search

## Purpose

Timeline row search is an AE-style workflow improvement for dense scenes. Once
objects, camera tracks, light tracks, material tracks, and texture tracks are all
available, row filtering alone is not enough. Search gives the user a fast way
to isolate relevant rows without changing object selection.

## Behavior

- The search field lives beside the Focus / Keyed / All row filter.
- Typing a query shows matching object, camera, and light rows.
- Matches include object name, row label, track kind, and axis name.
- Search temporarily widens the row source so camera/light rows can be found
  even when the row filter is set to Focus Rows.
- `Ctrl+F` / `Cmd+F` focuses the timeline row search field.
- `Escape` clears the search field and restores the normal row filter view.
- Property reveal shortcuts fill search automatically for common AE-style
  targets: `Alt+P` Position, `Alt+R` Rotation, `Alt+S` Scale, and `Alt+T`
  Opacity.
- The search text is stored in `localStorage` as an editor preference.

## Architecture

The feature is contained inside `Source/src/ui/timelinePanel.ts`:

- `rowSearchText` stores the active query.
- `visibleEntries()` and `visibleTrackKinds()` widen to all rows while search is
  active.
- `filteredRowDescriptors()` applies the query to object axis rows.
- Camera and light row generation use the same matching predicate.

No scene JSON migration is required because row search is a UI preference, not
project data.

## Validation

The core Playwright smoke test focuses search with `Ctrl+F`, filters to camera
rows, filters to a light intensity row, verifies the empty state, then clears
search with `Escape`. The property reveal coverage verifies that keyboard and
Command Palette reveal commands update active track and search state together.
