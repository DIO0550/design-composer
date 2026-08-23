import { screen } from "@testing-library/react";
import { ElementNameAttribute } from "@/domains/compiled-element";
import { TokenReferrerOutline } from "@/features/canvas/components/artboard-canvas";
import { ArrayEx } from "@/utils/ArrayEx";

/**
 * キャンバスに描かれたものを読む。
 * キャンバスの中身はコンパイル結果の HTML を文字列のまま流し込んだもので
 * React の管理下に無いため、要素も強調もノード名の属性を頼りに DOM から引く。
 *
 * キャンバス単体（`components/artboard-canvas`）と編集画面の通し
 * （`features/editor` の `opened-document-editor`）の両方が「何が描かれているか」を
 * 確かめるので、**持ち主であるこの feature に置く**。外の feature へはテスト用の
 * 公開口（`__tests__/index.ts`）から出し、そちらだけを読ませる。
 */

/** 強調の規則が指している名前（規則の書式は components/artboard-canvas）。 */
const HighlightedNamePattern = new RegExp(
  `\\[${ElementNameAttribute}="(.*?)"\\]`,
  "g",
);

/** キャンバスの中身（コンパイル結果を流し込む器）。 */
export function canvasContent(): HTMLElement {
  return screen.getByTestId("canvas-content");
}

/**
 * キャンバスに描かれた 1 要素。
 *
 * ノードの style はインライン style に出る（`CompiledElement.html`）ので、
 * それを読めるよう `HTMLElement` で返す。
 *
 * @param canvas 探す範囲になるキャンバス
 * @param name 描かれている artboard / ノードの名前
 * @returns その名前の要素。描かれていなければテストを落とす
 */
export function renderedElement(
  canvas: HTMLElement,
  name: string,
): HTMLElement {
  const element = canvas.querySelector<HTMLElement>(
    `[${ElementNameAttribute}="${name}"]`,
  );
  if (element === null) {
    throw new Error(`キャンバスに ${name} が描かれていない`);
  }
  return element;
}

/**
 * 渡された規則が指している名前。
 *
 * 1 つの名前に対して差し込まれる規則は 1 本とは限らない（リサイズハンドルは
 * 基準の位置指定と辺ごとの規則を出す）ため、名前で重複を落として答える。
 *
 * @param styles 名前を抜きたい規則
 * @returns その規則が指している名前。重複は落とす
 */
function namesIn(styles: readonly HTMLStyleElement[]): readonly string[] {
  return ArrayEx.distinct(
    styles.flatMap((style) =>
      [...(style.textContent ?? "").matchAll(HighlightedNamePattern)].map(
        (match) => match[1],
      ),
    ),
  );
}

/** キャンバスへ差し込まれたすべての規則が指している名前。 */
export function highlightedNames(canvas: HTMLElement): readonly string[] {
  return namesIn([...canvas.querySelectorAll("style")]);
}

/**
 * トークンの参照元として破線が掛かっている名前。
 *
 * `highlightedNames` と分けているのは、あちらがすべての規則から名前を抜くため、
 * 選択の枠・ドロップ先の枠・リサイズハンドルと区別できないから。
 * 「参照元だけが破線になる」を確かめるには、破線の規則に絞る必要がある。
 *
 * 綴りを写さず実装の定数で引くので、色や太さを UI 案へ寄せ直しても落ちない。
 *
 * @param canvas 探す範囲になるキャンバス
 * @returns 破線の規則が指している名前。重複は落とす
 */
export function tokenReferrerNames(canvas: HTMLElement): readonly string[] {
  const dashedRules = [...canvas.querySelectorAll("style")].filter((style) =>
    (style.textContent ?? "").includes(TokenReferrerOutline),
  );
  return namesIn(dashedRules);
}
