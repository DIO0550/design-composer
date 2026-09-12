import { EditorState } from "@/features/editor/domains/editor-state";
import { ReorderSteps } from "@/features/editor/domains/reorder-step";
import type { ValueOf } from "@/types/ValueOf";

/**
 * 右クリックの対象（docs/06-ui.md「コンテキストメニュー」の 3 つ）。押された場所が決める
 * もので、選択からは導けない。
 */
export const EditMenuTargets = {
  Node: "node",
  Artboard: "artboard",
  EmptyArea: "empty-area",
} as const;

/** 右クリックの対象。 */
export type EditMenuTarget = ValueOf<typeof EditMenuTargets>;

export const EditMenuTarget = {
  /**
   * 押された位置から外へ辿った名前から対象を決める。名前の末尾は必ずその artboard 自身
   * なので、1 つだけなら artboard の枠か見出しを押したことになる。
   *
   * @param names 押された位置から外へ辿った名前（内→外）
   * @returns 名前が空なら空き領域、1 つだけなら artboard、それより多ければノード
   */
  fromNames(names: readonly string[]): EditMenuTarget {
    if (names.length === 0) {
      return EditMenuTargets.EmptyArea;
    }
    return names.length === 1 ? EditMenuTargets.Artboard : EditMenuTargets.Node;
  },
} as const;

/** メニューから行える編集操作。 */
export const EditOperations = {
  Copy: "copy",
  Paste: "paste",
  Rename: "rename",
  BringForward: "bring-forward",
  SendBackward: "send-backward",
  DetachInstance: "detach-instance",
  Delete: "delete",
  Undo: "undo",
  Redo: "redo",
} as const;

/** メニューから行える編集操作。 */
export type EditOperation = ValueOf<typeof EditOperations>;

/** メニューの 1 行。 */
export type EditMenuRow = Readonly<{
  operation: EditOperation;
  /** 今その操作ができるか。できない行も消さずに並べる。 */
  isEnabled: boolean;
}>;

/** 対象ごとのメニュー。組のあいだに区切りが入る。 */
export type EditMenu = Readonly<{
  groups: readonly (readonly EditMenuRow[])[];
}>;

/**
 * 対象ごとに並ぶ操作と、その組の分かれ目（docs/06-ui.md「コンテキストメニュー」の表）。
 *
 * docs が挙げる並びのうち、実装が無い操作（複製・グループ化・解除）と部品化は並べない。
 * 状態に依らず永久に押せない行は入口として働かないため。
 */
const OperationGroups = {
  node: [
    [EditOperations.Copy, EditOperations.Paste],
    [EditOperations.Rename],
    [EditOperations.BringForward, EditOperations.SendBackward],
    [EditOperations.DetachInstance],
    [EditOperations.Delete],
  ],
  artboard: [[EditOperations.Rename], [EditOperations.Delete]],
  "empty-area": [
    [EditOperations.Paste],
    [EditOperations.Undo, EditOperations.Redo],
  ],
} as const satisfies Readonly<
  Record<EditMenuTarget, readonly (readonly EditOperation[])[]>
>;

/**
 * 今その操作ができるか。状態側が「その操作は存在しない」と答えるか（`none` を返すか）で
 * 決め、押せるかどうかの規則をここで書き直さない。
 *
 * @param state 押せるかどうかの出どころになる編集状態
 * @param operation 見ている操作
 * @returns その操作が今の状態で成り立つなら `true`
 */
function isEnabled(state: EditorState, operation: EditOperation): boolean {
  switch (operation) {
    case "copy":
      return EditorState.copyNode(state).some;
    case "paste":
      return EditorState.pasteNode(state).some;
    case "rename":
      return EditorState.startRenaming(state).some;
    case "bring-forward":
      return EditorState.reorderSelectedNode(state, ReorderSteps.TowardFront)
        .some;
    case "send-backward":
      return EditorState.reorderSelectedNode(state, ReorderSteps.TowardBack)
        .some;
    case "detach-instance":
      return EditorState.detachInstance(state).some;
    case "delete":
      return EditorState.removeSelected(state).some;
    case "undo":
      return EditorState.undo(state).some;
    case "redo":
      return EditorState.redo(state).some;
  }
}

export const EditMenu = {
  /**
   * 右クリックの対象に対して並べるメニュー。
   *
   * @param state 押せるかどうかの出どころになる編集状態
   * @param target 押された場所が決めた対象
   * @returns 区切りで分かれた行の組
   */
  create(state: EditorState, target: EditMenuTarget): EditMenu {
    return {
      groups: OperationGroups[target].map((group) =>
        group.map((operation) => ({
          operation,
          isEnabled: isEnabled(state, operation),
        })),
      ),
    };
  },
} as const;
