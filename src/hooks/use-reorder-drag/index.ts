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
 * 1 つの並びの中でのドラッグによる並べ替え。
 *
 * 状態と遷移は `ReorderDrag` が持ち、ここは `useState` で今の状態を保つのと、
 * 行と器へ配るハンドラを組み立てるだけ（rules/hooks.md「hooks はドメイン
 * ロジックを持たない」）。JSX は返さない（rules/components.md「headless 原則」）。
 *
 * **並びごとに 1 回呼ぶ。** ツリーのように入れ子になっている場合は、階層（＝ 1 つの
 * 親の子の並び）ごとに別々に呼ぶ。こうすると掴んだ群だけが落ちる先を持ち、
 * 入れ子の群は掴んでいない状態のままなので、**別の親の行の上で離しても移動が
 * 起きない**（同じ親の中の並べ替えしか作れない）。
 *
 * 位置は並びの中の index だけで扱う。ツリーの `parentName` のような「その並びが
 * 何の並びか」は呼び出し側が足す。ここが持つと、位置の形が消費側ごとに違う
 * （ツリーは親の名前つき / artboard は index だけ）ぶんジェネリクスが要る。
 *
 * @param onReorder 離したときに起きた移動を伝える先
 * @returns 今の状態と、行・器へ配る props
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
