import { type ReactElement, useId } from "react";
import type { PropEdit } from "@/domains/node";
import { EditorLayout } from "@/features/editor/components/editor-layout";
import { TypeGlyph } from "@/features/editor/components/type-glyph";
import { EditorState } from "@/features/editor/domains/editor-state";
import {
  PropControl,
  type PropControlSection,
  SelectionControls,
} from "@/features/editor/domains/prop-control";
import type {
  Selection,
  SelectionKind,
} from "@/features/editor/domains/selection";
import { CaseStyle } from "@/utils/CaseStyle";
import { Option } from "@/utils/Option";

const FIELD_CLASS = "w-full rounded border border-gray-300 px-2 py-1";

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
  id: string;
  control: PropControl;
}>;

/** 値域が列挙で決まっている prop の入力欄。 */
function ChoiceInput({
  field,
  options,
  onEdit,
}: Readonly<{
  field: FieldBinding;
  options: readonly string[];
  onEdit: (edit: PropEdit) => void;
}>) {
  const control = field.control;
  const value = Option.map(control.value, String);
  /*
   * ファイル由来の不正な値（存在しないトークン名など）も選択肢に出す。
   * 出さないと未指定と見分けが付かず、検証エラーの原因が画面から消える
   * （不正なドキュメントも描画は残る / docs/03-schema.md「不正ファイル時の挙動」）。
   */
  const selectable =
    value.some && !options.includes(value.value)
      ? [value.value, ...options]
      : options;

  return (
    <select
      id={field.id}
      className={FIELD_CLASS}
      value={Option.unwrapOr(value, "")}
      onChange={(event) =>
        onEdit(PropControl.editFrom(control, event.target.value))
      }
    >
      <option value="">{unsetLabel(control)}</option>
      {selectable.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

/** 値域が数値・文字列で決まっている prop の入力欄。 */
function LiteralInput({
  field,
  inputType,
  onEdit,
}: Readonly<{
  field: FieldBinding;
  inputType: "number" | "text";
  onEdit: (edit: PropEdit) => void;
}>) {
  const control = field.control;
  return (
    <input
      id={field.id}
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

/** prop 1 件の行。入力の形は値域から決まる。 */
function PropField({
  field,
  onEdit,
}: Readonly<{ field: FieldBinding; onEdit: (edit: PropEdit) => void }>) {
  const input = field.control.input;
  switch (input.kind) {
    case "choice":
      return (
        <ChoiceInput field={field} options={input.options} onEdit={onEdit} />
      );
    case "number":
      return <LiteralInput field={field} inputType="number" onEdit={onEdit} />;
    case "text":
      return <LiteralInput field={field} inputType="text" onEdit={onEdit} />;
  }
}

/**
 * 1 prop 分の行。表示名は prop 名の機械的な整形で作る
 * （docs/03-schema.md「表示名フィールドは持たない」）。
 */
function PropRow({
  control,
  onEdit,
}: Readonly<{ control: PropControl; onEdit: (edit: PropEdit) => void }>) {
  const id = useId();

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-gray-600 text-xs">
        {CaseStyle.toCapitalCase(control.prop)}
      </label>
      <PropField field={{ id, control }} onEdit={onEdit} />
    </div>
  );
}

/** 見出しでまとめた prop の並び（Layout / Size / Appearance）。 */
function GroupSection({
  section,
  onEdit,
}: Readonly<{
  section: PropControlSection;
  onEdit: (edit: PropEdit) => void;
}>) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-semibold text-gray-400 text-xs uppercase">
        {CaseStyle.toCapitalCase(section.group)}
      </h3>
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
    <p className="text-gray-400 text-xs">
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
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-400 text-xs uppercase">
            {INSTANCE_LABELS.publicProps}
          </h3>
          <span className="text-gray-400 text-xs">{publicProps.length}</span>
        </div>
        {publicProps.map((control) => (
          <PublicPropRow key={control.prop} control={control} onEdit={onEdit} />
        ))}
      </section>

      <section className="flex flex-col gap-2 border-gray-200 border-t pt-3">
        <h3 className="font-semibold text-gray-400 text-xs uppercase">
          {INSTANCE_LABELS.instance}
        </h3>
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
    <div className="flex w-full flex-col gap-4">
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
 * プロパティパネル（docs/06-ui.md「画面構成」。
 * UI 案 docs/Design Composer.html のインスペクタ）。
 *
 * 見出しの帯には選んでいるものを出す。何も選んでいないときも**帯は残す**
 * （消すと選択のたびに本文の位置が帯のぶん動く）。
 *
 * 入力欄はスキーマ定数の走査だけで決まる（`SelectionControls.forSelection`）ため、
 * ここには prop 名で分岐するコードを置かない。
 *
 * Why not: インスタンスの行だけを UI 案どおりの横並び（ラベル左・入力右）にはしない。
 * パネルの他の行はすべて縦積みで、ここだけ変えると同じパネルに行の形が 2 つ並ぶ。
 * 乖離の解消は個別の issue で行う（`rules/ui-verification.md`）。
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
  const controls = SelectionControls.forSelection(state);

  return (
    <>
      <EditorLayout.RightPane.Heading>
        {selection.some ? <SelectionTitle selection={selection.value} /> : null}
      </EditorLayout.RightPane.Heading>
      <EditorLayout.RightPane.Body>
        {controls.some ? (
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
        ) : (
          <p className="text-gray-500 text-sm">選択されていません</p>
        )}
      </EditorLayout.RightPane.Body>
    </>
  );
}
