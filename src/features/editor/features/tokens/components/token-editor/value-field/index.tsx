import { type ReactElement, useState } from "react";
import type { TokenValue } from "@/domains/dcmp/token";
import {
  EditContinuities,
  type EditContinuity,
} from "@/domains/session/edit-continuity";
import {
  TokenControl,
  type TokenControlField,
  type TokenControlInput,
  type TokenFieldTarget,
} from "@/features/editor/features/tokens/domains/token-control";
import type { ValueOf } from "@/types/ValueOf";
import { Option } from "@/utils/Option";

/** トークンの新しい値と、そのまとまり方を受け取る手続き。 */
export type SetTokenValue = (
  value: TokenValue,
  continuity: EditContinuity,
) => void;

/**
 * 欄の詰め具合。`Regular` は左に見出しを添えて 1 行に 1 欄ずつ置く欄、`Compact` は stop の行の
 * ように 1 行へ横に並べる欄。
 */
export const FieldDensities = {
  Regular: "regular",
  Compact: "compact",
} as const;

/** 欄の詰め具合。 */
export type FieldDensity = ValueOf<typeof FieldDensities>;

/**
 * 下書きの欄の見た目。詰め具合の 2 つに、色の箱の中に置く 6 桁と不透明度の欄を足したもの。
 * 箱の中の 2 つは枠を箱に任せ、字は箱から継ぐ。
 */
export const DraftFieldLooks = {
  ...FieldDensities,
  HexDigits: "hex-digits",
  AlphaPercent: "alpha-percent",
} as const;

/** 下書きの欄の見た目。 */
type DraftFieldLook = ValueOf<typeof DraftFieldLooks>;

/**
 * 下書きの欄の綴り。1 行に比率・色の欄・− の 3 つを並べる stop の行は、右ペインの幅に収めるため
 * 字と余白を詰める。
 */
const DraftFieldClasses = {
  regular: "w-full rounded border border-gray-300 px-2 py-1",
  compact: "w-full rounded border border-gray-300 px-1 py-1 text-xs",
  "hex-digits": "min-w-0 flex-1 bg-transparent outline-none",
  "alpha-percent":
    "w-[4ch] bg-transparent text-right outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
} as const satisfies Readonly<Record<DraftFieldLook, string>>;

/** 単位を添えた欄の、欄と単位の間。 */
const UnitGapClasses = {
  regular: "gap-2",
  compact: "gap-1",
} as const satisfies Readonly<Record<FieldDensity, string>>;

/**
 * 左に置く見出しの綴り。字はプロパティパネルのラベル欄と同じで、幅は UI 案の 52px。
 * 幅ごと `LabelClass` を借りないのは、あちらは `Width Mode` を収めるため 5.25rem に広げてあるから。
 */
const RowLabelClass = "w-[52px] shrink-0 truncate text-[11px] text-gray-500";

/**
 * 打っている途中の文字列を持ち、確定したときだけ外へ渡す入力欄。確定は入力欄を離れたと
 * きと Enter。
 *
 * 1 打鍵ごとに渡すと、確定形だけを受け付ける値（kebab-case の名前・数値）では途中の文字
 * 列が弾かれて打ち続けられない（`primary-` が弾かれると `-` の次を打てない）。
 *
 * 外の値が変わったときの取り直しは `key` で行う（`ValueField` が現在値を key にする。
 * 名前の欄は呼び出し側がトークンを key にする。hex の欄は `HexColorInput` が確定の回数も key に
 * 混ぜる）。
 * 確定が通らなかった入力では外の値も key も変わらないので下書きが残るが、
 * `type="number"` の欄は数値として読めない間ブラウザが表示を空にするので、画面に文字列
 * として残るのは `type="text"` の欄だけ。
 */
export function DraftField({
  id,
  type,
  value,
  look,
  onCommit,
}: Readonly<{
  id: string;
  type: "text" | "number";
  value: string;
  look: DraftFieldLook;
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
      className={DraftFieldClasses[look]}
    />
  );
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
        look={density}
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
 * 追随する。確定は `TokenControl.valueFrom` で書き戻し先の新しい値に読み、1 回ごとに別のまとまりとして送る。
 *
 * 数値として読めない入力と、値域を外れた入力では値を変えない。名前欄と同じで、通らなかったことは
 * 画面に出さず打ち直しに任せる。仕様に無い中間状態のエラー表示を発明しないため。
 *
 * @returns 比率なら % を、角度なら ° を添えた数値欄、数値なら数値欄、それ以外はテキスト欄
 */
export function ValueField({
  id,
  input,
  density,
  target,
  onSetTokenValue,
}: Readonly<{
  id: string;
  input: TokenControlInput;
  density: FieldDensity;
  target: TokenFieldTarget;
  onSetTokenValue: SetTokenValue;
}>): ReactElement {
  const onCommit = (raw: string) => {
    Option.map(TokenControl.valueFrom(target, raw), (value) =>
      onSetTokenValue(value, EditContinuities.Separate),
    );
  };
  switch (input.kind) {
    case "number":
      return (
        <DraftField
          key={input.value}
          id={id}
          type="number"
          value={String(input.value)}
          look={density}
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
          look={density}
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
  }
}

/**
 * 見出しを左に置いた 1 行（UI 案 docs/Design Composer.html の Color のエディタの `hex` / `name`）。
 *
 * 見出しが左に並ぶことは happy-dom では確かめられず、気づく手段は Storybook の視覚差分だけ。
 *
 * @returns 52px の見出しと、残りを占める欄
 */
export function LabeledRow({
  htmlFor,
  label,
  children,
}: Readonly<{
  htmlFor: string;
  label: string;
  children: ReactElement;
}>): ReactElement {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={htmlFor} className={RowLabelClass}>
        {label}
      </label>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

/**
 * 見出しを左に置いた 1 フィールドの欄。
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
    <LabeledRow htmlFor={id} label={field.label}>
      <ValueField
        id={id}
        input={field.input}
        density={FieldDensities.Regular}
        target={field.target}
        onSetTokenValue={onSetTokenValue}
      />
    </LabeledRow>
  );
}
