import type { ComponentProps, ReactElement } from "react";
import { ContextMenu, ContextMenuTones } from "@/components/context-menu";
import { useEditor } from "@/features/editor/components/editor-provider";
import {
  EditMenu,
  type EditOperation,
} from "@/features/editor/domains/edit-menu";
import {
  type ReorderStep,
  ReorderSteps,
} from "@/features/editor/domains/reorder-step";
import { CopyShortcut } from "@/features/editor/hooks/use-copy-shortcut";
import { DeleteShortcut } from "@/features/editor/hooks/use-delete-shortcut";
import { DuplicateShortcut } from "@/features/editor/hooks/use-duplicate-shortcut";
import {
  type EditActions,
  useEditActions,
} from "@/features/editor/hooks/use-edit-actions";
import { GroupShortcut } from "@/features/editor/hooks/use-group-shortcut";
import {
  type NodeActions,
  useNodeActions,
} from "@/features/editor/hooks/use-node-actions";
import { PasteShortcut } from "@/features/editor/hooks/use-paste-shortcut";
import { RedoShortcut } from "@/features/editor/hooks/use-redo-shortcut";
import { RenameShortcut } from "@/features/editor/hooks/use-rename-shortcut";
import { ReorderShortcuts } from "@/features/editor/hooks/use-reorder-shortcut";
import { UndoShortcut } from "@/features/editor/hooks/use-undo-shortcut";
import { UngroupShortcut } from "@/features/editor/hooks/use-ungroup-shortcut";
import type { OpenedContextMenu } from "@/features/editor/types/OpenedContextMenu";
import type { KeyShortcut, KeyTriggers } from "@/hooks/use-key-shortcut";
import {
  type OperatingSystem,
  OperatingSystems,
} from "@/libs/operating-system";
import type { NonEmptyArray } from "@/types/NonEmptyArray";
import { Option } from "@/utils/Option";

/**
 * 行に併記する割り当て。綴りは OS ごとに変わるので、ここではキーと修飾だけを持つ。
 */
type MenuShortcut =
  | Readonly<{ kind: "plain"; key: string }>
  | Readonly<{ kind: "command"; key: string; withShiftKey: boolean }>;

/**
 * 行に併記できるキーボードの割り当て。打たれた文字で待ち、キーを 1 つ以上持ち、修飾が
 * Shift だけではないもの。
 *
 * 物理キーの綴り（`Digit1` など）は打つ文字の綴りにならず、Shift だけの修飾は
 * `MenuShortcut` が表せないので、表に置いた時点で型エラーにする。
 */
export type ShowableKeyShortcut = Extract<
  KeyShortcut,
  { kind: typeof KeyTriggers.TypedCharacter }
> &
  Readonly<{ keys: NonEmptyArray<string> }> &
  (
    | Readonly<{ withCommandKey: true; withShiftKey: boolean }>
    | Readonly<{ withCommandKey: false; withShiftKey: false }>
  );

/**
 * キーボードの割り当てを、行に併記する割り当てにする。代表のキーは `keys` の先頭で、
 * 1 文字のキーだけ大文字にする。
 *
 * @param shortcut キーボードで実際に効く割り当て
 * @returns 併記する割り当て
 */
function menuShortcutFromKeyShortcut(
  shortcut: ShowableKeyShortcut,
): MenuShortcut {
  const [firstKey] = shortcut.keys;
  const key = firstKey.length === 1 ? firstKey.toUpperCase() : firstKey;

  return shortcut.withCommandKey
    ? { kind: "command", key, withShiftKey: shortcut.withShiftKey }
    : { kind: "plain", key };
}

/**
 * 行の見出し・併記に使うキーボードの割り当て・色味（押せるかどうかと押したときの手続きは
 * 状態から決まる）。
 */
type OperationPresentation = Readonly<
  Omit<
    ComponentProps<typeof ContextMenu.Item>,
    "isEnabled" | "onSelect" | "shortcut"
  > & { shortcut: Option<ShowableKeyShortcut> }
>;

/**
 * 並べ替えの操作ごとの向き。行に併記する割り当て（`OperationPresentations`）と押したときの
 * 手続き（`operationHandlers`）の両方がここから向きを引く。
 */
const OperationReorderSteps = {
  "bring-forward": ReorderSteps.TowardFront,
  "send-backward": ReorderSteps.TowardBack,
} as const satisfies Readonly<
  Record<Extract<EditOperation, "bring-forward" | "send-backward">, ReorderStep>
>;

