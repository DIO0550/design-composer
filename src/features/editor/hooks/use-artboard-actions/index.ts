import { useEditor } from "@/features/editor/components/editor-provider";
import type { IndexMove } from "@/types/IndexMove";

/**
 * artboard の操作（docs/06-ui.md「編集操作の一覧」の artboard 操作）。
 *
 * 入口は同じではない。`add` は `Artboards` の一覧の `+` とキャンバスのツールバーの
 * `#` の 2 つから届き（#316）、`reorder` は一覧の行を運ぶ操作しか持たない。
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
 * @returns 末尾への追加と、並びの中での移動
 */
export function useArtboardActions(): ArtboardActions {
  const { dispatch } = useEditor();

  return {
    add: () => dispatch({ type: "add_artboard" }),
    reorder: (move) => dispatch({ type: "reorder_artboard", move }),
  };
}
