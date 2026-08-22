import { type ReactElement, useId, useState } from "react";
import { ColorSwatch } from "@/components/color-swatch";
import { SegmentedControl } from "@/components/segmented-control";
import { TypeGlyph } from "@/components/type-glyph";
import type { PropEdit } from "@/domains/node";
import {
  PropControl,
  type PropControlInput,
  type PropControlRow,
  type PropControlSection,
  PropPairControl,
  PropShorthandControl,
  SelectionControls,
} from "@/domains/prop-control";
import type { Selection, SelectionKind } from "@/domains/selection";
import type { Side, SidePair } from "@/domains/side";
import { EditorLayout } from "@/features/editor/components/editor-layout";
import { EditorState } from "@/features/editor/domains/editor-state";
import { InstanceComposition } from "@/services/instance-composition";
import { CaseStyle } from "@/utils/CaseStyle";
import { Option } from "@/utils/Option";

const FieldClass =
  "h-7 w-full rounded-md border border-gray-300 px-2 text-[11px]";

/**
 * ラベル欄の幅。UI 案の 52px では `Width Mode` / `Height Mode` が収まらず、
 * 束ねた行はこの幅に見出しと切り替えボタンを縦に積む。
 * 変えたら `ControlOffsetClass` も一緒に動かす（片方だけ変えると字下げがずれる）。
 */
const LabelWidthClass = "w-[5.25rem] shrink-0";

const LabelClass = `${LabelWidthClass} truncate text-[11px] text-gray-500`;

/**
 * ラベル欄の右、コントロールの左端へ揃えるための字下げ。
 * ラベル欄 5.25rem + ラベルとコントロールの間隔 0.5rem。
 */
const ControlOffsetClass = "pl-[5.75rem]";

/**
 * 未指定のときに何が効くかを出す（#34「未指定 prop はデフォルト値を
 * プレースホルダ等で表示し、明示設定と区別する」）。
 *
 * @param control 未指定のときの見え方を出したいコントロール
 * @returns 既定値を持つなら既定値を添えた「未指定」、持たなければ「未指定」
 */
function unsetLabel(control: PropControl): string {
  return control.defaultValue.some
    ? `未指定（既定: ${control.defaultValue.value}）`
    : "未指定";
}

/** 2 辺が食い違っているときに、値の代わりに欄へ出す綴り。 */
const MixedLabel = "不揃い";

/**
 * 入力欄が返した文字列を、入力された値として読む。
 *
 * 空欄を「値が無い」と読むのは `<select>` / `<input>` の約束事なので、
 * ドメインへ渡す前にここで解釈する（文字列 prop にとって `""` はそれ自体が
 * 正当な値になりうるため、`PropControl` 側で決めるとその値にとっての意味が固定される）。
 *
 * @param raw 入力欄が持っている生の文字列
 * @returns 空欄なら `none`、それ以外はその文字列
 */
function enteredValue(raw: string): Option<string> {
  return raw === "" ? Option.none : Option.some(raw);
}

/**
 * 入力欄が要るもの。
 *
 * `PropControl` そのものではなく**解釈済みの値と編集を作る口**で受ける。
 * 畳んだ欄は 1 つの prop に対応せず、不揃いという状態も `PropControl.value`
 * （`Option<PropValue>`）では表せないため、辺のコントロールを合成して
 * 偽のコントロールを作らずに済ませる。
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
function fieldOf(
  labelledBy: string,
  control: PropControl,
  onEdit: (edit: PropEdit) => void,
): FieldBinding {
  return {
    labelledBy,
    value: Option.unwrapOr(Option.map(control.value, String), ""),
    unsetLabel: unsetLabel(control),
    onChangeRaw: (raw) =>
      onEdit(PropControl.editFrom(control, enteredValue(raw))),
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
function pairFieldOf(
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
      onEdit(PropPairControl.editFrom(pair, enteredValue(raw))),
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
 * @returns 値域に応じた入力欄
 */
