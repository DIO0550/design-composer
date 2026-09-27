import { expect, test } from "vitest";
import type { ComponentSet } from "@/domains/dcmp/component";
import type { Props } from "@/domains/dcmp/node";
import { TokenSet } from "@/domains/dcmp/token";
import { type InstanceViolation, ReferenceContext } from "../index";

/**
 * `label` を内部の Text の `content` に繋いで公開し、`broken` を存在しないノードに繋いで
 * 公開する部品 `button`。
 *
 * @returns 部品一式
 */
function components(): ComponentSet {
  return {
    button: {
      type: "Box",
      children: [{ name: "button-label", type: "Text" }],
      publicProps: {
        label: { node: "button-label", prop: "content" },
        broken: { node: "ghost", prop: "content" },
      },
    },
  };
}

/**
 * 部品 `button` のインスタンスの違反を集める。
 *
 * @param overrides インスタンスに設定する上書き
 * @returns そのインスタンスの違反
 */
function violationsOf(overrides: Props): readonly InstanceViolation[] {
  return ReferenceContext.collectInstanceViolations(
    ReferenceContext.create(components(), TokenSet.empty()),
    { name: "submit", ref: "button", overrides },
  );
}

test("参照先の部品が無ければ missing-component だけになり、上書きは照らさない", () => {
  const violations = ReferenceContext.collectInstanceViolations(
    ReferenceContext.create(components(), TokenSet.empty()),
    { name: "submit", ref: "missing", overrides: { caption: "x" } },
  );

  expect(violations).toEqual([{ kind: "missing-component" }]);
});

test("公開されていない prop の上書きは undeclared-override になる", () => {
  expect(violationsOf({ caption: "保存" })).toEqual([
    { kind: "undeclared-override", prop: "caption" },
  ]);
});

test("Object.prototype 上の名前の上書きも undeclared-override になる", () => {
  expect(violationsOf({ constructor: "x" })).toEqual([
    { kind: "undeclared-override", prop: "constructor" },
  ]);
});

test("公開 prop の宣言に適合しない値の上書きは invalid-override になる", () => {
  expect(violationsOf({ label: 1 })).toEqual([
    {
      kind: "invalid-override",
      error: expect.objectContaining({
        kind: "literal-type-mismatch",
        prop: "label",
      }),
    },
  ]);
});

test("公開 prop の宣言に適合する上書きは違反にならない", () => {
  expect(violationsOf({ label: "保存" })).toEqual([]);
});

test("違反は上書きの並び順に出る", () => {
  const violations = violationsOf({ label: 1, caption: "保存" });

  expect(violations.map((violation) => violation.kind)).toEqual([
    "invalid-override",
    "undeclared-override",
  ]);
});

test("宣言が解けない公開 prop の上書きは違反にしない", () => {
  expect(violationsOf({ broken: 1 })).toEqual([]);
});
