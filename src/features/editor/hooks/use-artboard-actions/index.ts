import { useEditor } from "@/features/editor/components/editor-provider";
import type { IndexMove } from "@/types/IndexMove";

/**
 * artboard の操作（docs/06-ui.md「編集操作の一覧」の artboard 操作）。
 *
 * 入口は同じではない。`add` は `Artboards` の一覧の `+` とキャンバスのツールバーの
 * `#` の 2 つから届き（#316）、`reorder` は一覧の行を運ぶ操作しか持たない。
 *
 * 削除を持たないのは、導線がキーボード（Delete / Backspace）だけで、押された時点の
 * 選択がノードか artboard かで消すものが決まるため。画面の部品から呼ぶ相手がおらず、
 * `useEditShortcuts` が張る（`useNodeActions` が削除を持たないのと同じ理由）。
 */
export type ArtboardActions = Readonly<{
  /** 末尾に 1 枚足して、そのまま見られるよう選択する。 */
  add: () => void;
  /** 並びの中で 1 枚を別の位置へ移す。 */
  reorder: (move: IndexMove) => void;
}>;

/**
 * artboard の操作をエディタの状態へ仲介する。
 *
 * `useNodeActions` と分けるのは、対象がツリーの中のノードではなくドキュメントが
 * 持つ artboard の並びで、押せる条件も選択に依らないため（`rules/hooks.md`
 * 「1フック1責務」）。
 *
 * @returns 末尾への追加と、並びの中での移動
 */
export function useArtboardActions(): ArtboardActions {
  const { dispatch } = useEditor();

  return {
    add: () => dispatch({ type: "add_artboard" }),
    reorder: (move) => dispatch({ type: "reorder_artboard", move }),
  };
}
