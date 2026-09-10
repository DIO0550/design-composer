import { type ReactElement, useId } from "react";
import type { PropEdit } from "@/domains/dcmp/node";
import { PropControl } from "@/domains/session/prop-control";
import { CaseStyle } from "@/utils/CaseStyle";
import { ControlOffsetClass, LabelWidthClass } from "../label-width";
import { fieldOf, PropField, unsetLabel } from "../prop-field";

const LabelClass = `${LabelWidthClass} truncate text-[11px] text-gray-500`;

/**
 * 1 prop 分の行。UI 案（docs/Design Composer.html）はラベル左・コントロール右で並べ、表
 * 示名は prop 名の機械的な整形で作る（docs/03-schema.md「表示名フィールドは持たない」）。
 *
 * 条件付きの prop のうち**数値・文字の欄だけ**ラベルを出さず字下げする（UI 案は `width`
 * の数値欄をモードの行の下へぶら下げている）。条件を出している行の**直下**に来るのはス
 * キーマの宣言順に依っており、順が変われば離れた位置に字下げだけが残る。**この出し分け
 * は class の違いにしかならないので、崩れに気づける手段は Storybook の視覚差分だけ**（happy-dom
 * は Tailwind を解決しない）。
 *
 * 「enum 以外」で畳まないのは、条件付きのトークン欄（`layout` が `free` でなければ効く
 * `gap`）まで巻き込むと、**ラベルを外したトークン名（`md`）だけが残って何の欄か分からな
 * くなる**ため（数値欄が入る値で見分けが付くのと逆）。
 *
 * セグメント（enum）が条件付きでもラベルを出すのは、`placement: absolute` の下にぶら下
 * がる追従の 2 行が、ラベル無しでは**目で見てどちらが横でどちらが縦か分からない**ため（読
 * み上げ名は `sr-only` のラベルが `aria-labelledby` で付くので変わらない）。
 *
 * セグメントには `<select>` の「未指定（既定: …）」に当たる選択肢が無いので、未指定のと
 * きだけ同じ綴りを行の下に出す（`title` はホバーでしか読めず、キーボード・タッチから届
 * かない）。
 *
 * ラベルを `<label htmlFor>` にしないのは、`role="group"` を持つセグメントの器を
 * `<label>` で指せないため。全行を `aria-labelledby` に揃える（代償として、ラベルを押し
 * ても入力欄へフォーカスが移らない）。
 *
 *   @returns ラベルと入力欄を並べた 1 行
 */
export function PropRow({
  control,
  onEdit,
}: Readonly<{
  control: PropControl;
  onEdit: (edit: PropEdit) => void;
}>): ReactElement {
  const labelledBy = useId();
  const isLiteralField =
    control.input.kind === "number" || control.input.kind === "text";
  const hidesLabel = control.enabledBy.some && isLiteralField;
  const showsUnsetNote =
    control.input.kind === "enum" && !PropControl.hasValue(control);

  return (
    <div className="flex flex-col gap-1">
      <div
        className={
          hidesLabel
            ? `flex items-center ${ControlOffsetClass}`
            : "flex items-center gap-2"
        }
      >
        <span id={labelledBy} className={hidesLabel ? "sr-only" : LabelClass}>
          {CaseStyle.toCapitalCase(control.prop)}
        </span>
        <div className="min-w-0 flex-1">
          <PropField
            field={fieldOf(labelledBy, control, onEdit)}
            input={control.input}
            resolvedValuePlacement="beside"
          />
        </div>
      </div>
      {showsUnsetNote ? (
        <p className={`text-gray-400 text-xs ${ControlOffsetClass}`}>
          {unsetLabel(control)}
        </p>
      ) : null}
    </div>
  );
}
