import { useId } from "react";
import type { PropEdit } from "@/domains/node";
import { EditorLayout } from "@/features/editor/components/editor-layout";
import { TypeGlyph } from "@/features/editor/components/type-glyph";
import { EditorState } from "@/features/editor/domains/editor-state";
import {
  PropControl,
  PropControlSection,
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
 * 入力欄はスキーマ定数の走査だけで決まる（`PropControlSection.forSelection`）ため、
 * ここには prop 名で分岐するコードを置かない。
 */
export function PropertyPanel({
  state,
  onEditProp,
  onClearSelection,
}: Readonly<{
  state: EditorState;
  onEditProp: (edit: PropEdit) => void;
  onClearSelection: () => void;
}>) {
  const selection = EditorState.selection(state);
  const sections = PropControlSection.forSelection(state);

  return (
    <>
      <EditorLayout.RightPane.Heading>
        {selection.some ? <SelectionTitle selection={selection.value} /> : null}
      </EditorLayout.RightPane.Heading>
      <EditorLayout.RightPane.Body>
        {selection.some ? (
          <div className="flex flex-col items-start gap-3 text-sm">
            {sections.length === 0 ? (
              <p className="text-gray-500">編集できる prop がありません</p>
            ) : (
              <div className="flex w-full flex-col gap-4">
                {sections.map((section) => (
                  <GroupSection
                    key={section.group}
                    section={section}
                    onEdit={onEditProp}
                  />
                ))}
              </div>
            )}
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
