import { type ReactElement, useId } from "react";
import { ColorSwatch } from "@/components/color-swatch";
import { SegmentedControl } from "@/components/segmented-control";
import type { PropEdit } from "@/domains/node";
import { EditorLayout } from "@/features/editor/components/editor-layout";
import { TypeGlyph } from "@/features/editor/components/type-glyph";
import { EditorState } from "@/features/editor/domains/editor-state";
import {
  PropControl,
  type PropControlInput,
  type PropControlSection,
  SelectionControls,
} from "@/features/editor/domains/prop-control";
import type {
  Selection,
  SelectionKind,
} from "@/features/editor/domains/selection";
import { CaseStyle } from "@/utils/CaseStyle";
import { Option } from "@/utils/Option";

const FIELD_CLASS =
  "h-7 w-full rounded-md border border-gray-300 px-2 text-[11px]";

/**
 * ラベル欄の幅。UI 案の 52px では `Width Mode` / `Padding X` が収まらない。
 * 変えたら `CONTROL_OFFSET_CLASS` も一緒に動かす（片方だけ変えると字下げがずれる）。
 */
const LABEL_CLASS = "w-[4.25rem] shrink-0 truncate text-[11px] text-gray-500";

/**
 * ラベル欄の右、コントロールの左端へ揃えるための字下げ。
 * ラベル欄 4.25rem + ラベルとコントロールの間隔 0.5rem。
 */
const CONTROL_OFFSET_CLASS = "pl-[4.75rem]";

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

/** ラベルと入力欄を結び付ける識別子と、その prop のコントロール。 */
type FieldBinding = Readonly<{
  labelledBy: string;
  control: PropControl;
}>;

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
  onEdit,
}: Readonly<{
  field: FieldBinding;
  names: readonly string[];
  describedBy?: string;
  onEdit: (edit: PropEdit) => void;
}>): ReactElement {
  const control = field.control;

  return (
    <select
      aria-labelledby={field.labelledBy}
      aria-describedby={describedBy}
      className={FIELD_CLASS}
      value={Option.unwrapOr(Option.map(control.value, String), "")}
      onChange={(event) =>
        onEdit(PropControl.editFrom(control, event.target.value))
      }
    >
      <option value="">{unsetLabel(control)}</option>
      {names.map((name) => (
        <option key={name} value={name}>
          {name}
        </option>
      ))}
    </select>
  );
}

/**
 * 数値のトークンを選ぶ入力欄。解決後の値を右に添える（UI 案 docs/Design Composer.html
 * の `gap` は `lg` の右端に `20`、`radius` は `md` の右端に `8` を出す）。
 *
 * 読み上げへ繋ぐのは、この数値が `<select>` の読み上げ（トークン名だけ）からは
 * 得られない情報だから。色の見本が `aria-hidden` なのは、何の色かを隣のトークン名が
 * 既に伝えているからで、こちらは事情が違う。
 *
 * Why not: 数値を欄の内側に置かない。理由は色の見本と同じで、ネイティブの
 * `<select>` の中には要素を描けない。
 *
 * 欄と数値を横に並べているのは class の違いにしかならないので、**崩れに気づける
 * 手段は Storybook の視覚差分だけ**（happy-dom は Tailwind を解決しない）。
 *
 * @returns 解決できたトークンならその値を右に添えた選択欄、解決できなければ選択欄だけ
 */
function NumericTokenField({
  field,
  input,
  onEdit,
}: Readonly<{
  field: FieldBinding;
  input: Extract<PropControlInput, { kind: "numericToken" }>;
  onEdit: (edit: PropEdit) => void;
}>): ReactElement {
  const describedBy = useId();
  const resolvedValue = input.resolvedValue;

  if (!resolvedValue.some) {
    return <TokenSelect field={field} names={input.names} onEdit={onEdit} />;
  }
  return (
    <div className="flex items-center gap-2">
      <TokenSelect
        field={field}
        names={input.names}
        describedBy={describedBy}
        onEdit={onEdit}
      />
      <span id={describedBy} className="text-[10px] text-gray-400">
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
  onEdit,
}: Readonly<{
  field: FieldBinding;
  inputType: "number" | "text";
  onEdit: (edit: PropEdit) => void;
}>): ReactElement {
  const control = field.control;

  return (
    <input
      aria-labelledby={field.labelledBy}
      type={inputType}
      className={FIELD_CLASS}
      value={Option.unwrapOr(Option.map(control.value, String), "")}
      placeholder={unsetLabel(control)}
      onChange={(event) =>
        onEdit(PropControl.editFrom(control, event.target.value))
      }
    />
  );
}

