import { type ReactElement, useId } from "react";
import { ColorSwatch } from "@/components/color-swatch";
import { SegmentedControl } from "@/components/segmented-control";
import type { PropEdit } from "@/domains/dcmp/node";
import {
  PropControl,
  type PropControlInput,
  PropPairControl,
} from "@/domains/prop-control";
import { Option } from "@/utils/Option";

/*
 * 1 欄分の入力欄と、その欄が要るもの（今の値・未設定の綴り・編集の作り方）。
 * 行の側（`prop-row` / `shorthand-row`）は欄をここから受け取るだけにして、
 * 欄の見た目が行の種類ごとに割れないようにする。
 */

const FieldClass =
  "h-7 w-full rounded-md border border-gray-300 px-2 text-[11px]";

/**
 * 未指定のときに何が効くかを出す（#34「未指定 prop はデフォルト値を
 * プレースホルダ等で表示し、明示設定と区別する」）。
 *
 * @param control 未指定のときの見え方を出したいコントロール
 * @returns 既定値を持つなら既定値を添えた「未指定」、持たなければ「未指定」
 */
export function unsetLabel(control: PropControl): string {
  return control.defaultValue.some
    ? `未指定（既定: ${control.defaultValue.value}）`
    : "未指定";
}

/** 2 辺が食い違っているときに、値の代わりに欄へ出す綴り。 */
const MixedLabel = "不揃い";

/**
 * 欄の文字列を、その欄が指している値として読む。
 *
 * 空文字を「値が無い」と読むのはこのパネルの入力欄の約束事で、入れる向き
 * （`FieldBinding.value` は未設定・不揃いを空文字で表す）と受け取る向き
 * （`<select>` / `<input>` は空欄で空文字を返す）の両方に効く。ドメインへ渡す前に
 * ここで解釈するのは、文字列 prop にとって `""` はそれ自体が正当な値になりうるため
 * （`PropControl` 側で決めると、その値にとっての意味が固定される）。
 *
 * @param text 欄が持っている文字列
 * @returns 空文字なら `none`、それ以外はその文字列
 */
function valueFrom(text: string): Option<string> {
  return text === "" ? Option.none : Option.some(text);
}

/**
 * 入力欄が要るもの。
 *
 * `PropControl` そのものではなく**解釈済みの値と編集を作る口**で受ける。
 * 畳んだ欄は 1 つの prop に対応せず、不揃いという状態も `PropControl.value`
 * （`Option<PropValue>`）では表せないため、辺のコントロールを合成して
 * 偽のコントロールを作らずに済ませる。
 *
 * 型はこのフォルダの外へ出さない。作る口を `fieldOf` / `pairFieldOf` の 2 つに揃えて
 * おくためで、型で閉じてはいない（`PropField` の props は構造的に到達できる）。
 */
type FieldBinding = Readonly<{
  labelledBy: string;
  /** 今入っている値。未設定・不揃いなら空文字。 */
  value: string;
  /** 値が入っていないときに欄へ出す綴り。 */
  unsetLabel: string;
  onChangeRaw: (raw: string) => void;
}>;

/**
 * 1 prop の編集欄が要るもの。
 *
 * @param labelledBy ラベルと欄を結び付ける識別子
 * @param control 編集したい prop の編集欄
 * @param onEdit 作った編集の渡し先
 * @returns そのコントロールから編集を作る入力欄の口
 */
export function fieldOf(
  labelledBy: string,
  control: PropControl,
  onEdit: (edit: PropEdit) => void,
): FieldBinding {
  return {
    labelledBy,
    value: Option.unwrapOr(Option.map(control.value, String), ""),
    unsetLabel: unsetLabel(control),
    onChangeRaw: (raw) => onEdit(PropControl.editFrom(control, valueFrom(raw))),
  };
}

/**
 * 畳んだ欄が要るもの。編集は 2 辺への 1 件になる。
 *
 * 不揃いのときに空欄として出すのは、どちらの辺の値を出しても
 * 残りの辺と食い違うため。代わりに未選択スロットの綴りを差し替える。
 *
 * @param labelledBy ラベルと欄を結び付ける識別子
 * @param pair 編集したい畳んだ欄
 * @param onEdit 作った編集の渡し先
 * @returns 2 辺へまとめて書く入力欄の口
 */
export function pairFieldOf(
  labelledBy: string,
  pair: PropPairControl,
  onEdit: (edit: PropEdit) => void,
): FieldBinding {
  const value = PropPairControl.value(pair);
  const [first] = pair.sides;

  return {
    labelledBy,
    value:
      value.kind === "uniform"
        ? Option.unwrapOr(Option.map(value.value, String), "")
        : "",
    unsetLabel: value.kind === "uniform" ? unsetLabel(first) : MixedLabel,
    onChangeRaw: (raw) =>
      onEdit(PropPairControl.editFrom(pair, valueFrom(raw))),
  };
}

/**
 * トークン名から選ぶ入力欄。
 *
 * @param names 選択肢に出すトークン名（ファイル由来の不正な参照を含む）
 * @param describedBy 欄に添えた説明の識別子。省略すると説明を繋がない
 * @returns トークン名の選択欄
 */
