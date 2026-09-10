import { useState } from "react";
import type { IndexMove } from "@/types/IndexMove";
import { ReorderDrag } from "@/utils/ReorderDrag";

/** 行に配る props。掴む口と、ポインタが入ったことを伝える口。 */
export type RowProps = Readonly<{
  onPointerDown: () => void;
  onPointerEnter: () => void;
}>;

/** 並びの器（`<ul>`）に配る props。離した／並びの外へ出たことを受ける。 */
type GroupProps = Readonly<{
  onPointerUp: () => void;
  onPointerLeave: () => void;
}>;

/**
 * 1 つの並びの中でのドラッグによる並べ替え。状態と遷移は `ReorderDrag` が持ち、ここは今
 * の状態を保つのと、行と器へ配るハンドラを組み立てるだけ。
 *
 * **並びごとに 1 回呼ぶ。** ツリーのように入れ子になっている場合は階層ごとに別々に呼ぶ。
 * 掴んだ群だけが落ちる先を持つので、別の親の行の上で離しても移動が起きない。
 *
 * 位置は並びの中の index だけで扱い、「その並びが何の並びか」は呼び出し側が足す。ここが
 * 持つと位置の形が消費側ごとに違うぶんジェネリクスが要る。
 *
 *   @param onReorder 離したときに起きた移動を伝える先
 *   @returns 今の状態と、行・器へ配る props
 */
export function useReorderDrag(onReorder: (move: IndexMove) => void): {
  drag: ReorderDrag;
  rowProps: (index: number) => RowProps;
  groupProps: () => GroupProps;
} {
  const [drag, setDrag] = useState<ReorderDrag>(ReorderDrag.create);

  return {
    drag,
    rowProps: (index) => ({
      onPointerDown: () => setDrag(ReorderDrag.grab(index)),
      onPointerEnter: () =>
        setDrag((current) => ReorderDrag.enter(current, index)),
    }),
    groupProps: () => ({
      onPointerUp: () => {
        const move = ReorderDrag.releasedMove(drag);
        if (move.some) {
          onReorder(move.value);
        }
        setDrag(ReorderDrag.create());
      },
      /*
       * 並びの外で離されると離した通知が届かないので、出た時点で取り消す。
       * ポインタを捕捉（`setPointerCapture`）しないのは、捕捉すると入った行が
       * 読めなくなり落ちる先が決まらなくなるため（`useNodeDrag` と同じ理由）。
       */
      onPointerLeave: () => setDrag(ReorderDrag.create()),
    }),
  };
}