function PropField({
  field,
  input,
  resolvedValuePlacement,
}: Readonly<{
  field: FieldBinding;
  input: PropControlInput;
  resolvedValuePlacement: ResolvedValuePlacement;
}>): ReactElement {
  switch (input.kind) {
    /*
     * セグメントは `Option` で選択を表すので、空文字を未選択として読み替える
     * （`enteredValue` と同じ、この画面の入力欄の約束事）。
     */
    case "enum":
      return (
        <SegmentedControl
          labelledBy={field.labelledBy}
          options={input.values}
          value={enteredValue(field.value)}
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

/**
 * 1 prop 分の行。UI 案（docs/Design Composer.html）はラベル左・コントロール右で並べる。
 * 表示名は prop 名の機械的な整形で作る（docs/03-schema.md「表示名フィールドは持たない」）。
 *
 * 条件付きの prop はラベルを出さず字下げする（UI 案は `width` の数値欄をモードの行の
 * 下へぶら下げている）。条件を出している行の**直下**に来るのはスキーマの宣言順に
 * 依っており（`BoxSchema` は `widthMode` の直後に `width` を宣言する）、順が変われば
 * 離れた位置に字下げだけが残る。**この出し分けは class の違いにしかならないので、
 * 崩れに気づける手段は Storybook の視覚差分だけ**（happy-dom は Tailwind を解決しない）。
 *
 * セグメントには `<select>` の「未指定（既定: …）」に当たる選択肢が無いので、
 * 未指定のときだけ同じ綴りを行の下に出す。`title` では出さない（ホバーでしか読めず、
 * キーボード・タッチから届かない）。
 *
 * ラベルを `<label htmlFor>` にしないのは、`role="group"` を持つセグメントの器を
 * `<label>` で指せないため。行ごとに結び方が 2 通りに割れるより、全行を
 * `aria-labelledby` に揃える（代償として、ラベルを押しても入力欄へフォーカスが移らない）。
 *
 * @returns ラベルと入力欄を並べた 1 行
 */
function PropRow({
  control,
  onEdit,
}: Readonly<{
  control: PropControl;
  onEdit: (edit: PropEdit) => void;
}>): ReactElement {
  const labelledBy = useId();
  const isDependent = control.enabledBy.some;
  const showsUnsetNote =
    control.input.kind === "enum" && !PropControl.hasValue(control);

  return (
    <div className="flex flex-col gap-1">
      <div
        className={
          isDependent
            ? `flex items-center ${ControlOffsetClass}`
            : "flex items-center gap-2"
        }
      >
        <span id={labelledBy} className={isDependent ? "sr-only" : LabelClass}>
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
 * （行の `key` が shorthand 名で安定するため）。この行を持たない Text を選ぶと
 * 行ごと消えるので、戻ったときは畳んだ状態から始まる。
 *
 * @returns ラベルと切り替えボタン、右に半幅セルのグリッドを並べた 1 行
 */
function ShorthandRow({
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

/**
 * セクションに並ぶ 1 行。
 *
 * 戻り値を `ReactElement`（`ReactNode` ではない）と書いているのは、行の種類を
 * 足して `case` を足し忘れたときにコンパイルエラーにするため。
 *
 * @returns 行の種類に応じた 1 行
 */
function SectionRow({
  row,
  onEdit,
}: Readonly<{
  row: PropControlRow;
  onEdit: (edit: PropEdit) => void;
}>): ReactElement {
  switch (row.kind) {
    case "prop":
      return <PropRow control={row.control} onEdit={onEdit} />;
    case "shorthand":
      return <ShorthandRow shorthand={row.shorthand} onEdit={onEdit} />;
  }
}

/**
 * 行を並びの中で見分ける識別子。
 *
 * @param row 識別子が欲しい行
 * @returns 1 prop の行は prop 名、束ねた行は shorthand 名
 */
function rowKey(row: PropControlRow): string {
  return row.kind === "prop" ? row.control.prop : row.shorthand.name;
}

/**
 * 節の見出し。
 *
 * @returns 見出しと、右端に添えるものを並べた帯
 */
function SectionHeading({
  children,
  trailing,
}: Readonly<{ children: string; trailing?: ReactElement }>): ReactElement {
  return (
    <div className="flex items-center justify-between">
      <h3 className="font-semibold text-[11px] text-gray-900">{children}</h3>
      {trailing}
    </div>
  );
}

/**
 * 見出しでまとめた prop の並び（Layout / Size / Appearance）。UI 案は罫線で区切る。
 *
 * Why not: UI 案が見出しの右端に描く `⋯` は置かない。開いた先のメニューがどこにも
 * 描かれておらず、まとめて未指定へ戻す操作も各 prop の導線（セグメントの再押下・
 * `未指定（既定: …）`・テキストを空にする）で足りているため。
 */
function GroupSection({
  section,
  onEdit,
}: Readonly<{
  section: PropControlSection;
  onEdit: (edit: PropEdit) => void;
}>) {
  return (
    <div className="flex flex-col gap-2 border-gray-200 border-t pt-3 first:border-t-0 first:pt-0">
      <SectionHeading>{CaseStyle.toCapitalCase(section.group)}</SectionHeading>
      {section.rows.map((row) => (
        <SectionRow key={rowKey(row)} row={row} onEdit={onEdit} />
      ))}
    </div>
  );
}

/*
 * インスタンスの節の綴りは UI 案 docs/Design Composer.html の `Assets · Instance`
 * 画面から採る。日本語にしないのは、同じ画面の `Public props` / `Assets` /
 * `Components` が既に UI 案の綴りのままで、片方だけ訳すと節の名前が混ざるため。
 */
const SelectionLabels = {
  /** 複数選んでいるときに帯へ出す綴り。UI 案に該当の画面が無いので最小の 1 行にする。 */
  multiple: (count: number) => `${count} selected`,
} as const;

const InstanceLabels = {
  from: "from",
  publicProps: "Public props",
  instance: "Instance",
  goToSource: "Go to source component",
  selectAllInstances: (count: number) => `Select all ${count} instances`,
  detach: "Detach instance",
  detachNote:
    "Detach bakes overrides into a real tree and auto-renames inner nodes.",
  overridden: "overridden",
  footnote:
    "Only declared publicProps are editable. New declarations come from AI or JSON editing.",
} as const;

/** 解除できないときに、ボタンの `title` へ出す理由（挿入ボタンと同じ扱い）。 */
const DetachDisabledReason = "参照先の部品が見つからないため解除できません";

/** まとめて選んでも選択が変わらないときに、ボタンの `title` へ出す理由。 */
const SelectAllInstancesDisabledReason =
  "このインスタンスしか無いため、まとめて選んでも選択は変わりません";

/** インスタンスの節から呼ぶ操作。常に対で要るので 1 つにまとめて受け取る。 */
export type InstanceActions = Readonly<{
  goToSource: () => void;
  selectAllInstances: () => void;
  detach: () => void;
}>;

/**
 * 上書きしている公開 prop に添える、既定値の知らせ
 * （UI 案の `overridden · default "Button"`）。
 *
 * 既定を持たない公開 prop もありうる（binding 先の prop にスキーマの `default` が
 * 無く、部品側も値を設定していない場合）ので、そのときは `overridden` だけを出す。
 */
function OverriddenNote({ control }: Readonly<{ control: PropControl }>) {
  const defaultValue = control.defaultValue;

  return (
    <p className={`text-gray-400 text-xs ${ControlOffsetClass}`}>
      {InstanceLabels.overridden}
      {defaultValue.some ? (
        <>
          {" · default "}
          {/* 値そのものと地の文を見分けられるよう、UI 案と同じく等幅で出す */}
          <span className="font-mono text-gray-600">
            "{String(defaultValue.value)}"
          </span>
        </>
      ) : null}
    </p>
  );
}

/** 公開 prop 1 件の行。上書きしているときだけ既定値の知らせが下に付く。 */
function PublicPropRow({
  control,
  onEdit,
}: Readonly<{ control: PropControl; onEdit: (edit: PropEdit) => void }>) {
  return (
    <div className="flex flex-col gap-1">
      <PropRow control={control} onEdit={onEdit} />
      {PropControl.hasValue(control) ? (
        <OverriddenNote control={control} />
      ) : null}
    </div>
  );
}

/**
 * インスタンスを選んだときの本文（UI 案 docs/Design Composer.html の
 * `Assets · Instance` の右ペイン）。
 *
 * `group` の見出しを出さないのは、公開 prop の `group` が binding 先の
 * プリミティブのものだから（出すと部品の内部構造が漏れる）。
 */
function InstanceBody({
  controls,
  onEdit,
  actions,
}: Readonly<{
  controls: Extract<SelectionControls, { kind: "instance" }>;
  onEdit: (edit: PropEdit) => void;
  actions: InstanceActions;
}>) {
  const { source, publicProps } = controls;
  const isSelectAllInstancesEnabled = controls.sourceInstanceCount > 1;

  return (
    <div className="flex w-full flex-col gap-4">
      <p className="flex items-center gap-1.5 text-gray-400 text-xs">
        {InstanceLabels.from}
        <span className="flex items-center gap-1 rounded bg-purple-50 px-2 py-0.5 font-medium text-[#7a34d6]">
          <TypeGlyph kind="component" />
          {source}
        </span>
      </p>

      <section className="flex flex-col gap-2">
        <SectionHeading
          trailing={
            <span className="text-gray-400 text-xs">{publicProps.length}</span>
          }
        >
          {InstanceLabels.publicProps}
        </SectionHeading>
        {publicProps.map((control) => (
          <PublicPropRow key={control.prop} control={control} onEdit={onEdit} />
        ))}
      </section>

      <section className="flex flex-col gap-2 border-gray-200 border-t pt-3">
        <SectionHeading>{InstanceLabels.instance}</SectionHeading>
        <button
          type="button"
          onClick={actions.goToSource}
          className="rounded border border-gray-300 px-2 py-1 text-left text-sm hover:bg-gray-100"
        >
          {InstanceLabels.goToSource}
        </button>
        {/*
          UI 案は `Go to source component` と `Detach instance` の間に置いている。
          1 つしか無いときに押せなくするのは、押しても選択が変わらないため
          （`isDetachable` と同じ扱い）。
        */}
        <button
          type="button"
          onClick={actions.selectAllInstances}
          disabled={!isSelectAllInstancesEnabled}
          title={
            isSelectAllInstancesEnabled
              ? undefined
              : SelectAllInstancesDisabledReason
          }
          className="rounded border border-gray-300 px-2 py-1 text-left text-sm hover:bg-gray-100 disabled:opacity-50"
        >
          {InstanceLabels.selectAllInstances(controls.sourceInstanceCount)}
        </button>
        <button
          type="button"
          onClick={actions.detach}
          disabled={!controls.isDetachable}
          title={controls.isDetachable ? undefined : DetachDisabledReason}
          className="rounded border border-gray-300 px-2 py-1 text-left text-sm hover:bg-gray-100 disabled:opacity-50"
        >
          {InstanceLabels.detach}
        </button>
        <p className="text-gray-400 text-xs">{InstanceLabels.detachNote}</p>
      </section>

      <p className="border-gray-200 border-t pt-3 text-gray-400 text-xs">
        {InstanceLabels.footnote}
      </p>
    </div>
  );
}

/** 見出しでまとめた prop の並び。編集できる prop が無ければその旨を出す。 */
function GroupsBody({
  sections,
  onEdit,
}: Readonly<{
  sections: readonly PropControlSection[];
  onEdit: (edit: PropEdit) => void;
}>) {
  if (sections.length === 0) {
    return <p className="text-gray-500">編集できる prop がありません</p>;
  }
  return (
    <div className="flex w-full flex-col gap-3">
      {sections.map((section) => (
        <GroupSection key={section.group} section={section} onEdit={onEdit} />
      ))}
    </div>
  );
}

/**
 * 選択の種類ごとの本文。
 *
 * 戻り値を `ReactElement`（`ReactNode` ではない）と書いているのは、種類を足して
 * `case` を足し忘れたときにコンパイルエラーにするため（`rules/coding.md`
 * 「列挙した状態の網羅を型で強制する」）。
 *
 * @returns 選択の種類に応じた本文
 */
function SelectionBody({
  controls,
  onEdit,
  instance,
}: Readonly<{
  controls: SelectionControls;
  onEdit: (edit: PropEdit) => void;
  instance: InstanceActions;
}>): ReactElement | null {
  switch (controls.kind) {
    case "instance":
      return (
        <InstanceBody controls={controls} onEdit={onEdit} actions={instance} />
      );
    case "groups":
      return <GroupsBody sections={controls.sections} onEdit={onEdit} />;
    /*
     * 複数選んでいる間は編集欄を 1 つも出さない（docs/06-ui.md「選択」）。
     * 件数は帯が出すので、ここは本文を空にして「選択を解除」だけを残す。
     */
    case "multiple":
      return null;
  }
}

/**
 * 帯の右端に出す種別の綴り。
 *
 * UI 案（docs/Design Composer.html）に実在するのは `Box` と `Instance` だけ。
 * artboard を選んだ帯と Text を選んだ帯は UI 案に画面が無いので、`Artboard` /
 * `Text` はここで決めた（型の綴りをそのまま出す形に揃えている）。
 *
 * ドメインには置かない。ドメインが答えるのは「参照ノードか」「どの primitive か」で、
 * `Instance` はそれをこの画面でどう呼ぶかという表示の語彙。実際、同じ参照ノードを
 * ツリーは `inst`、ここは `Instance` と綴っている（`rules/architecture.md`
 * 「ドメインが出力形式を必要とする場合」と同じ線引き）。
 *
 * 種別を足して綴りを足し忘れると、ここがコンパイルエラーになる。
 */
const KindLabels = {
  artboard: "Artboard",
  Box: "Box",
  Text: "Text",
  component: "Instance",
} as const satisfies Readonly<Record<SelectionKind, string>>;

/**
 * 選んでいるものを出す見出しの中身（型アイコン + 名前 + 右端に種別）。
 *
 * 種別が `none`（スキーマに無い `type`）のときはアイコンも綴りも出さず名前だけにする。
 * 分からない種別を既定へ寄せると、不正なドキュメントであることが画面から消える
 * （ツリーの行と同じ扱い）。
 */
function SelectionTitle({ selection }: Readonly<{ selection: Selection }>) {
  const kind = selection.kind;

  return (
    <>
      {kind.some ? <TypeGlyph kind={kind.value} /> : null}
      {/* 名前が余りを占める。flex の子は既定で内容幅より縮まないため省略には min-w-0 が要る */}
      <h2 className="min-w-0 flex-1 truncate font-semibold text-gray-900 text-sm">
        {selection.name}
      </h2>
      {kind.some ? (
        <span className="shrink-0 text-gray-400 text-xs">
          {KindLabels[kind.value]}
        </span>
      ) : null}
    </>
  );
}

/**
 * 帯に出す中身。何も選んでいなければ空（帯そのものは残す）。
 *
 * 複数選んでいるときに件数を出すのは、1 つの名前も種別も決まらないため
 * （docs/06-ui.md「選択」。本文は編集欄を出さないので、ここが唯一の手がかりになる）。
 *
 * 戻り値を `ReactElement`（`ReactNode` ではない）と書いているのは、選択の種類を
 * 足して `case` を足し忘れたときにコンパイルエラーにするため。
 *
 * @returns 複数選択なら件数、1 つ選んでいれば名前と種別、何も選んでいなければ空
 */
function SelectionHeading({
  controls,
  state,
}: Readonly<{
  controls: Option<SelectionControls>;
  state: EditorState;
}>): ReactElement | null {
  if (controls.some && controls.value.kind === "multiple") {
    return (
      <h2 className="min-w-0 flex-1 truncate font-semibold text-gray-900 text-sm">
        {SelectionLabels.multiple(controls.value.count)}
      </h2>
    );
  }
  const selection = EditorState.singleSelection(state);
  return selection.some ? <SelectionTitle selection={selection.value} /> : null;
}

/**
 * 帯の下の本文。出すものは「凍結中」「選択あり」「選択なし」の 3 つ。
 *
 * 凍結を最初に見るのは、ファイルが不正な間は選択の有無によらず編集させないため
 * （#135。映っているのは最後に正常だった表示で、そこへ加えた編集は今のファイルとは
 * 噛み合わない）。見出しの選択名は残すので、何を選んでいたかは分かる。
 *
 * @returns 凍結中はその旨、選択があれば入力欄、無ければ選択を促す 1 行
 */
function InspectorBody({
  isFrozen,
  controls,
  onEditProp,
  onClearSelection,
  instance,
}: Readonly<{
  isFrozen: boolean;
  controls: Option<SelectionControls>;
  onEditProp: (edit: PropEdit) => void;
  onClearSelection: () => void;
  instance: InstanceActions;
}>): ReactElement {
  if (isFrozen) {
    return <p className="text-[11px] text-gray-400">選択は凍結中</p>;
  }

  if (!controls.some) {
    return <p className="text-gray-500 text-sm">選択されていません</p>;
  }

  return (
    <div className="flex flex-col items-start gap-3 text-sm">
      <SelectionBody
        controls={controls.value}
        onEdit={onEditProp}
        instance={instance}
      />
      <button
        type="button"
        onClick={onClearSelection}
        className="rounded border border-gray-300 px-2 py-1 text-sm hover:bg-gray-100"
      >
        選択を解除
      </button>
    </div>
  );
}

/**
 * プロパティパネル（docs/06-ui.md「画面構成」。
 * UI 案 docs/Design Composer.html のインスペクタ）。
 *
 * 見出しの帯には選んでいるものを出す。何も選んでいないときも**帯は残す**
 * （消すと選択のたびに本文の位置が帯のぶん動く）。
 *
 * 入力欄はスキーマ定数の走査だけで決まる（`SelectionControls.forSelection`）ため、
 * ここには prop 名で分岐するコードを置かない。
 */
export function PropertyPanel({
  state,
  onEditProp,
  onClearSelection,
  instance,
}: Readonly<{
  state: EditorState;
  onEditProp: (edit: PropEdit) => void;
  onClearSelection: () => void;
  instance: InstanceActions;
}>) {
  /*
   * 帯と本文を同じ 1 つの `controls` から出し分ける。別々に導くと
   * 「帯は件数なのに本文はインスタンスの編集欄」という食い違いが作れる。
   */
  const controls = SelectionControls.forSelection(
    EditorState.documentSelection(state),
    InstanceComposition.isDetachable,
  );

  return (
    <>
      <EditorLayout.RightPane.Heading>
        <SelectionHeading controls={controls} state={state} />
      </EditorLayout.RightPane.Heading>
      <EditorLayout.RightPane.Body>
        <InspectorBody
          isFrozen={EditorState.isFileInvalid(state)}
          controls={controls}
          onEditProp={onEditProp}
          onClearSelection={onClearSelection}
          instance={instance}
        />
      </EditorLayout.RightPane.Body>
    </>
  );
}
