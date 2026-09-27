import { expect, test } from "vitest";
import type { ComponentSet } from "@/domains/dcmp/component";
import { Option } from "@/utils/Option";
import { ComponentBinding } from "../index";

/**
 * 内部に Text と、部品 `icon` のインスタンスを持つ部品 `button` と、`label` だけを公開する
 * 部品 `icon`。
 *
 * @returns 部品一式
 */
function components(): ComponentSet {
  return {
    button: {
      type: "Box",
      children: [
        { name: "button-label", type: "Text" },
        { name: "button-icon", ref: "icon" },
        { name: "button-orphan", ref: "missing" },
        { name: "button-frame", type: "Frame" },
      ],
    },
    icon: {
      type: "Box",
      children: [{ name: "icon-label", type: "Text" }],
      publicProps: { label: { node: "icon-label", prop: "content" } },
    },
  };
}

test("binding の指すノードが部品に無ければ missing-node になる", () => {
  const violation = ComponentBinding.violation(
    components(),
    ComponentBinding.create("button", { node: "ghost", prop: "content" }),
  );

  expect(violation).toEqual(Option.some({ kind: "missing-node" }));
});

test("指し先のプリミティブのスキーマにその prop が無ければ missing-prop になる", () => {
  const violation = ComponentBinding.violation(
    components(),
    ComponentBinding.create("button", { node: "button-label", prop: "gap" }),
  );

  expect(violation).toEqual(Option.some({ kind: "missing-prop" }));
});

test("指し先のプリミティブがその prop を持てば違反にならない", () => {
  const violation = ComponentBinding.violation(
    components(),
    ComponentBinding.create("button", {
      node: "button-label",
      prop: "content",
    }),
  );

  expect(violation).toEqual(Option.none);
});

test("Object.prototype 上の名前の prop は、スキーマに無い prop として missing-prop になる", () => {
  const violation = ComponentBinding.violation(
    components(),
    ComponentBinding.create("button", {
      node: "button-label",
      prop: "constructor",
    }),
  );

  expect(violation).toEqual(Option.some({ kind: "missing-prop" }));
});

test("指し先の部品インスタンスの参照先がその prop を公開していなければ missing-public-prop になる", () => {
  const violation = ComponentBinding.violation(
    components(),
    ComponentBinding.create("button", { node: "button-icon", prop: "size" }),
  );

  expect(violation).toEqual(
    Option.some({ kind: "missing-public-prop", ref: "icon" }),
  );
});

test("指し先の部品インスタンスの参照先がその prop を公開していれば違反にならない", () => {
  const violation = ComponentBinding.violation(
    components(),
    ComponentBinding.create("button", { node: "button-icon", prop: "label" }),
  );

  expect(violation).toEqual(Option.none);
});

test("指し先の部品インスタンスの参照先の部品が無ければ違反にしない", () => {
  const violation = ComponentBinding.violation(
    components(),
    ComponentBinding.create("button", {
      node: "button-orphan",
      prop: "label",
    }),
  );

  expect(violation).toEqual(Option.none);
});

test("指し先の型が未知なら違反にしない", () => {
  const violation = ComponentBinding.violation(
    components(),
    ComponentBinding.create("button", { node: "button-frame", prop: "gap" }),
  );

  expect(violation).toEqual(Option.none);
});

test("部品のルートを指す binding も、ルートの型のスキーマで照らされる", () => {
  const violation = ComponentBinding.violation(
    components(),
    ComponentBinding.create("button", { node: "button", prop: "content" }),
  );

  expect(violation).toEqual(Option.some({ kind: "missing-prop" }));
});

test("部品一式に無い部品名の binding は違反にしない", () => {
  const violation = ComponentBinding.violation(
    components(),
    ComponentBinding.create("missing", { node: "ghost", prop: "content" }),
  );

  expect(violation).toEqual(Option.none);
});
