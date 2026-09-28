import type { Offset } from "@/domains/unit/offset";

/** 右クリックされた行のものの名前と、押した窓の座標を伝える口。 */
export type OpenRowContextMenu = (name: string, at: Offset) => void;

/**
 * 左ペインの行の右クリックの受け口（docs/06-ui.md「コンテキストメニュー」の「出る場所は
 * キャンバスとツリー」）。メニューそのものは持たず、押された行と窓の座標を呼び出し側
 * （`features/editor`）へ渡すだけ。
 *
 * 行の種類ごとに口を分けるのは、並ぶメニューが種類で決まるため。種類の語彙（`EditMenuTarget`）
 * は親の feature にあり、ここからは import できないので、どの口が呼ばれたかで伝える。
 */
export type LeftPaneContextMenuActions = Readonly<{
  /** ツリーの行（ノード）を右クリックしたときに、その名前と押した位置を伝える。 */
  openForNode: OpenRowContextMenu;
  /** `Artboards` の行を右クリックしたときに、その名前と押した位置を伝える。 */
  openForArtboard: OpenRowContextMenu;
}>;
