import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { DesignDocument } from "../index";
import { copySourceDocument } from "./copy-setup";

/*
 * 名前で指したものの最上位のノード（docs/06-ui.md「複数選択」のコピーと複製の対象）。
 */

/**
 * 最上位に残ったノードの名前。
 *
 * @param names 指す名前
 * @returns 最上位のノードの名前を並び順のまま。`findOutermostNodes` が `none` なら `none`
 */
function outermostNamesOf(names: readonly string[]): Option<readonly string[]> {
  return Option.map(
    DesignDocument.findOutermostNodes(copySourceDocument(), names),
    (nodes) => nodes.map((node) => node.name),
  );
}

test("祖先と子孫を指すと祖先だけが残る", () => {
  expect(outermostNamesOf(["card", "caption"])).toEqual(Option.some(["card"]));
});

test("子孫を先に指しても祖先だけが残る", () => {
  expect(outermostNamesOf(["caption", "card"])).toEqual(Option.some(["card"]));
});

test("互いに関係の無いノードは指した順に並ぶ", () => {
  expect(outermostNamesOf(["footer", "title"])).toEqual(
    Option.some(["footer", "title"]),
  );
});

test("同じ名前を 2 回指しても 1 つになる", () => {
  expect(outermostNamesOf(["title", "title"])).toEqual(Option.some(["title"]));
});

test("親が違うノードはすべて残る", () => {
  expect(outermostNamesOf(["caption", "about-title"])).toEqual(
    Option.some(["caption", "about-title"]),
  );
});

test("artboard と別のノードを指すと最上位のノードは無い", () => {
  expect(outermostNamesOf(["about", "title"])).toEqual(Option.none);
});

test("artboard とその中のノードを指すと最上位のノードは無い", () => {
  expect(outermostNamesOf(["screen", "title"])).toEqual(Option.none);
});

test("無い名前が混ざると最上位のノードは無い", () => {
  expect(outermostNamesOf(["title", "missing"])).toEqual(Option.none);
});

test("部品定義の中のノードの名前が混ざると最上位のノードは無い", () => {
  expect(outermostNamesOf(["title", "button-label"])).toEqual(Option.none);
});

test("何も指さなければ最上位のノードは無い", () => {
  expect(outermostNamesOf([])).toEqual(Option.none);
});
