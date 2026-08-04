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

export function renderedElement(canvas: HTMLElement, name: string): Element {
  const element = canvas.querySelector(`[${ELEMENT_NAME_ATTRIBUTE}="${name}"]`);
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