/**
 * prop 1 件の入力欄。入力の形は値域から決まる。
 *
 * 戻り値を `ReactElement` と書いているのは、入力の種類を足して `case` を足し忘れた
 * ときにコンパイルエラーにするため（`rules/coding.md`「列挙した状態の網羅を型で強制する」）。
 *
 * @returns 値域に応じた入力欄
 */
function PropField({
  field,
  onEdit,
}: Readonly<{
  field: FieldBinding;
  onEdit: (edit: PropEdit) => void;
}>): ReactElement {
  const control = field.control;
  const input = control.input;

  switch (input.kind) {
    case "enum":
      return (
        <SegmentedControl
          labelledBy={field.labelledBy}
          options={input.values}
          value={Option.map(control.value, String)}
          onChange={(next) => onEdit(PropControl.edit(control, next))}
        />
      );
    case "token":
      return <TokenSelect field={field} names={input.names} onEdit={onEdit} />;
    case "numericToken":
      return <NumericTokenField field={field} input={input} onEdit={onEdit} />;
    /*
     * Why not: 見本を欄の内側に置かない（UI 案 docs/Design Composer.html は内側）。
     * ネイティブの `<select>` の中には要素を描けず、内側に置くには一覧そのものを
     * 自作することになる（キーボード操作と読み上げを自前で持つ）。
     */
    case "colorToken":
      return (
        <div className="flex items-center gap-2">
          {input.color.some ? <ColorSwatch color={input.color.value} /> : null}
          <TokenSelect field={field} names={input.names} onEdit={onEdit} />
        </div>
      );
    case "number":
      return <LiteralInput field={field} inputType="number" onEdit={onEdit} />;
    case "text":
      return <LiteralInput field={field} inputType="text" onEdit={onEdit} />;
  }
}

/**
 * 1 prop 分の行。UI 案（docs/Design Composer.html）はラベル左・コントロール右で並べる。
 * 表示名は prop 名の機械的な整形で作る（docs/03-schema.md「表示名フィールドは持たない」）。
 *
 * 条件付きの prop はラベルを出さず字下げする（UI 案は `width` の数値欄をモードの行の
 * 下へぶら下げている）。条件を出している行の**直下**に来るのはスキーマの宣言順に
 * 依っており（`BOX_SCHEMA` は `widthMode` の直後に `width` を宣言する）、順が変われば
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
            ? `flex items-center ${CONTROL_OFFSET_CLASS}`
            : "flex items-center gap-2"
        }
      >
        <span id={labelledBy} className={isDependent ? "sr-only" : LABEL_CLASS}>
          {CaseStyle.toCapitalCase(control.prop)}
        </span>
        <div className="min-w-0 flex-1">
          <PropField field={{ labelledBy, control }} onEdit={onEdit} />
        </div>
      </div>
      {showsUnsetNote ? (
        <p className={`text-gray-400 text-xs ${CONTROL_OFFSET_CLASS}`}>
          {unsetLabel(control)}
        </p>
      ) : null}
    </div>
  );
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

/** 見出しでまとめた prop の並び（Layout / Size / Appearance）。UI 案は罫線で区切る。 */
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
      {section.controls.map((control) => (
        <PropRow key={control.prop} control={control} onEdit={onEdit} />
      ))}
    </div>
  );
}

/*
 * インスタンスの節の綴りは UI 案 docs/Design Composer.html の `Assets · Instance`
 * 画面から採る。日本語にしないのは、同じ画面の `Public props` / `Assets` /
 * `Components` が既に UI 案の綴りのままで、片方だけ訳すと節の名前が混ざるため。
 */
