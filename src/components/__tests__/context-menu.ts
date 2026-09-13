import { screen } from "@testing-library/react";

/**
 * 開いているコンテキストメニューの器を読み上げ名で引く。
 *
 * 器そのもの（`components/context-menu`）と、器を開く側（編集画面）の両方が同じ名前で
 * 引くため、feature をまたいで読めるよう横断層に置く（`row-names` と同じ形）。持っている
 * のは「メニューは `menu` の役割と『コンテキストメニュー』の読み上げ名で出る」という
 * 汎用 UI の知識だけ。
 *
 * 行を直接引かずここを起点にするのは、器が読み上げ名を失っても気づけるようにするため。
 *
 * @returns 開いているメニュー。出ていなければテストを落とす
 */
export function contextMenu(): HTMLElement {
  return screen.getByRole("menu", { name: "コンテキストメニュー" });
}
