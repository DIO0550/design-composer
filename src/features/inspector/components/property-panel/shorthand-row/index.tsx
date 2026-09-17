import { type ReactElement, useId, useState } from "react";
import type { PropEdit } from "@/domains/dcmp/node";
import type { ShorthandName } from "@/domains/dcmp/primitive-schema";
import type { EditContinuity } from "@/domains/session/edit-continuity";
import {
  PropCollapsedControl,
  type PropLonghandControl,
  PropShorthandControl,
} from "@/domains/session/prop-control";
import type { Corner } from "@/domains/unit/corner";
import type { Side, SidePair } from "@/domains/unit/side";
import { CaseStyle } from "@/utils/CaseStyle";
import { LabelWidthClass } from "../label-width";
import { collapsedFieldOf, fieldOf, PropField } from "../prop-field";

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
 * 半幅セルの左に出す隅の頭文字。**隅だけ 2 文字**なのは、辺と違って 1 文字で言い分けられ
 * ないため（`T` は上辺と左上・右上のどちらにも読める）。
 *
 * 消えても気づける手段は `SideGlyphs` と同じく視覚差分だけ。
 */
const CornerGlyphs = {
  topLeft: "TL",
  topRight: "TR",
  bottomRight: "BR",
  bottomLeft: "BL",
} as const satisfies Readonly<Record<Corner, string>>;

/**
 * 畳んだ欄の左に出す頭文字。UI 案は畳んだ状態を描いていないので、同じ行の辺の頭文字と同じ
 * 流儀（英字の頭文字）で決めた。
 *
 * 消えても気づける手段は `SideGlyphs` と同じく視覚差分だけ。
 */
const SidePairGlyphs = {
  vertical: "V",
  horizontal: "H",
} as const satisfies Readonly<Record<SidePair, string>>;

/** 束ねた行が出す綴り。テストとストーリーが同じ綴りを書き写さずに済むよう公開する。 */
export const ShorthandLabels = {
  /**
   * longhand を個別に出すかを切り替えるボタン。押されている間は 4 つの欄が出る。
   *
   * 綴りが shorthand ごとに違うのは、束ねているものが辺と隅で違うため。
   */
  perLonghand: {
    padding: "辺ごと",
    radius: "隅ごと",
  } as const satisfies Readonly<Record<ShorthandName, string>>,
} as const;

/**
 * 束ねた行の半幅セル 1 つ分の器。
 *
 * 見える文字は頭文字（`T` / `TL`）で、位置の綴りは読み上げ専用に別途置く。
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
 * セルの読み上げ名は**行の見出し + 自分の位置**で組み立てる（`Padding` + `Right`）。
 * 行の見出しを指す id を繋いでいるので、見出しを消すと読み上げ名も欠ける
 * （束ねた行の可視ラベルが誰にも見られていない状態を作らない）。
 * shorthand 名をセルごとに組み立て直さずに済むのも同じ理由。
 */

/**
 * 1 longhand 分のセル。
 *
 * @returns 位置の頭文字とその位置の入力欄を並べたセル
 */
function ShorthandLonghandCell({
  longhand,
  rowLabelId,
  onEdit,
}: Readonly<{
  longhand: PropLonghandControl;
  rowLabelId: string;
  onEdit: (edit: PropEdit, continuity: EditContinuity) => void;
}>): ReactElement {
  const labelId = useId();
  const slot = longhandKeyOf(longhand);
  const glyph =
    longhand.kind === "side"
      ? SideGlyphs[longhand.side]
      : CornerGlyphs[longhand.corner];

  return (
    <ShorthandCell
      glyph={glyph}
      labelId={labelId}
      label={CaseStyle.toCapitalCase(slot)}
    >
      <PropField
        field={fieldOf(`${rowLabelId} ${labelId}`, longhand.control, onEdit)}
        input={longhand.control.input}
        resolvedValuePlacement="below"
      />
    </ShorthandCell>
  );
}

/**
 * 向かい合う 2 辺を畳んだ 1 欄分のセル。
 *
 * @returns 組の頭文字と、2 辺へまとめて書く入力欄を並べたセル
 */
function ShorthandSidePairCell({
  pair,
  collapsed,
  rowLabelId,
  onEdit,
}: Readonly<{
  pair: SidePair;
  collapsed: PropCollapsedControl;
  rowLabelId: string;
  onEdit: (edit: PropEdit, continuity: EditContinuity) => void;
}>): ReactElement {
  const labelId = useId();

  return (
    <ShorthandCell
      glyph={SidePairGlyphs[pair]}
      labelId={labelId}
      label={CaseStyle.toCapitalCase(pair)}
    >
      <PropField
        field={collapsedFieldOf(`${rowLabelId} ${labelId}`, collapsed, onEdit)}
        input={PropCollapsedControl.input(collapsed)}
        resolvedValuePlacement="below"
      />
    </ShorthandCell>
  );
}

