import { type ReactElement, useRef, useState } from "react";
import type { Rgb, TokenValue } from "@/domains/dcmp/token";
import {
  EditContinuities,
  type EditContinuity,
} from "@/domains/session/edit-continuity";
import {
  TokenControl,
  type TokenControlField,
  type TokenControlInput,
} from "@/features/editor/features/tokens/domains/token-control";
import type { ValueOf } from "@/types/ValueOf";
import { Option } from "@/utils/Option";

/** トークンの新しい値と、そのまとまり方を受け取る手続き。 */
export type SetTokenValue = (
  value: TokenValue,
  continuity: EditContinuity,
) => void;

/** 欄に入った文字列と、そのまとまり方を受け取る手続き。 */
export type ChangeRaw = (raw: string, continuity: EditContinuity) => void;

/**
 * 欄の詰め具合。`Regular` は見出しの下に 1 欄ずつ置く欄、`Compact` は stop の行のように
 * 1 行へ横に並べる欄。
 */
export const FieldDensities = {
  Regular: "regular",
  Compact: "compact",
} as const;

/** 欄の詰め具合。 */
export type FieldDensity = ValueOf<typeof FieldDensities>;

/**
 * 下書きの欄の見た目。1 行に 5 つ並べる stop の行は、右ペインの幅に収めるため字と余白を詰める。
 */
const DraftFieldClasses = {
  regular: "w-full rounded border border-gray-300 px-2 py-1",
  compact: "w-full rounded border border-gray-300 px-1 py-1 text-xs",
} as const satisfies Readonly<Record<FieldDensity, string>>;

/** 単位を添えた欄の、欄と単位の間。 */
const UnitGapClasses = {
  regular: "gap-2",
  compact: "gap-1",
} as const satisfies Readonly<Record<FieldDensity, string>>;

/** ピッカーの大きさ。stop の行では見本と同じ 24px 角へ縮める。 */
const PickerClasses = {
  regular: "h-8 w-16 shrink-0 rounded border border-gray-300",
  compact: "size-6 shrink-0 rounded border border-gray-300",
} as const satisfies Readonly<Record<FieldDensity, string>>;

/**
 * 打っている途中の文字列を持ち、確定したときだけ外へ渡す入力欄。確定は入力欄を離れたと
 * きと Enter。
 *
 * 1 打鍵ごとに渡すと、確定形だけを受け付ける値（kebab-case の名前・数値）では途中の文字
 * 列が弾かれて打ち続けられない（`primary-` が弾かれると `-` の次を打てない）。
 *
 * 外の値が変わったときの取り直しは `key` で行う（`ValueField` が現在値を key にする。
 * 名前の欄は呼び出し側がトークンを key にする）。
 * 確定が通らなかった入力では外の値も key も変わらないので下書きが残るが、
 * `type="number"` の欄は数値として読めない間ブラウザが表示を空にするので、画面に文字列
 * として残るのは `type="text"` の欄だけ。
 */
export function DraftField({
  id,
  type,
  value,
  density,
  onCommit,
}: Readonly<{
  id: string;
  type: "text" | "number";
  value: string;
  density: FieldDensity;
  onCommit: (raw: string) => void;
}>) {
  const [draft, setDraft] = useState(value);

  return (
    <input
      id={id}
      type={type}
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => onCommit(draft)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.currentTarget.blur();
        }
      }}
      className={DraftFieldClasses[density]}
    />
  );
}

/**
 * カラーピッカー。保存時に hex（小文字）へ正規化する。ピッカーを開いてから、開き直すか閉じて
 * ほかへ移るまでに動かした分を 1 つのまとまりとして送る（docs/06-ui.md「編集操作の一覧」の
 * tokens 編集）。
 *
 * 見出しの下に置く欄では読み取り専用の hex を右に添える。stop の行は hex を打てる欄
 * （docs/06-ui.md「`Tokens` の `gradients`」）を別に並べるので添えない。
 *
 * @returns カラーピッカーと、見出しの下に置く欄では読み取り専用の hex
 */
