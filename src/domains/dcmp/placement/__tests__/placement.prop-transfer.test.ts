import { expect, test } from "vitest";
import { PropEdit, Props } from "@/domains/dcmp/node";
import {
  PrimitiveSchema,
  PrimitiveTypes,
} from "@/domains/dcmp/primitive-schema";
import { Placement } from "../index";

/**
 * 編集を順に重ねた props。
 *
 * @param props 編集する前の props
 * @param edits 重ねる編集
 * @returns すべて適用した props
 */
function applyAll(props: Props, edits: readonly PropEdit[]): Props {
  return edits.reduce((current, edit) => Props.apply(current, edit), props);
}

test("配置の 5 prop に書かれている値は、同じ値で写る", () => {
  const source = {
    placement: "absolute",
    x: 24,
    y: 48,
    constraintX: "max",
    constraintY: "center",
    content: "見出し",
  };

  expect(applyAll({}, Placement.collectWrittenPropEdits(source))).toEqual({
    placement: "absolute",
    x: 24,
    y: 48,
    constraintX: "max",
    constraintY: "center",
  });
});

test("配置の 5 prop は、どのプリミティブのスキーマにもある", () => {
  const declared = Object.values(PrimitiveTypes).map((type) =>
    Placement.PropNames.every(
      (name) => name in PrimitiveSchema.forType(type).props,
    ),
  );

  expect(declared.every(Boolean)).toBe(true);
});

test("書かれていない配置の prop は、写す編集に含まれない", () => {
  expect(
    Placement.collectWrittenPropEdits({
      placement: "absolute",
      x: 24,
      content: "a",
    }),
  ).toEqual([PropEdit.set(["placement"], "absolute"), PropEdit.set(["x"], 24)]);
});

test("配置の 5 prop を消すと、配置以外の props は残る", () => {
  const props = {
    placement: "absolute",
    x: 24,
    y: 48,
    constraintX: "max",
    constraintY: "center",
    content: "見出し",
  };

  expect(applyAll(props, [Placement.clearPropEdit()])).toEqual({
    content: "見出し",
  });
});
