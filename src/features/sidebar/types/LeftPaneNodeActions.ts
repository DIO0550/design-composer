import type { ChildPosition } from "@/domains/dcmp/child-position";

/**
 * 左ペインから届くノード編集の受け口（docs/06-ui.md「編集操作の一覧」）。
 *
 * 編集そのものは行わず、押された結果を呼び出し側（`features/editor`）へ渡すだけ。
 * 書き込みは編集履歴（undo / redo）と自動保存に載る 1 つの経路に閉じていて、その
 * 入口は `features/editor` にあるため。
 *
 * 呼び出し側の `NodeActions` をそのまま型として受け取らないのは、それが
 * `features/editor` にある型で、type だけでも import すると `sidebar -> editor` の辺が
 * できて循環するため（`editor -> sidebar` は実在する）。左ペインが実際に呼ぶ 3 つだけを
 * 消費側で綴る（`rules/coding.md`「消費側の関数は、自分が前提とする状態の型を
 * 引数で要求する」）。
 */
export type LeftPaneNodeActions = Readonly<{
  /** 行を押したときに、その名前を選択として伝える。 */
  select: (name: string) => void;
  /** ツリーの行を動かしたときに、移す先を親の中の位置として伝える。 */
  reorder: (from: ChildPosition, toIndex: number) => void;
  /** 選んでいるものを、その名前の部品として切り出す。 */
  createComponent: (componentName: string) => void;
}>;
