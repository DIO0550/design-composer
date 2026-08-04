import { useReducer } from "react";
import type { PropEdit } from "@/domains/node";
import type { EditorState } from "@/features/editor/domains/editor-state";
import { CanvasBounds } from "@/features/editor/domains/node-drop";
import {
  EditableText,
  TextInlineEdit,
} from "@/features/editor/domains/text-inline-edit";
import { CanvasDom } from "@/libs/canvas-dom";
import { Option } from "@/utils/Option";

/** インライン編集の進み方（docs/06-ui.md「Text のインライン編集」）。 */
type TextInlineEditAction =
  | Readonly<{ type: "start"; text: EditableText; bounds: CanvasBounds }>
  | Readonly<{ type: "change"; draft: string }>
  | Readonly<{ type: "end" }>;

/** アクションの解釈だけを行い、状態の組み立ては TextInlineEdit に委ねる。 */
function textInlineEditReducer(
  edit: Option<TextInlineEdit>,
  action: TextInlineEditAction,
): Option<TextInlineEdit> {
  switch (action.type) {
    case "start":
      return Option.some(TextInlineEdit.create(action.text, action.bounds));
    case "change":
      return Option.map(edit, (current) =>
        TextInlineEdit.withDraft(current, action.draft),
      );
    case "end":
      // 確定でも取り消しでも、編集そのものは同じように終わる（下書きは残さない）。
      return Option.none;
  }
}

export type TextInlineEditControl = Readonly<{
  /** 編集中なら下書きと入力欄を重ねる位置。編集していなければ `none`。 */
  edit: Option<TextInlineEdit>;
  /**
   * ダブルクリックされた位置の Text の編集を始める。
   * `names` は押された位置から外へ辿ったノード名。編集できるものが無ければ何も起きない。
   */
  start: (names: readonly string[]) => void;
  change: (draft: string) => void;
  /** 下書きを `content` の編集としてドキュメントへ渡し、編集を終える。 */
  commit: () => void;
  /** 下書きを捨てて編集を終える（ドキュメントは変わらない）。 */
  cancel: () => void;
}>;

/**
 * キャンバス上の Text のダブルクリックを「文言のその場編集」として解釈する
 * （docs/06-ui.md「キャンバス直接操作」）。
 *
 * このフックが持つのは DOM の実測とイベントの仲介だけで、
 * 「どれを編集できるか」「下書きがどんな編集になるか」の判定は `text-inline-edit` にある。
 *
 * 確定した文言を `PropEdit` として渡すのは、プロパティパネルからの `content` の編集と
 * 同じ経路（`apply_prop_edit`）に載せるため。自動保存もその経路に乗る。
 */
export function useTextInlineEdit(
  params: Readonly<{
    state: EditorState;
    onEditProp: (edit: PropEdit) => void;
  }>,
): TextInlineEditControl {
  const [edit, dispatch] = useReducer(textInlineEditReducer, Option.none);

  const start = (names: readonly string[]) => {
    const text = EditableText.at(params.state, names);
    if (!text.some) {
      return;
    }
    const element = CanvasDom.elementOf(text.value.name);
    if (!element.some) {
      return;
    }
    dispatch({
      type: "start",
      text: text.value,
      bounds: CanvasBounds.ofElement(element.value),
    });
  };

  /*
   * 確定の書き込み先は選択中のもの（`EditorState.applyPropEdit`）。編集中は入力欄が
   * フォーカスを持っており、ほかを選ぶ操作は必ずフォーカスを外す = 先に確定するため、
   * 別のものを選んだまま下書きが残ることはない。
   */
  const commit = () => {
    if (!edit.some) {
      return;
    }
    params.onEditProp(TextInlineEdit.toPropEdit(edit.value));
    dispatch({ type: "end" });
  };

  return {
    edit,
    start,
    change: (draft: string) => dispatch({ type: "change", draft }),
    commit,
    cancel: () => dispatch({ type: "end" }),
  };
}