const INSTANCE_LABELS = {
  from: "from",
  publicProps: "Public props",
  instance: "Instance",
  goToSource: "Go to source component",
  detach: "Detach instance",
  detachNote:
    "Detach bakes overrides into a real tree and auto-renames inner nodes.",
  overridden: "overridden",
  footnote:
    "Only declared publicProps are editable. New declarations come from AI or JSON editing.",
} as const;

/** 解除できないときに、ボタンの `title` へ出す理由（挿入ボタンと同じ扱い）。 */
const DETACH_DISABLED_REASON = "参照先の部品が見つからないため解除できません";

/** インスタンスの節から呼ぶ操作。常に対で要るので 1 つにまとめて受け取る。 */
export type InstanceActions = Readonly<{
  goToSource: () => void;
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
    <p className={`text-gray-400 text-xs ${CONTROL_OFFSET_CLASS}`}>
      {INSTANCE_LABELS.overridden}
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
 *
 * Why not: `Select all N instances` は置かない。同じ部品を指すインスタンスを
 * まとめて選ぶには選択を複数持てる必要があり、押しても何も起きないボタンに
 * なるため（#161 で選択の持ち方と一緒に入れる）。
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

  return (
    <div className="flex w-full flex-col gap-4">
      <p className="flex items-center gap-1.5 text-gray-400 text-xs">
        {INSTANCE_LABELS.from}
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
          {INSTANCE_LABELS.publicProps}
        </SectionHeading>
        {publicProps.map((control) => (
          <PublicPropRow key={control.prop} control={control} onEdit={onEdit} />
        ))}
      </section>

      <section className="flex flex-col gap-2 border-gray-200 border-t pt-3">
        <SectionHeading>{INSTANCE_LABELS.instance}</SectionHeading>
        <button
          type="button"
          onClick={actions.goToSource}
          className="rounded border border-gray-300 px-2 py-1 text-left text-sm hover:bg-gray-100"
        >
          {INSTANCE_LABELS.goToSource}
        </button>
        <button
          type="button"
          onClick={actions.detach}
          disabled={!controls.isDetachEnabled}
          title={controls.isDetachEnabled ? undefined : DETACH_DISABLED_REASON}
          className="rounded border border-gray-300 px-2 py-1 text-left text-sm hover:bg-gray-100 disabled:opacity-50"
        >
          {INSTANCE_LABELS.detach}
        </button>
        <p className="text-gray-400 text-xs">{INSTANCE_LABELS.detachNote}</p>
      </section>

      <p className="border-gray-200 border-t pt-3 text-gray-400 text-xs">
        {INSTANCE_LABELS.footnote}
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
}>): ReactElement {
  switch (controls.kind) {
    case "instance":
      return (
        <InstanceBody controls={controls} onEdit={onEdit} actions={instance} />
      );
    case "groups":
      return <GroupsBody sections={controls.sections} onEdit={onEdit} />;
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
const KIND_LABELS = {
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
          {KIND_LABELS[kind.value]}
        </span>
      ) : null}
    </>
  );
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
  state,
  onEditProp,
  onClearSelection,
  instance,
}: Readonly<{
  state: EditorState;
  onEditProp: (edit: PropEdit) => void;
  onClearSelection: () => void;
  instance: InstanceActions;
}>): ReactElement {
  if (EditorState.isFileInvalid(state)) {
    return <p className="text-[11px] text-gray-400">選択は凍結中</p>;
  }

  const controls = SelectionControls.forSelection(state);
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
  const selection = EditorState.selection(state);

  return (
    <>
      <EditorLayout.RightPane.Heading>
        {selection.some ? <SelectionTitle selection={selection.value} /> : null}
      </EditorLayout.RightPane.Heading>
      <EditorLayout.RightPane.Body>
        <InspectorBody
          state={state}
          onEditProp={onEditProp}
          onClearSelection={onClearSelection}
          instance={instance}
        />
      </EditorLayout.RightPane.Body>
    </>
  );
}
