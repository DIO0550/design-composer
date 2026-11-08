import { expect, test } from "vitest";
import type { DocumentSelection } from "@/domains/session/document-selection";
import type { PropControl } from "../index";
import {
  boxSelection,
  controlNamed,
  controlsIn,
  propNamesOf,
  sectionsOf,
} from "./setup";

function enabledByKindOf(
  selection: DocumentSelection,
  prop: string,
): PropControl["enabledBy"]["kind"] {
  const controls = sectionsOf(selection).flatMap(controlsIn);
  return controlNamed(controls, prop).enabledBy.kind;
}

test("サイズのモードが fixed のときだけ長さのコントロールが出る", () => {
  expect(propNamesOf(boxSelection({ widthMode: "fixed" }))).toContain("width");
});

test("サイズのモードが hug なら長さのコントロールは出ない", () => {
  expect(propNamesOf(boxSelection({ widthMode: "hug" }))).not.toContain(
    "width",
  );
});

test("サイズのモードが未指定なら既定の hug として扱われ、長さのコントロールは出ない", () => {
  expect(propNamesOf(boxSelection({}))).not.toContain("width");
});

test("子を並べる Box では折り返しのコントロールが出る", () => {
  expect(propNamesOf(boxSelection({ layout: "row" }))).toContain("wrap");
});

test("子を並べない Box では折り返しのコントロールは出ない", () => {
  expect(propNamesOf(boxSelection({ layout: "free" }))).not.toContain("wrap");
});

test("条件を満たす prop だけが出るので、縦のサイズは横のモードに影響されない", () => {
  const names = propNamesOf(boxSelection({ widthMode: "fixed" }));

  expect(names).toContain("width");
  expect(names).not.toContain("height");
});

test("サイズのモードが hug なら最小 / 最大のコントロールが出る", () => {
  const names = propNamesOf(boxSelection({ widthMode: "hug" }));

  expect(names).toContain("minWidth");
  expect(names).toContain("maxWidth");
});

test("サイズのモードが fixed なら最小 / 最大のコントロールは出ない", () => {
  const names = propNamesOf(boxSelection({ widthMode: "fixed" }));

  expect(names).not.toContain("minWidth");
  expect(names).not.toContain("maxWidth");
});

test("縦のサイズのモードが hug なら高さの最小 / 最大のコントロールが出る", () => {
  const names = propNamesOf(boxSelection({ heightMode: "hug" }));

  expect(names).toContain("minHeight");
  expect(names).toContain("maxHeight");
});

test("縦のサイズのモードが fixed なら高さの最小 / 最大のコントロールは出ない", () => {
  const names = propNamesOf(boxSelection({ heightMode: "fixed" }));

  expect(names).not.toContain("minHeight");
  expect(names).not.toContain("maxHeight");
});

test("絶対配置の Box では、座標の欄は x も y も placement の条件を共有する欄になる", () => {
  const selection = boxSelection({ placement: "absolute" });

  expect([
    enabledByKindOf(selection, "x"),
    enabledByKindOf(selection, "y"),
  ]).toEqual(["sharedCondition", "sharedCondition"]);
});

test("縦のモードが fixed の Box では、横のモードの最小 / 最大が同じ節に並んでいても、height は heightMode が出している唯一の欄になる", () => {
  const selection = boxSelection({ heightMode: "fixed" });

  expect(enabledByKindOf(selection, "height")).toBe("soleUnderCondition");
});

test("横のモードが hug の Box では、minWidth と maxWidth はどちらも widthMode の条件を共有する欄になる", () => {
  const selection = boxSelection({ widthMode: "hug" });

  expect([
    enabledByKindOf(selection, "minWidth"),
    enabledByKindOf(selection, "maxWidth"),
  ]).toEqual(["sharedCondition", "sharedCondition"]);
});
