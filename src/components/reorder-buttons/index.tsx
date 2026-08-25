import type { ReactElement } from "react";
import { Option } from "@/utils/Option";
import { Range } from "@/utils/Range";

/**
 * 並びの中のどこにいるか。
 * 位置と並びの長さは片方だけでは動かせる向きが決まらないため 1 つの型にまとめる。
 */
export type ListPlacement = Readonly<{
  /** 並びの中での位置（0 始まり）。 */
  index: number;
  /** 並びに入っているものの数。 */
  count: number;
}>;

/**
 * 並びに収まる移動先だけを返す（端では隣がいないので `none`）。
 *
 * @param placement 今の位置と並びの長さ
 * @param step 動かす向きと段数（上へ 1 つなら -1）
 * @returns 並びに収まる移動先の位置。端で収まらなければ `none`
 */
function moveTargetIndex(
  placement: ListPlacement,
  step: number,
): Option<number> {
  const toIndex = placement.index + step;
  return Range.contains({ min: 0, max: placement.count - 1 }, toIndex)
    ? Option.some(toIndex)
    : Option.none;
}

/**
 * 1 つ分だけ順序を動かすボタン。
 *
 * @returns 押すと 1 つ分の移動を起こすボタン
 */
function ReorderButton({
  label,
  symbol,
  onClick,
}: Readonly<{
  label: string;
  symbol: string;
  onClick: () => void;
}>): ReactElement {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="rounded border border-gray-300 px-1 text-gray-600 text-xs hover:bg-gray-100"
    >
      {symbol}
    </button>
  );
}

/**
 * 並びの中で 1 つ分だけ順序を動かすボタンの対。
 * 隣がいない向きはボタン自体を出さず、並びの外を指す移動を画面から作れなくする。
 *
 * 何の並びかは持たない（ツリーの兄弟でも artboard の一覧でも同じ形なので、
 * 器のほうを 1 つにしてある）。移動先をどう解釈するか——同じ親の中の位置なのか、
 * ドキュメントが持つ artboard の並びの位置なのか——は呼び出し側が決める。
 *
 * @returns 動かせる向きのぶんだけボタンを並べた枠。両端では 1 つ、
 *   並びに 1 つしか無ければ空
 */
export function ReorderButtons({
  name,
  placement,
  onMove,
}: Readonly<{
  /** 動かす対象の名前。読み上げ名に出る。 */
  name: string;
  placement: ListPlacement;
  /** 動かす先の位置を伝える。 */
  onMove: (toIndex: number) => void;
}>): ReactElement {
  const toPrevious = moveTargetIndex(placement, -1);
  const toNext = moveTargetIndex(placement, 1);

  return (
    <span className="flex shrink-0 items-center gap-1">
      {toPrevious.some ? (
        <ReorderButton
          label={`${name} を上へ`}
          symbol="↑"
          onClick={() => onMove(toPrevious.value)}
        />
      ) : null}
      {toNext.some ? (
        <ReorderButton
          label={`${name} を下へ`}
          symbol="↓"
          onClick={() => onMove(toNext.value)}
        />
      ) : null}
    </span>
  );
}
