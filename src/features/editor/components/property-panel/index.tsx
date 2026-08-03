import { useId } from "react";
import type { PropEdit, PropValue } from "@/domains/node";
import type { EditorState } from "@/features/editor/domains/editor-state";
import {
  type PropControl,
  PropControlSection,
} from "@/features/editor/domains/prop-control";
import { CaseStyle } from "@/utils/CaseStyle";
import { Option } from "@/utils/Option";

const FIELD_CLASS = "w-full rounded border border-gray-300 px-2 py-1";

/**
 * 未指定のときに何が効くかを出す（#34「未指定 prop はデフォルト値を
 * プレースホルダ等で表示し、明示設定と区別する」）。
 */
function unsetLabel(control: PropControl): string {
  return control.defaultValue.some
    ? `未指定（既定: ${control.defaultValue.value}）`
    : "未指定";
}

/** 入力された文字列を prop の値に戻す。空文字は「未設定に戻す」。 */
function toPropEdit(
  control: PropControl,
  raw: string,
  toValue: (raw: string) => PropValue,
): PropEdit {
  return {
    name: control.prop,
    value: raw === "" ? Option.none : Option.some(toValue(raw)),
  };
}

/** ラベルと入力欄を結び付ける識別子と、その prop のコントロール。 */
type FieldBinding = Readonly<{
  id: string;
  control: PropControl;
}>;

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
        onEdit(toPropEdit(control, event.target.value, (raw) => raw))
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
        onEdit(
          toPropEdit(control, event.target.value, (raw) =>
            inputType === "number" ? Number(raw) : raw,
          ),
        )
      }
    />
  );
}

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
 * プロパティパネル（docs/06-ui.md「画面構成」）。
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
  const selectedName = state.selectedName;
  const sections = PropControlSection.forSelection(state);

  if (!selectedName.some) {
    return (
      <section className="text-sm">
        <h2 className="mb-2 font-semibold text-gray-500 text-xs uppercase">
          プロパティ
        </h2>
        <p className="text-gray-500">選択されていません</p>
      </section>
    );
  }

  return (
    <section className="text-sm">
      <h2 className="mb-2 font-semibold text-gray-500 text-xs uppercase">
        プロパティ
      </h2>
      <div className="flex flex-col items-start gap-3">
        <p>
          選択中: <span className="font-medium">{selectedName.value}</span>
        </p>
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
          className="rounded border border-gray-300 px-2 py-1 hover:bg-gray-100"
        >
          選択を解除
        </button>
      </div>
    </section>
  );
}
