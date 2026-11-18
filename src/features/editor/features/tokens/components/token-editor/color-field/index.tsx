import { type ReactElement, useState } from "react";
import { FocusWithinOutlineClass } from "@/components/focus-outline";
import type { Rgb } from "@/domains/dcmp/token";
import {
  EditContinuities,
  EditContinuityRun,
} from "@/domains/session/edit-continuity";
import {
  type HexColorControl,
  type TokenColorControl,
  TokenControl,
} from "@/features/editor/features/tokens/domains/token-control";
import { useFirstThenRest } from "@/hooks/use-first-then-rest";
import { Option } from "@/utils/Option";
import {
  type ChangeRaw,
  changeRawOf,
  changeRawOfTarget,
  DraftField,
  DraftFieldLooks,
  type SetTokenValue,
} from "../value-field";

/**
 * カラーピッカー。保存時に hex（小文字）へ正規化する。ピッカーを開いてから、開き直すか閉じて
 * ほかへ移るまでに動かした分を 1 つのまとまりとして送る（docs/06-ui.md「編集操作の一覧」の
 * tokens 編集）。
 *
 * @returns 箱の左端に置く、見本の形のカラーピッカー
 */
function ColorPickerField({
  id,
  value,
  onChangeRaw,
}: Readonly<{
  id: string;
  value: Rgb;
  onChangeRaw: ChangeRaw;
}>): ReactElement {
  /*
   * ピッカーは常に #rrggbb を返し `TokenControl.valueFrom` の `none` に届かないので、1 件目が
   * 落ちて続きが先に届くことは無い。
   *
   * 始め直すのは開いたとき（click）と離れたとき（blur）。フォーカスを得たときにしないのは、
   * ピッカーを閉じてもフォーカスが入力欄に残り、開き直しでは focus が発火しないため。blur でも
   * 始め直すのは、色のパネルがモーダルでなく、別の欄を編集して戻ったときに続きとして送らないため。
   * Chromium ではキーボード（Enter / Space）で開いても click が届くことを実測した。Tauri の
   * WebView は未検証。
   */
  const continuitySequence = useFirstThenRest(EditContinuityRun);

  return (
    <input
      id={id}
      type="color"
      value={value}
      onClick={continuitySequence.restart}
      onBlur={continuitySequence.restart}
      onChange={(event) => {
        onChangeRaw(event.target.value, continuitySequence.next());
      }}
      className="size-3.5 shrink-0 cursor-pointer rounded-sm border-0 bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-sm [&::-webkit-color-swatch]:border-none"
    />
  );
}

/**
 * `#`・6 桁・右端の不透明度を 1 つに入れた箱（UI 案 docs/Design Composer.html の Color の
 * エディタの `hex`）に、左端の見本を足したもの。見本は UI 案に無く、#1376 で足した。
 * 6 桁の欄の見出しは呼び出し側が置く。
 *
 * @returns 見本（ピッカー）・灰色の `#`・6 桁の欄・右端の不透明度の欄と `%`
 */
function HexColorInput({
  id,
  color,
  onSetTokenValue,
}: Readonly<{
  id: string;
  color: HexColorControl;
  onSetTokenValue: SetTokenValue;
}>): ReactElement {
  /*
   * 確定の回数を key に混ぜるのは、`ABC` のように通っても値が変わらない確定では key が動かず下書きが残るため。
   * 回数はこの欄の表示だけが使い、文書（undo の履歴ごと親が持つ）と連動しないので reducer にまとめない。
   * `changeRawOf` に成否を返させないのは、成否を使わない他の呼び出し側まで戻り値を受けることになるため。
   */
  const [hexCommits, setHexCommits] = useState(0);
  const commitHex = (raw: string) => {
    const value = TokenControl.valueFromHex(color.target, raw);
    if (!Option.isSome(value)) {
      return;
    }

    onSetTokenValue(value.value, EditContinuities.Separate);
    setHexCommits((count) => count + 1);
  };

  const changeAlpha = changeRawOf(
    (raw) => TokenControl.valueFromAlpha(color.target, raw),
    onSetTokenValue,
  );
  const pickerId = `${id}-${color.picker.name}`;
  const alphaId = `${id}-${color.alpha.name}`;
  const hexDigits = TokenControl.hexDigitsOf(color);

  return (
    /*
     * 根を `relative` にするのは、`sr-only` の見出しが `position: absolute` で、基準が無いと右ペインのスクロール枠を
     * 抜けて文書を伸ばすため（`shorthand-row` と同じ形）。happy-dom では落ちず、気づく手段は Storybook の視覚差分だけ。
     * フォーカスの枠を箱に描くのは、6 桁と不透明度の欄が枠を持たず（`outline-none`）、欄ごとに描くと箱の中に枠が入れ子で出るため。
     */
    <div
      className={`relative flex h-7 items-center gap-1 rounded-[5px] border border-[#e6e6e6] px-2 font-mono text-[11px] ${FocusWithinOutlineClass}`}
    >
      <label htmlFor={pickerId} className="sr-only">
        {color.picker.label}
      </label>
      <ColorPickerField
        id={pickerId}
        value={color.rgb}
        onChangeRaw={changeRawOfTarget(color.target, onSetTokenValue)}
      />
      <span aria-hidden="true" className="text-[#b3b3b3]">
        #
      </span>
      <DraftField
        key={`${hexDigits}/${hexCommits}`}
        id={id}
        type="text"
        value={hexDigits}
        look={DraftFieldLooks.HexDigits}
        onCommit={commitHex}
      />
      <label htmlFor={alphaId} className="sr-only">
        {color.alpha.label}
      </label>
      {/* `UnitField` に寄せないのは、UI 案の実測で箱の中の `%` は 10px・灰色で、打つ間だけ字色を戻すため */}
      <span className="ml-auto flex shrink-0 items-center text-[#b3b3b3] text-[10px] focus-within:text-[#1e1e1e]">
        <DraftField
          key={color.alphaPercent}
          id={alphaId}
          type="number"
          value={String(color.alphaPercent)}
          look={DraftFieldLooks.AlphaPercent}
          onCommit={(raw) => changeAlpha(raw, EditContinuities.Separate)}
        />
        %
      </span>
    </div>
  );
}

/**
 * 色の位置に入る欄。hex として読めれば見本・hex・不透明度の箱、読めなければ元の綴りを打ち直す
 * テキスト欄。
 *
 * @param id 6 桁の欄（読めない色ではテキスト欄）の id。見本と不透明度の欄は識別子を添えた id
 * @returns 箱か、テキスト欄
 */
export function ColorField({
  id,
  color,
  onSetTokenValue,
}: Readonly<{
  id: string;
  color: TokenColorControl;
  onSetTokenValue: SetTokenValue;
}>): ReactElement {
  switch (color.kind) {
    case "hex":
      return (
        <HexColorInput
          id={id}
          color={color}
          onSetTokenValue={onSetTokenValue}
        />
      );
    case "text": {
      const changeColorText = changeRawOfTarget(color.target, onSetTokenValue);

      return (
        <DraftField
          key={color.value}
          id={id}
          type="text"
          value={color.value}
          look={DraftFieldLooks.Regular}
          onCommit={(raw) => changeColorText(raw, EditContinuities.Separate)}
        />
      );
    }
  }
}
