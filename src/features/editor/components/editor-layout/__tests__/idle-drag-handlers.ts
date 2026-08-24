import type { NodeDragHandlers } from "@/features/canvas";

/**
 * 何も掴んでいない状態のポインタの受け口。
 * 器の見た目（ペインの割り付け・幅）はドラッグに依らないので、器のテストはこれを渡す。
 */
export const IdleDragHandlers: NodeDragHandlers = {
  onPointerMove: () => {},
  onPointerUp: () => {},
  onPointerLeave: () => {},
};
