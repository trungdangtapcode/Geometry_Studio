export type LayerOrderMove = "up" | "down" | "top" | "bottom";

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

function targetLayerIndex(index: number, count: number, move: LayerOrderMove): number {
  if (move === "up") return Math.max(0, index - 1);
  if (move === "down") return Math.min(count - 1, index + 1);
  if (move === "top") return 0;
  return count - 1;
}
