import type { ChildPosition } from "@/domains/dcmp/child-position";
import type { Offset } from "@/domains/unit/offset";

/**
 * 左ペインから届くノード編集の受け口（docs/06-ui.md「編集操作の一覧」）。編集そのものは
 * 行わず、押された結果を呼び出し側（`features/editor`）へ渡すだけ。
 *
 * 左ペインが実際に呼ぶものだけを消費側で綴る。
 */
export type LeftPaneNodeActions = Readonly<{
  /** 行を押したときに、その名前を選択として伝える。 */
  select: (name: string) => void;
  /** ツリーの行を動かしたときに、移す先を親の中の位置として伝える。 */
  reorder: (from: ChildPosition, toIndex: number) => void;
  /**
   * 行を右クリックしたときに、その名前と押した窓の座標を伝える。
   *
   * 凍結中かは受け口で見ない。左ペインは凍結中 `inert` になり、行の `contextmenu` は
   * 受け口まで届かない（Chromium で確認。happy-dom は `inert` をイベントに強制しない）。
   */
  openContextMenu: (name: string, at: Offset) => void;
}>;
