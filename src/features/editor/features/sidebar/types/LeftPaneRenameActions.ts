/**
 * 左ペインの行から届く名前の変更の受け口（docs/06-ui.md「名前の変更」）。編集そのものは
 * 行わず、打たれた結果を呼び出し側（`features/editor`）へ渡すだけ。
 *
 * ツリーの行と artboard の行で 1 つに寄せているのは、名前が単一名前空間で、変更もその名前
 * 1 つで artboard / ノードを引き分ける 1 つの操作だから（`DesignDocument.rename`）。
 */
export type LeftPaneRenameActions = Readonly<{
  /** 行をダブルクリックしたときに、その行のものの名前の編集に入ることを伝える。 */
  startAt: (name: string) => void;
  /** Enter で打たれた名前を伝える。使えない名前なら編集は閉じない。 */
  commit: (newName: string) => void;
  /** フォーカスを失ったときに打たれていた名前を伝える。編集はどちらにせよ閉じる。 */
  finish: (newName: string) => void;
  /** Escape で編集をやめたことを伝える。 */
  cancel: () => void;
}>;
