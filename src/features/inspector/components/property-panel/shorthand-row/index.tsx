import { type ReactElement, useId, useState } from "react";
import type { PropEdit } from "@/domains/node";
import {
  type PropControl,
  PropPairControl,
  PropShorthandControl,
} from "@/domains/prop-control";
import type { Side, SidePair } from "@/domains/side";
import { CaseStyle } from "@/utils/CaseStyle";
import { LabelWidthClass } from "../label-width";
import { fieldOf, PropField, pairFieldOf } from "../prop-field";

/**
 * 半幅セルの左に出す辺の頭文字（UI 案 docs/Design Composer.html の `T` / `R` / `B` / `L`）。
 * 辺を足して頭文字を足し忘れると、ここがコンパイルエラーになる。
 *
 * 見える側だけの手がかりなので（読み上げ名は別に持つ）、**消えても気づける手段は
 * Storybook の視覚差分だけ**（happy-dom は `aria-hidden` の字面を検査できない）。
 */
const SideGlyphs = {
  top: "T",
  right: "R",
  bottom: "B",
  left: "L",
} as const satisfies Readonly<Record<Side, string>>;

/**
 * 畳んだ欄の左に出す頭文字。UI 案は畳んだ状態を描いていないので、
 * 同じ行の辺の頭文字と同じ流儀（1 文字）で決めた。
 * 消えても気づける手段は `SideGlyphs` と同じく視覚差分だけ。
 */
const SidePairGlyphs = {
  vertical: "V",
  horizontal: "H",
} as const satisfies Readonly<Record<SidePair, string>>;

/** 束ねた行が出す綴り。テストとストーリーが同じ綴りを書き写さずに済むよう公開する。 */
export const ShorthandLabels = {
  /** 4 辺を個別に出すかを切り替えるボタン。押されている間は 4 辺が出る。 */
  perEdge: "辺ごと",
} as const;

/**
 * 束ねた行の半幅セル 1 つ分の器。
 *
 * 見える文字は 1 文字（`T`）で、辺の綴りは読み上げ専用に別途置く。1 文字だけでは
 * どの辺かが読み上げから分からず、UI 案の半幅セルには綴りを置く幅が無いため。
 *
 * @returns 頭文字と入力欄を横に並べたセル
 */
function ShorthandCell({
  glyph,
  labelId,
  label,
  children,
}: Readonly<{
  glyph: string;
  labelId: string;
  label: string;
  children: ReactElement;
}>): ReactElement {
  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <span aria-hidden className="shrink-0 text-[10px] text-gray-400">
        {glyph}
      </span>
      <span id={labelId} className="sr-only">
        {label}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

/*
 * セルの読み上げ名は**行の見出し + 自分の辺**で組み立てる（`Padding` + `Right`）。
 * 行の見出しを指す id を繋いでいるので、見出しを消すと読み上げ名も欠ける
 * （束ねた行の可視ラベルが誰にも見られていない状態を作らない）。
 * shorthand 名をセルごとに組み立て直さずに済むのも同じ理由。
 */

/**
 * 1 辺分のセル。
 *
 * @returns 辺の頭文字とその辺の入力欄を並べたセル
 */
function ShorthandSideCell({
  side,
  rowLabelId,
  control,
  onEdit,
}: Readonly<{
  side: Side;
  rowLabelId: string;
  control: PropControl;
  onEdit: (edit: PropEdit) => void;
}>): ReactElement {
  const labelId = useId();

  return (
    <ShorthandCell
      glyph={SideGlyphs[side]}
      labelId={labelId}
      label={CaseStyle.toCapitalCase(side)}
    >
      <PropField
        field={fieldOf(`${rowLabelId} ${labelId}`, control, onEdit)}
        input={control.input}
        resolvedValuePlacement="below"
      />
    </ShorthandCell>
  );
}

/**
 * 畳んだ 1 欄分のセル。
 *
 * @returns 組の頭文字と、2 辺へまとめて書く入力欄を並べたセル
 */
function ShorthandPairCell({
  pair,
  rowLabelId,
  onEdit,
}: Readonly<{
  pair: PropPairControl;
  rowLabelId: string;
  onEdit: (edit: PropEdit) => void;
}>): ReactElement {
  const labelId = useId();

  return (
    <ShorthandCell
      glyph={SidePairGlyphs[pair.pair]}
      labelId={labelId}
      label={CaseStyle.toCapitalCase(pair.pair)}
    >
      <PropField
        field={pairFieldOf(`${rowLabelId} ${labelId}`, pair, onEdit)}
        input={PropPairControl.input(pair)}
        resolvedValuePlacement="below"
      />
    </ShorthandCell>
  );
}

/**
 * 4 辺を 1 行にまとめた行（UI 案 docs/Design Composer.html の `padding`）。
 * 半幅セルを 2 列のグリッドに詰めるところまで UI 案と同じ。
 *
 * 既定を畳んだ 2 欄にするのは Figma と同じ形にするため（#230）。UI 案は
 * 4 辺の状態しか描いていないので、切り替えボタンの見た目はここで決めている。
 *
 * 切り替えを `useState` で持つのは、畳んでいるかがドキュメントではなく画面の状態
 * だから（docs/03「畳み方は表示の都合なので持たない」）。道具の状態であって
 * ノードの状態ではないので、**同じ行が出続ける間（Box 系を選び直す間）は残る**
 * （`groups-body` の `rowKey` が行の `key` に shorthand 名を返すため）。この行を
 * 持たない Text を選ぶと行ごと消えるので、戻ったときは畳んだ状態から始まる。
 *
 * @returns ラベルと切り替えボタン、右に半幅セルのグリッドを並べた 1 行
 */
export function ShorthandRow({
  shorthand,
  onEdit,
}: Readonly<{
  shorthand: PropShorthandControl;
  onEdit: (edit: PropEdit) => void;
}>): ReactElement {
  const rowLabelId = useId();
  const [isPerEdge, setIsPerEdge] = useState(false);

  return (
    <div className="flex items-start gap-2">
      <div
        className={`${LabelWidthClass} flex flex-col items-start gap-1 text-[11px] text-gray-500`}
      >
        <span id={rowLabelId} className="max-w-full truncate">
          {CaseStyle.toCapitalCase(shorthand.name)}
        </span>
        <button
          type="button"
          aria-pressed={isPerEdge}
          onClick={() => setIsPerEdge((current) => !current)}
          className="rounded border border-gray-300 px-1 py-0.5 text-[10px] text-gray-500 aria-pressed:border-gray-400 aria-pressed:bg-gray-100 aria-pressed:text-gray-900"
        >
          {ShorthandLabels.perEdge}
        </button>
      </div>
      <div className="grid min-w-0 flex-1 grid-cols-2 gap-1.5">
        {isPerEdge
          ? PropShorthandControl.sides(shorthand).map((side) => (
              <ShorthandSideCell
                key={side.side}
                side={side.side}
                rowLabelId={rowLabelId}
                control={side.control}
                onEdit={onEdit}
              />
            ))
          : PropShorthandControl.pairs(shorthand).map((pair) => (
              <ShorthandPairCell
                key={pair.pair}
                pair={pair}
                rowLabelId={rowLabelId}
                onEdit={onEdit}
              />
            ))}
      </div>
    </div>
  );
}