function ColorPickerField({
  id,
  value,
  density,
  onChangeRaw,
}: Readonly<{
  id: string;
  value: Rgb;
  density: FieldDensity;
  onChangeRaw: ChangeRaw;
}>): ReactElement {
  /*
   * 立てるのは送った時点で、履歴へ入ったかは見ない（prop-field の `LiteralInput` と同じ
   * 扱い）。ピッカーは常に #rrggbb を返すので `TokenControl.valueFrom` の `none` には届かない。
   *
   * 下ろすのは開いたとき（click）と離れたとき（blur）。フォーカスを得たときにしないのは、
   * ピッカーを閉じてもフォーカスが入力欄に残り、開き直しでは focus が発火しないため。blur でも
   * 下ろすのは、色のパネルがモーダルでなく、別の欄を編集して戻ったときに続きとして送らないため。
   * Chromium ではキーボード（Enter / Space）で開いても click が届くことを実測した。Tauri の
   * WebView は未検証。
   */
  const hasEdited = useRef(false);
  const resetEdited = () => {
    hasEdited.current = false;
  };
  const picker = (
    <input
      id={id}
      type="color"
      value={value}
      onClick={resetEdited}
      onBlur={resetEdited}
      onChange={(event) => {
        onChangeRaw(
          event.target.value,
          hasEdited.current
            ? EditContinuities.Continued
            : EditContinuities.Separate,
        );
        hasEdited.current = true;
      }}
      className={PickerClasses[density]}
    />
  );

  switch (density) {
    case FieldDensities.Regular:
      return (
        <div className="flex items-center gap-2">
          {picker}
          <span className="font-mono text-gray-600 text-xs">{value}</span>
        </div>
      );
    case FieldDensities.Compact:
      return picker;
  }
}

/**
 * 単位を欄の外に添えた数値欄。
 *
 * 単位を欄の外に出すのは、値だけを打てるようにするため（単位まで打たせると数値として
 * 読めない下書きが増える）。
 *
 * @returns 数値欄と、その右に添えた単位
 */
function UnitField({
  id,
  value,
  unit,
  density,
  onCommit,
}: Readonly<{
  id: string;
  value: number;
  unit: "%" | "°";
  density: FieldDensity;
  onCommit: (raw: string) => void;
}>): ReactElement {
  return (
    <div className={`flex items-center ${UnitGapClasses[density]}`}>
      <DraftField
        key={value}
        id={id}
        type="number"
        value={String(value)}
        density={density}
        onCommit={onCommit}
      />
      <span className="text-gray-600 text-xs">{unit}</span>
    </div>
  );
}

/**
 * トークンの 1 フィールドの入力欄。形は値の種別で決まる。
 *
 * 下書きを持つ欄は、現在値を key にして外の値（undo / redo・打った値の正規化・並べ直し）に
 * 追随する。確定は 1 回ごとに別のまとまりとして送る。
 *
 * @returns 色ならカラーピッカー、不透明度と比率なら % を、角度なら ° を添えた数値欄、
 *   数値なら数値欄、それ以外はテキスト欄
 */
export function ValueField({
  id,
  input,
  density,
  onChangeRaw,
}: Readonly<{
  id: string;
  input: TokenControlInput;
  density: FieldDensity;
  onChangeRaw: ChangeRaw;
}>): ReactElement {
  const onCommit = (raw: string) => onChangeRaw(raw, EditContinuities.Separate);
  switch (input.kind) {
    case "number":
      return (
        <DraftField
          key={input.value}
          id={id}
          type="number"
          value={String(input.value)}
          density={density}
          onCommit={onCommit}
        />
      );
    case "text":
      return (
        <DraftField
          key={input.value}
          id={id}
          type="text"
          value={input.value}
          density={density}
          onCommit={onCommit}
        />
      );
    case "percent":
      return (
        <UnitField
          id={id}
          value={input.value}
          unit="%"
          density={density}
          onCommit={onCommit}
        />
      );
    case "degree":
      return (
        <UnitField
          id={id}
          value={input.value}
          unit="°"
          density={density}
          onCommit={onCommit}
        />
      );
    case "color":
      return (
        <ColorPickerField
          id={id}
          value={input.value}
          density={density}
          onChangeRaw={onChangeRaw}
        />
      );
  }
}

/**
 * その欄に打たれた文字列を、トークンの新しい値にして送る手続き（`ValueField` の `onChangeRaw`）。
 *
 * 数値として読めない入力と、値域を外れた入力では値を変えない（`TokenControl.valueFrom` の
 * `none`）。名前欄と同じで、通らなかったことは画面に出さず打ち直しに任せる。仕様に無い
 * 中間状態のエラー表示を発明しないため。
 *
 * @param field 打たれた欄
 * @param onSetTokenValue 読めた値と続き方を受け取る先
 * @returns 欄の文字列と続き方を受け取る手続き
 */
export function changeRawOf(
  field: TokenControlField,
  onSetTokenValue: SetTokenValue,
): ChangeRaw {
  return (raw, continuity) => {
    Option.map(TokenControl.valueFrom(field.target, raw), (value) =>
      onSetTokenValue(value, continuity),
    );
  };
}

/**
 * 見出しを上に置いた 1 フィールドの欄。
 *
 * @returns 見出しと入力欄
 */
export function FieldRow({
  id,
  field,
  onSetTokenValue,
}: Readonly<{
  id: string;
  field: TokenControlField;
  onSetTokenValue: SetTokenValue;
}>): ReactElement {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-gray-600 text-xs">
        {field.label}
      </label>
      <ValueField
        id={id}
        input={field.input}
        density={FieldDensities.Regular}
        onChangeRaw={changeRawOf(field, onSetTokenValue)}
      />
    </div>
  );
}
