/**
 * 左ペインから届く artboard 操作の受け口（docs/06-ui.md「編集操作の一覧」の
 * artboard 操作）。
 *
 * 編集そのものは行わず、押された結果を呼び出し側（`features/editor`）へ渡すだけ。
 * 書き込みは編集履歴（undo / redo）と自動保存に載る 1 つの経路に閉じていて、その
 * 入口は `features/editor` にあるため。
 *
 * 呼び出し側の `ArtboardActions` をそのまま型として受け取らないのは、それが
 * `features/editor` にある型で、type だけでも import すると `sidebar -> editor` の辺が
 * できて循環するため（`LeftPaneNodeActions` と同じ理由）。
 *
 * 削除を持たないのは、導線がキーボードだけで左ペインに口が無いため
 * （`ArtboardActions` と同じ）。
 */
export type LeftPaneArtboardActions = Readonly<{
  /** 見出しの `+` が押されたときに、artboard を 1 枚足すことを伝える。 */
  add: () => void;
  /** 行を動かしたときに、今の位置と移す先を伝える。 */
  reorder: (move: LeftPaneArtboardMove) => void;
}>;

/**
 * 動かす artboard の今の位置と、移す先。
 * 片方だけでは移動が決まらないため 1 つの型にまとめる。
 *
 * `features/editor` の `ArtboardMove` と同じ形を綴り直しているのは、
 * `LeftPaneArtboardActions` 自体と同じ理由（`sidebar -> editor` の辺を作らない）。
 */
export type LeftPaneArtboardMove = Readonly<{
  fromIndex: number;
  toIndex: number;
}>;
