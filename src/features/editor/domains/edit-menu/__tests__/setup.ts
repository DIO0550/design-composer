import { expect } from "vitest";
import {
  DesignDocument,
  DocumentTemplate,
} from "@/domains/dcmp/design-document";
import { EditorState } from "@/features/editor/domains/editor-state";
import { Option } from "@/utils/Option";
import type { EditMenu, EditOperation } from "../index";

/**
 * `home` に Text の `title`、子を持てる Box の `panel`、部品インスタンスの `login` が
 * この順で並ぶ状態。
 *
 * 3 つ並べるのは、並べ替えの**片方だけが押せない状態**（先頭・末尾）と両方押せる状態を
 * 同じドキュメントから作るため。子を持てる Box を挟むのは、ペーストの貼り先がある状態を
 * 作るため（Text を選ぶと、コピー済みでも貼り先が無くて押せない）。
 *
 * @returns その並びを持つエディタの状態
 */
export function setupState(): EditorState {
  return EditorState.create(
    DesignDocument.create({
      tokens: DocumentTemplate.Default.tokens,
      components: DocumentTemplate.Default.components,
      artboards: [
        {
          name: "home",
          width: 375,
          height: 812,
          children: [
            { name: "title", type: "Text" },
            { name: "panel", type: "Box", children: [] },
            { name: "login", ref: "primary-button" },
          ],
        },
      ],
    }),
  );
}

/**
 * 名前で指したものを 1 つだけ選んだ状態。
 *
 * @param name 選ぶ artboard / ノードの名前
 * @returns それを選んだエディタの状態
 */
export function stateSelecting(name: string): EditorState {
  return EditorState.select(setupState(), name);
}

/**
 * メニューに並ぶ操作を、組の分かれ目を無視して 1 本の並びにする。
 *
 * @param menu 見ているメニュー
 * @returns 並ぶ順の操作
 */
export function operationsIn(menu: EditMenu): readonly EditOperation[] {
  return menu.groups.flat().map((row) => row.operation);
}

/**
 * メニューの中でその操作の行が押せるか。行が無ければテストを落とす。
 *
 * @param menu 見ているメニュー
 * @param operation 引きたい操作
 * @returns その行が押せるなら `true`
 */
export function isRowEnabled(
  menu: EditMenu,
  operation: EditOperation,
): boolean {
  const rows = menu.groups.flat().filter((row) => row.operation === operation);

  expect(rows).toHaveLength(1);
  return rows[0].isEnabled;
}

/**
 * 1 回編集したあとの状態（取り消せるものがある状態）。
 *
 * @returns `title` を消したあとのエディタの状態
 */
export function stateAfterEdit(): EditorState {
  return Option.unwrap(EditorState.removeSelected(stateSelecting("title")));
}