/**
 * 操作ごとの綴り・併記する割り当て・色味（UI 案 docs/Design Composer.html の
 * `Context menu`）。割り当ては動いている OS の綴りで出す（`shortcutLabel`）。
 *
 * 割り当てはキーボードのフック（`use-*-shortcut`）の定数をそのまま置き、併記はそこから
 * 導く（`menuShortcutFromKeyShortcut`）。
 */
const OperationPresentations = {
  duplicate: {
    label: "Duplicate",
    shortcut: Option.some(DuplicateShortcut),
    tone: ContextMenuTones.Normal,
  },
  copy: {
    label: "Copy",
    shortcut: Option.some(CopyShortcut),
    tone: ContextMenuTones.Normal,
  },
  paste: {
    label: "Paste",
    shortcut: Option.some(PasteShortcut),
    tone: ContextMenuTones.Normal,
  },
  rename: {
    label: "Rename",
    shortcut: Option.some(RenameShortcut),
    tone: ContextMenuTones.Normal,
  },
  group: {
    label: "Group",
    shortcut: Option.some(GroupShortcut),
    tone: ContextMenuTones.Normal,
  },
  ungroup: {
    label: "Ungroup",
    shortcut: Option.some(UngroupShortcut),
    tone: ContextMenuTones.Normal,
  },
  "bring-forward": {
    label: "Bring forward",
    shortcut: Option.some(
      ReorderShortcuts[OperationReorderSteps["bring-forward"]],
    ),
    tone: ContextMenuTones.Normal,
  },
  "send-backward": {
    label: "Send backward",
    shortcut: Option.some(
      ReorderShortcuts[OperationReorderSteps["send-backward"]],
    ),
    tone: ContextMenuTones.Normal,
  },
  "detach-instance": {
    label: "Detach instance",
    shortcut: Option.none,
    tone: ContextMenuTones.Normal,
  },
  delete: {
    label: "Delete",
    shortcut: Option.some(DeleteShortcut),
    tone: ContextMenuTones.Danger,
  },
  undo: {
    label: "Undo",
    shortcut: Option.some(UndoShortcut),
    tone: ContextMenuTones.Normal,
  },
  redo: {
    label: "Redo",
    shortcut: Option.some(RedoShortcut),
    tone: ContextMenuTones.Normal,
  },
} as const satisfies Readonly<Record<EditOperation, OperationPresentation>>;

/**
 * 割り当てを、動いている OS の綴りにする（docs/06-ui.md「編集操作の一覧」の表記）。
 *
 * @param shortcut 併記する割り当て
 * @param operatingSystem アプリが動いている OS
 * @returns macOS なら `⌘X` / `Shift+⌘X`、それ以外なら `Ctrl+X` / `Ctrl+Shift+X`。修飾の無いキーはそのまま
 */
function shortcutLabel(
  shortcut: MenuShortcut,
  operatingSystem: OperatingSystem,
): string {
  switch (shortcut.kind) {
    case "plain":
      return shortcut.key;
    case "command":
      return commandShortcutLabel(shortcut, operatingSystem);
  }
}

/**
 * コマンドキー付きの割り当てを、動いている OS の綴りにする。
 *
 * @param shortcut コマンドキー付きの割り当て
 * @param operatingSystem アプリが動いている OS
 * @returns `shortcutLabel` の、コマンドキー付きの場合の綴り
 */
function commandShortcutLabel(
  shortcut: Extract<MenuShortcut, { kind: "command" }>,
  operatingSystem: OperatingSystem,
): string {
  switch (operatingSystem) {
    case OperatingSystems.MacOs:
      return shortcut.withShiftKey
        ? `Shift+⌘${shortcut.key}`
        : `⌘${shortcut.key}`;
    case OperatingSystems.Other:
      return shortcut.withShiftKey
        ? `Ctrl+Shift+${shortcut.key}`
        : `Ctrl+${shortcut.key}`;
  }
}

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
    "bring-forward": () =>
      edit.reorderSelected(OperationReorderSteps["bring-forward"]),
    "send-backward": () =>
      edit.reorderSelected(OperationReorderSteps["send-backward"]),
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
            const presentation: OperationPresentation =
              OperationPresentations[row.operation];

            return (
              <ContextMenu.Item
                key={row.operation}
                label={presentation.label}
                shortcut={Option.map(presentation.shortcut, (shortcut) =>
                  shortcutLabel(
                    menuShortcutFromKeyShortcut(shortcut),
                    operatingSystem,
                  ),
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