/**
 * 4 隅をまとめて畳んだ 1 欄。2 列のグリッドを跨いで行いっぱいに出る。
 *
 * 頭文字を出さないのは、UI 案 docs/Design Composer.html の `radius` 行がラベル + 全幅 1 欄
 * だから。1 欄しか無いので、行の見出しがそのままこの欄の読み上げ名になる。
 *
 * 行いっぱいに広げる指定（`col-span-2`）を落としても**テストは 1 件も落ちない**。半欄の
 * まま出ていることに気づける手段は Storybook の視覚差分だけ（`SideGlyphs` と同じ）。
 *
 * @returns 4 隅へまとめて書く入力欄
 */
function ShorthandAllCornersCell({
  collapsed,
  rowLabelId,
  onEdit,
}: Readonly<{
  collapsed: PropCollapsedControl;
  rowLabelId: string;
  onEdit: (edit: PropEdit, continuity: EditContinuity) => void;
}>): ReactElement {
  return (
    <div className="col-span-2 min-w-0">
      <PropField
        field={collapsedFieldOf(rowLabelId, collapsed, onEdit)}
        input={PropCollapsedControl.input(collapsed)}
        resolvedValuePlacement="below"
      />
    </div>
  );
}

/**
 * 畳んだ欄 1 つ分のセル。畳み方ごとに出す形が違う。
 *
 * @returns 向かい合う 2 辺なら頭文字つきの半幅セル、4 隅なら全幅の 1 欄
 */
function ShorthandCollapsedCell({
  collapsed,
  rowLabelId,
  onEdit,
}: Readonly<{
  collapsed: PropCollapsedControl;
  rowLabelId: string;
  onEdit: (edit: PropEdit, continuity: EditContinuity) => void;
}>): ReactElement {
  switch (collapsed.kind) {
    case "sidePair":
      return (
        <ShorthandSidePairCell
          pair={collapsed.pair}
          collapsed={collapsed}
          rowLabelId={rowLabelId}
          onEdit={onEdit}
        />
      );
    case "allCorners":
      return (
        <ShorthandAllCornersCell
          collapsed={collapsed}
          rowLabelId={rowLabelId}
          onEdit={onEdit}
        />
      );
  }
}

/**
 * 束ねた行のセルを並びの中で見分ける綴り。
 *
 * @param longhand 見分けたい longhand の編集欄
 * @returns その longhand の位置の綴り
 */
function longhandKeyOf(longhand: PropLonghandControl): string {
  return longhand.kind === "side" ? longhand.side : longhand.corner;
}

/**
 * 畳んだ欄を並びの中で見分ける綴り。
 *
 * @param collapsed 見分けたい畳んだ欄
 * @returns 向かい合う 2 辺なら組の綴り、4 隅なら畳み方の綴り
 */
function collapsedKeyOf(collapsed: PropCollapsedControl): string {
  return collapsed.kind === "sidePair" ? collapsed.pair : collapsed.kind;
}

/**
 * 4 つの longhand を 1 行にまとめた行（UI 案 docs/Design Composer.html の `padding` /
 * `radius`）。
 *
 * UI 案が描いているのは **padding の 4 辺（半幅セルを 2 列のグリッドに詰めた形）と
 * radius の畳んだ全幅 1 欄**だけで、padding の畳んだ状態・radius の隅ごとの状態・切り替え
 * ボタンは描かれていない。そこの見た目はここで決めている。
 *
 * 切り替えを `useState` で持つのは、畳んでいるかがドキュメントではなく画面の状態だから
 * （docs/03「畳み方は表示の都合なので持たない」）。道具の状態なので**同じ行が出続ける間
 * （Box 系を選び直す間）は残る**（Text を選ぶと行ごと消え、戻ると畳んだ状態から始まる）。
 *
 * @returns ラベルと切り替えボタン、右にセルのグリッドを並べた 1 行
 */
export function ShorthandRow({
  shorthand,
  onEdit,
}: Readonly<{
  shorthand: PropShorthandControl;
  onEdit: (edit: PropEdit, continuity: EditContinuity) => void;
}>): ReactElement {
  const rowLabelId = useId();
  const [isPerLonghand, setIsPerLonghand] = useState(false);

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
          aria-pressed={isPerLonghand}
          onClick={() => setIsPerLonghand((current) => !current)}
          className="rounded border border-gray-300 px-1 py-0.5 text-[10px] text-gray-500 aria-pressed:border-gray-400 aria-pressed:bg-gray-100 aria-pressed:text-gray-900"
        >
          {ShorthandLabels.perLonghand[shorthand.name]}
        </button>
      </div>
      <div className="grid min-w-0 flex-1 grid-cols-2 gap-1.5">
        {isPerLonghand
          ? PropShorthandControl.longhands(shorthand).map((longhand) => (
              <ShorthandLonghandCell
                key={longhandKeyOf(longhand)}
                longhand={longhand}
                rowLabelId={rowLabelId}
                onEdit={onEdit}
              />
            ))
          : PropShorthandControl.collapsed(shorthand).map((collapsed) => (
              <ShorthandCollapsedCell
                key={collapsedKeyOf(collapsed)}
                collapsed={collapsed}
                rowLabelId={rowLabelId}
                onEdit={onEdit}
              />
            ))}
      </div>
    </div>
  );
}
