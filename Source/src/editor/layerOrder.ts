export type LayerOrderMove = "up" | "down" | "top" | "bottom";
export type LayerSelectDirection = "previous" | "next";

export interface LayerOrderResult<T> {
  items: T[];
  moved: boolean;
  fromIndex: number;
  toIndex: number;
}

export function reorderLayerItems<T extends { id: string }>(items: T[], id: string, move: LayerOrderMove): LayerOrderResult<T> {
  const fromIndex = items.findIndex((item) => item.id === id);
  if (fromIndex === -1 || items.length < 2) {
    return { items, moved: false, fromIndex, toIndex: fromIndex };
  }

  const toIndex = targetLayerIndex(fromIndex, items.length, move);
  if (toIndex === fromIndex) {
    return { items, moved: false, fromIndex, toIndex };
  }

  const nextItems = [...items];
  const [item] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, item);
  return { items: nextItems, moved: true, fromIndex, toIndex };
}

export function adjacentLayerId<T extends { id: string }>(items: T[], id: string, direction: LayerSelectDirection): string | null {
  const index = items.findIndex((item) => item.id === id);
  if (index === -1 || items.length < 2) return null;
  const nextIndex = direction === "previous" ? index - 1 : index + 1;
  return items[nextIndex]?.id ?? null;
}

function targetLayerIndex(index: number, count: number, move: LayerOrderMove): number {
  if (move === "up") return Math.max(0, index - 1);
  if (move === "down") return Math.min(count - 1, index + 1);
  if (move === "top") return 0;
  return count - 1;
}
