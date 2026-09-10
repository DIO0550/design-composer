import { within } from "@testing-library/react";

/**
 * 名前の並んだ一覧が「どう見えているか」を読む。
 *
 * ツリービュー・artboard の一覧・エディタ画面のどれもが同じ読み方をするため、feature を
 * またいで読めるよう横断層に置く（持っているのは「`aria-current` を名乗るボタンが行」と
 * いう汎用 UI の知識だけ）。行は名前のほかに型アイコンと補助情報も出すため、名前は表示
 * 文字列ではなく読み上げ名（`aria-label`）から読む。
 */

/**
 * 行かどうかは `aria-current` を持つかで見る。一覧には行以外のボタン（並べ替え・開閉）
 * も並ぶが、`aria-current` を名乗るのは行だけなので、ボタンが増えても判定は変わらない。
 *
 * 危ないのは逆で、**行ではないのに `aria-current` を名乗るボタン**を足すと、ここが黙っ
 * てそれを行として拾う（テストは落ちない）。そうなったら行そのものに役割を宣言して引く
 * 形へ変えること。
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
