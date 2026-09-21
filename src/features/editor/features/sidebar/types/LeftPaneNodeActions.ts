import type { ChildPosition } from "@/domains/dcmp/child-position";

/**
 * 左ペインから届くノード編集の受け口（docs/06-ui.md「編集操作の一覧」）。編集そのものは
 * 行わず、押された結果を呼び出し側（`features/editor`）へ渡すだけ。
 *
 * 左ペインが実際に呼ぶ 3 つだけを消費側で綴る。
 */
export type LeftPaneNodeActions = Readonly<{
  /** 行を押したときに、その名前を選択として伝える。 */
  select: (name: string) => void;
  /** ツリーの行を動かしたときに、移す先を親の中の位置として伝える。 */
  reorder: (from: ChildPosition, toIndex: number) => void;
  /** 選んでいるものを、その名前の部品として切り出す。 */
  createComponent: (componentName: string) => void;
}>;
