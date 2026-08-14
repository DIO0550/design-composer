import { screen } from "@testing-library/react";
import { ELEMENT_NAME_ATTRIBUTE } from "@/domains/compiled-element";
import { ArrayEx } from "@/utils/ArrayEx";

/**
 * キャンバスに描かれたものを読む。
 * キャンバスの中身はコンパイル結果の HTML を文字列のまま流し込んだもので
 * React の管理下に無いため、要素も強調もノード名の属性を頼りに DOM から引く。
 * キャンバス単体（components/artboard-canvas）とエディタ画面（components/editor-screen）の
 * 両方が「何が描かれているか」を確かめるため、feature 直下に置いて共有する。
 */

/** 強調の規則が指している名前（規則の書式は components/artboard-canvas）。 */
const HIGHLIGHTED_NAME_PATTERN = new RegExp(
  `\\[${ELEMENT_NAME_ATTRIBUTE}="(.*?)"\\]`,
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
    `[${ELEMENT_NAME_ATTRIBUTE}="${name}"]`,
  );
  if (element === null) {
    throw new Error(`キャンバスに ${name} が描かれていない`);
  }
  return element;
}

/**
 * 1 つの名前に対して差し込まれる規則は 1 本とは限らない（リサイズハンドルは
 * 基準の位置指定と辺ごとの規則を出す）ため、名前で重複を落として答える。
 */
export function highlightedNames(canvas: HTMLElement): readonly string[] {
  return ArrayEx.distinct(
    [...canvas.querySelectorAll("style")].flatMap((style) =>
      [...(style.textContent ?? "").matchAll(HIGHLIGHTED_NAME_PATTERN)].map(
        (match) => match[1],
      ),
    ),
  );
}

/**
 * 選択中のトークンを参照しているノードに差し込まれる枠の綴り
 * （規則の中身は components/artboard-canvas）。
 */
const TOKEN_REFERRER_DECLARATION = "dashed #0d99ff";

/**
 * トークンの参照元として破線が掛かっている名前。
 *
 * `highlightedNames` と分けているのは、あちらがキャンバス内のすべての規則から名前を
 * 抜くため、選択の枠・ドロップ先の枠・リサイズハンドルと区別できないから。
 * 「参照元だけが破線になる」を確かめるには、破線の宣言を持つ規則に絞る必要がある。
 *
 * @param canvas 探す範囲になるキャンバス
 * @returns 破線の規則が指している名前。重複は落とす
 */
export function tokenReferrerNames(canvas: HTMLElement): readonly string[] {
  const dashedRules = [...canvas.querySelectorAll("style")].filter((style) =>
    (style.textContent ?? "").includes(TOKEN_REFERRER_DECLARATION),
  );
  return ArrayEx.distinct(
    dashedRules.flatMap((style) =>
      [...(style.textContent ?? "").matchAll(HIGHLIGHTED_NAME_PATTERN)].map(
        (match) => match[1],
      ),
    ),
  );
}
