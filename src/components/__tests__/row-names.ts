import { within } from "@testing-library/react";

/**
 * 名前の並んだ一覧が「どう見えているか」を読む。
 * ツリービュー（features/sidebar）・artboard の一覧（features/sidebar）・
 * エディタ画面（features/editor）のどれもが同じ読み方をするため、feature を
 * またいで読めるよう横断層に置いて共有する（読み方に持っているのは `aria-current` を
 * 名乗るボタンが行である、という汎用 UI の知識だけで、ドメインは知らない）。
 *
 * 行は名前のほかに型アイコンと補助情報も出すため、名前は表示文字列ではなく
 * 読み上げ名（`aria-label`）から読む。
 */

/**
 * 行かどうかは `aria-current` を持つかで見る。一覧の中には行以外のボタン
 * （並べ替え・開閉）も並ぶが、`aria-current`（並びの中の今の項目かどうか）を
 * 名乗るのは行だけなので、ボタンが増えてもこの判定は変わらない（React は
 * `aria-*` の真偽値を `"false"` としても書き出すため、今の項目でない行にも属性が出る）。
 *
 * 危ないのは逆で、**行ではないのに `aria-current` を名乗るボタン**を中へ足すと、
 * ここが黙ってそれを行として拾う（テストは落ちず、期待値を書き換えて通してしまう）。
 * そうなったら、行そのものに役割を宣言して引く形へ変えること。
 */
function rows(container: HTMLElement): readonly HTMLElement[] {
  // 1 行も無い状態（子を持たない artboard など）も読める必要があるので query で引く
  return within(container)
    .queryAllByRole("button")
    .filter((button) => button.hasAttribute("aria-current"));
}

function nameOf(row: HTMLElement): string {
  return row.getAttribute("aria-label") ?? "";
}

/** 画面に出ている順の行の名前。 */
export function rowNames(container: HTMLElement): readonly string[] {
  return rows(container).map(nameOf);
}

/**
 * 今の項目として示されている行の名前。
 * ツリーでは選択中のノード、artboard の一覧では今見ている 1 枚を指す。
 */
export function currentRowNames(container: HTMLElement): readonly string[] {
  return rows(container)
    .filter((row) => row.getAttribute("aria-current") === "true")
    .map(nameOf);
}