function TokenSelect({
  field,
  names,
  describedBy,
}: Readonly<{
  field: FieldBinding;
  names: readonly string[];
  describedBy?: string;
}>): ReactElement {
  return (
    <select
      aria-labelledby={field.labelledBy}
      aria-describedby={describedBy}
      className={FieldClass}
      value={field.value}
      onChange={(event) => field.onChangeRaw(event.target.value)}
    >
      <option value="">{field.unsetLabel}</option>
      {names.map((name) => (
        <option key={name} value={name}>
          {name}
        </option>
      ))}
    </select>
  );
}

/**
 * 解決値の添え方。
 *
 * `beside` は全幅の行で、UI 案 docs/Design Composer.html の `gap`（`lg` の右端に `20`）
 * と同じ並び。`below` は半幅セル用で、横に並べると `<select>` に残る幅が
 * 20px ほどしか無く、トークン名が矢印に食われて読めなくなる（実表示で確認）。
 */
type ResolvedValuePlacement = "beside" | "below";

const ResolvedValueLayouts = {
  beside: "flex min-w-0 items-center gap-2",
  below: "flex min-w-0 flex-col gap-0.5",
} as const satisfies Readonly<Record<ResolvedValuePlacement, string>>;

/**
 * 数値のトークンを選ぶ入力欄。解決後の値を添える。
 *
 * 読み上げへ繋ぐのは、この数値が `<select>` の読み上げ（トークン名だけ）からは
 * 得られない情報だから。色の見本が `aria-hidden` なのは、何の色かを隣のトークン名が
 * 既に伝えているからで、こちらは事情が違う。
 *
 * Why not: 数値を欄の内側に置かない。理由は色の見本と同じで、ネイティブの
 * `<select>` の中には要素を描けない。
 *
 * 添える位置は class の違いにしかならないので、**崩れに気づける手段は Storybook の
 * 視覚差分だけ**（happy-dom は Tailwind を解決しない）。
 *
 * @returns 解決できたトークンならその値を添えた選択欄、解決できなければ選択欄だけ
 */
function NumericTokenField({
  field,
  input,
  placement,
}: Readonly<{
  field: FieldBinding;
  input: Extract<PropControlInput, { kind: "numericToken" }>;
  placement: ResolvedValuePlacement;
}>): ReactElement {
  const describedBy = useId();
  const resolvedValue = input.resolvedValue;

  if (!resolvedValue.some) {
    return <TokenSelect field={field} names={input.names} />;
  }
  return (
    <div className={ResolvedValueLayouts[placement]}>
      <TokenSelect
        field={field}
        names={input.names}
        describedBy={describedBy}
      />
      <span id={describedBy} className="shrink-0 text-[10px] text-gray-400">
        {resolvedValue.value}
      </span>
    </div>
  );
}

/**
 * 値域が数値・文字列で決まっている prop の入力欄。
 *
 * @param inputType 数値を受けるか文字を受けるか
 * @returns 生の値を打ち込む入力欄
 */
function LiteralInput({
  field,
  inputType,
}: Readonly<{
  field: FieldBinding;
  inputType: "number" | "text";
}>): ReactElement {
  return (
    <input
      aria-labelledby={field.labelledBy}
      type={inputType}
      className={FieldClass}
      value={field.value}
      placeholder={field.unsetLabel}
      onChange={(event) => field.onChangeRaw(event.target.value)}
    />
  );
}

/**
 * 1 欄分の入力欄。入力の形は値域から決まる。
 *
 * 値と編集の作り方を `FieldBinding` で受けるので、1 prop の行と畳んだ欄の
 * どちらからも同じものを描ける（欄の見た目を 2 通りに割らない）。
 *
 * 戻り値を `ReactElement` と書いているのは、入力の種類を足して `case` を足し忘れた
 * ときにコンパイルエラーにするため（`rules/coding.md`「列挙した状態の網羅を型で強制する」）。
 *
 * `resolvedValuePlacement` は呼び出し側（`prop-row` は `beside`、`shorthand-row` は
 * `below`）が決める。取り違えても class の違いにしかならないので、**気づける手段は
 * Storybook の視覚差分だけ**（happy-dom は Tailwind を解決しない）。
 *
 * @returns 値域に応じた入力欄
 */
export function PropField({
  field,
  input,
  resolvedValuePlacement,
}: Readonly<{
  field: FieldBinding;
  input: PropControlInput;
  resolvedValuePlacement: ResolvedValuePlacement;
}>): ReactElement {
  switch (input.kind) {
    case "enum":
      return (
        <SegmentedControl
          labelledBy={field.labelledBy}
          options={input.values}
          value={valueFrom(field.value)}
          onChange={(next) => field.onChangeRaw(Option.unwrapOr(next, ""))}
        />
      );
    case "token":
      return <TokenSelect field={field} names={input.names} />;
    case "numericToken":
      return (
        <NumericTokenField
          field={field}
          input={input}
          placement={resolvedValuePlacement}
        />
      );
    /*
     * Why not: 見本を欄の内側に置かない（UI 案 docs/Design Composer.html は内側）。
     * ネイティブの `<select>` の中には要素を描けず、内側に置くには一覧そのものを
     * 自作することになる（キーボード操作と読み上げを自前で持つ）。
     */
    case "colorToken":
      return (
        <div className="flex min-w-0 items-center gap-2">
          {input.color.some ? <ColorSwatch color={input.color.value} /> : null}
          <TokenSelect field={field} names={input.names} />
        </div>
      );
    case "number":
      return <LiteralInput field={field} inputType="number" />;
    case "text":
      return <LiteralInput field={field} inputType="text" />;
  }
}
