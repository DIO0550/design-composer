import type { ComponentProps, ReactElement } from "react";
import { ContextMenu, ContextMenuTones } from "@/components/context-menu";
import { useEditor } from "@/features/editor/components/editor-provider";
import {
  EditMenu,
  type EditOperation,
} from "@/features/editor/domains/edit-menu";
import { ReorderSteps } from "@/features/editor/domains/reorder-step";
import {
  type EditActions,
  useEditActions,
} from "@/features/editor/hooks/use-edit-actions";
import {
  type NodeActions,
  useNodeActions,
} from "@/features/editor/hooks/use-node-actions";
import type { OpenedContextMenu } from "@/features/editor/types/OpenedContextMenu";
import { Option } from "@/utils/Option";

/** 表示のための綴りだけを持つ部分（押せるかどうかと押したときの手続きは状態から決まる）。 */
type OperationPresentation = Omit<
  ComponentProps<typeof ContextMenu.Item>,
  "isEnabled" | "onSelect"
>;

/**
 * 操作ごとの綴り・併記する割り当て・色味（UI 案 docs/Design Composer.html の
 * `Context menu`）。
 *
 * 出すのは macOS の綴りだけで、Windows の `Ctrl` 側へは出し分けていない。割り当てを持た
 * ない操作では欄ごと出さない（空欄にすると「割り当てが無い」と「載せないと決めた」が読み
 * 分けられなくなる / docs/06-ui.md）。
 *
 * キーは操作を引く見出しで、値は表示の綴りなので据え置く
 * （rules/naming.md「対応表のキーを PascalCase にするのは「キーが値の別名」のときだけ」）。
 */
const OperationPresentations = {
  copy: {
    label: "Copy",
    shortcut: Option.some("⌘C"),
    tone: ContextMenuTones.Normal,
  },
  paste: {
    label: "Paste",
    shortcut: Option.some("⌘V"),
    tone: ContextMenuTones.Normal,
  },
  "bring-forward": {
    label: "Bring forward",
    shortcut: Option.some("⌘]"),
    tone: ContextMenuTones.Normal,
  },
  "send-backward": {
    label: "Send backward",
    shortcut: Option.some("⌘["),
    tone: ContextMenuTones.Normal,
  },
  "detach-instance": {
    label: "Detach instance",
    shortcut: Option.none,
    tone: ContextMenuTones.Normal,
  },
  delete: {
    label: "Delete",
    shortcut: Option.some("Delete"),
    tone: ContextMenuTones.Danger,
  },
  undo: {
    label: "Undo",
    shortcut: Option.some("⌘Z"),
    tone: ContextMenuTones.Normal,
  },
  redo: {
    label: "Redo",
    shortcut: Option.some("Shift+⌘Z"),
    tone: ContextMenuTones.Normal,
  },
} as const satisfies Readonly<Record<EditOperation, OperationPresentation>>;

/**
 * 操作ごとに呼ぶ手続き。キーボードの割り当てと同じものを呼ぶ。
 *
 * @param edit キーボードの割り当てと共有する編集操作
 * @param node 画面の部品から届く操作（ここから使うのはインスタンスの解除だけ）
 * @returns 操作から手続きを引く表
 */
function operationHandlers(
  edit: EditActions,
  node: NodeActions,
): Readonly<Record<EditOperation, () => void>> {
  return {
    copy: edit.copy,
    paste: edit.paste,
    "bring-forward": () => edit.reorderSelected(ReorderSteps.TowardFront),
    "send-backward": () => edit.reorderSelected(ReorderSteps.TowardBack),
    "detach-instance": node.detachInstance,
    delete: edit.removeSelected,
    undo: edit.undo,
    redo: edit.redo,
  };
}

/**
 * 編集画面のコンテキストメニュー（docs/06-ui.md「コンテキストメニュー」）。
 *
 * 並ぶものと押せるかどうかは `EditMenu` が状態から決め、ここは綴り・割り当て・色味を着せて
 * 器へ渡す。
 *
 * @returns 対象に対してできる操作を並べたメニュー
 */
export function EditorContextMenu({
  opened,
  onClose,
}: Readonly<{
  opened: OpenedContextMenu;
  onClose: () => void;
}>): ReactElement {
  const { state } = useEditor();
  const edit = useEditActions();
  const node = useNodeActions();
  const handlers = operationHandlers(edit, node);
  const menu = EditMenu.create(state, opened.target);

  return (
    <ContextMenu at={opened.at} onClose={onClose}>
      {menu.groups.map((group) => (
        /*
         * 組にも行にも id が無いので、並んでいる操作そのものを鍵にする（同じ操作は 1 つの
         * メニューに 2 度出ない）。
         */
        <ContextMenu.List key={group.map((row) => row.operation).join()}>
          {group.map((row) => (
            <ContextMenu.Item
              key={row.operation}
              {...OperationPresentations[row.operation]}
              isEnabled={row.isEnabled}
              onSelect={handlers[row.operation]}
            />
          ))}
        </ContextMenu.List>
      ))}
    </ContextMenu>
  );
}
