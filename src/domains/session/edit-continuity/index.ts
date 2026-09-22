import type { ValueOf } from "@/types/ValueOf";

/**
 * 1 つの編集を、履歴の上で直前の編集とどう扱うか
 * （docs/06-ui.md「編集操作の一覧」の undo / redo）。
 *
 * 1 回の操作が何度も編集を送る経路があるため、編集の側では決められない。送る側（どこで操作
 * が始まってどこで終わるかを知っているのは UI だけ）が指定する。
 */
export const EditContinuities = {
  /** 直前の編集とは別のまとまり。 */
  Separate: "separate",
  /** 直前の編集と同じまとまりの続き。 */
  Continued: "continued",
} as const;

/**
 * 直前の編集との続き方。
 *
 * 同名のコンパニオンオブジェクトを持たないのは、**続き方そのものに生成・判定・変換が無い**
 * ため。積むか差し替えるかを決めるのは履歴の側（`EditHistory`）で、ここは語彙だけを持つ
 * （先例は `unit/axis` の `Axis`）。
 *
 * `features/editor/domains/edit-history` と並べないのは、指定する側が
 * `features/editor/features/canvas` と `features/editor/features/inspector`・受け取る側が
 * `features/editor` と 3 つの feature にまたがるため
 * （`rules/architecture.md`「配置の判断基準」の昇格）。
 */
export type EditContinuity = ValueOf<typeof EditContinuities>;
