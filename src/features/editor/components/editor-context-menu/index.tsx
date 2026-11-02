import type { ComponentProps, ReactElement } from "react";
import { ContextMenu, ContextMenuTones } from "@/components/context-menu";
import { ShortcutNotation } from "@/components/shortcut-notation";
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
import type { OperatingSystem } from "@/libs/operating-system";
import { Option } from "@/utils/Option";

/**
 * 修飾の無いキーの割り当て。
 *
 * @param key キーの綴り
 * @returns 併記する割り当て
 */
function plainShortcut(key: string): Option<ShortcutNotation> {
  return Option.some({ kind: "plain", key });
}

/**
 * コマンドキー（macOS の ⌘ / それ以外の Ctrl）付きの割り当て。
 *
 * @param key 修飾と組むキーの綴り
 * @returns 併記する割り当て
 */
function commandShortcut(key: string): Option<ShortcutNotation> {
  return Option.some({ kind: "command", key, withShiftKey: false });
}

/**
 * Shift とコマンドキー付きの割り当て。
 *
 * @param key 修飾と組むキーの綴り
 * @returns 併記する割り当て
 */
function shiftCommandShortcut(key: string): Option<ShortcutNotation> {
  return Option.some({ kind: "command", key, withShiftKey: true });
}

/** 表示のための綴りだけを持つ部分（押せるかどうかと押したときの手続きは状態から決まる）。 */
type OperationPresentation = Readonly<
  Omit<
    ComponentProps<typeof ContextMenu.Item>,
    "isEnabled" | "onSelect" | "shortcut"
  > & { shortcut: Option<ShortcutNotation> }
>;

/**
 * 操作ごとの綴り・併記する割り当て・色味（UI 案 docs/Design Composer.html の
 * `Context menu`）。割り当ては動いている OS の綴りで出す（`ShortcutNotation.toText`）。
 *
 * 割り当ての出どころはキーボードのフック（`use-*-shortcut`）。片方だけ変えると併記と
 * 実際の割り当てが食い違う。
 * フックから導かないのは、併記を持つ 10 個のフックの非公開の定数を公開し直す必要があり範囲外だから（#1254）。
 */
const OperationPresentations = {
  duplicate: {
    label: "Duplicate",
    shortcut: commandShortcut("D"),
    tone: ContextMenuTones.Normal,
  },
  copy: {
    label: "Copy",
    shortcut: commandShortcut("C"),
    tone: ContextMenuTones.Normal,
  },
  paste: {
    label: "Paste",
    shortcut: commandShortcut("V"),
    tone: ContextMenuTones.Normal,
  },
  rename: {
    label: "Rename",
    shortcut: commandShortcut("R"),
    tone: ContextMenuTones.Normal,
  },
  group: {
    label: "Group",
    shortcut: commandShortcut("G"),
    tone: ContextMenuTones.Normal,
  },
  ungroup: {
    label: "Ungroup",
    shortcut: shiftCommandShortcut("G"),
    tone: ContextMenuTones.Normal,
  },
  "bring-forward": {
    label: "Bring forward",
    shortcut: commandShortcut("]"),
    tone: ContextMenuTones.Normal,
  },
  "send-backward": {
    label: "Send backward",
    shortcut: commandShortcut("["),
    tone: ContextMenuTones.Normal,
  },
  "detach-instance": {
    label: "Detach instance",
    shortcut: Option.none,
    tone: ContextMenuTones.Normal,
  },
  delete: {
    label: "Delete",
    shortcut: plainShortcut("Delete"),
    tone: ContextMenuTones.Danger,
  },
  undo: {
    label: "Undo",
    shortcut: commandShortcut("Z"),
    tone: ContextMenuTones.Normal,
  },
  redo: {
    label: "Redo",
    shortcut: shiftCommandShortcut("Z"),
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
    duplicate: edit.duplicateSelected,
    copy: edit.copy,
    paste: edit.paste,
    rename: edit.startRenaming,
    group: edit.groupSelected,
    ungroup: edit.ungroupSelected,
    "bring-forward": () => edit.reorderSelected(ReorderSteps.TowardFront),
    "send-backward": () => edit.reorderSelected(ReorderSteps.TowardBack),
    "detach-instance": node.detachInstance,
    delete: edit.removeSelected,
    undo: edit.undo,
    redo: edit.redo,
  };
}

/**
 * 編集画面のコンテキストメニュー（docs/06-ui.md「コンテキストメニュー」）。並ぶものと押せる
 * かどうかは `EditMenu` が状態から決め、ここは綴り・割り当て・色味を着せて器へ渡す。
 *
 * @returns 対象に対してできる操作を並べたメニュー
 */
export function EditorContextMenu({
  opened,
  operatingSystem,
  onClose,
}: Readonly<{
  opened: OpenedContextMenu;
  /** 割り当ての綴りを選ぶのに使う、アプリが動いている OS。 */
  operatingSystem: OperatingSystem;
  onClose: () => void;
}>): ReactElement {
  const { state } = useEditor();
  const edit = useEditActions();
  const node = useNodeActions();
  const handlers = operationHandlers(edit, node);
  const menu = EditMenu.create(state, opened.target);

  return (
    <ContextMenu at={opened.at} onClose={onClose}>
      {menu.sections.map((section) => (
        // 節に id が無いので操作を鍵にする（同じ操作は 1 つのメニューに 2 度出ない）
        <ContextMenu.List key={section.map((row) => row.operation).join()}>
          {section.map((row) => {
            const presentation = OperationPresentations[row.operation];

            return (
              <ContextMenu.Item
                key={row.operation}
                label={presentation.label}
                shortcut={Option.map(presentation.shortcut, (shortcut) =>
                  ShortcutNotation.toText(shortcut, operatingSystem),
                )}
                tone={presentation.tone}
                isEnabled={row.isEnabled}
                onSelect={handlers[row.operation]}
              />
            );
          })}
        </ContextMenu.List>
      ))}
    </ContextMenu>
  );
}
