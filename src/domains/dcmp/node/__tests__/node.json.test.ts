import { expect, test } from "vitest";
import { Json } from "@/utils/Json";
import { Result } from "@/utils/Result";
import { Node } from "../index";

test("type を持つノードはプリミティブノードとして読み込まれる", () => {
  const node = Result.unwrap(
    Node.fromJson(Json.create({ name: "box", type: "Box" }, "node")),
  );

  expect(node).toEqual({ name: "box", type: "Box" });
});

test("ref を持つノードは参照ノードとして読み込まれる", () => {
  const node = Result.unwrap(
    Node.fromJson(
      Json.create({ name: "submit", ref: "primary-button" }, "node"),
    ),
  );

  expect(node).toEqual({ name: "submit", ref: "primary-button" });
});

test("type も ref も持たないノードは読み込めない", () => {
  const result = Node.fromJson(Json.create({ name: "orphan" }, "node"));

  expect(result.ok).toBe(false);
});

test("子ノードは階層のまま読み込まれる", () => {
  const node = Result.unwrap(
    Node.fromJson(
      Json.create(
        {
          name: "outer",
          type: "Box",
          children: [{ name: "inner", type: "Text" }],
        },
        "node",
      ),
    ),
  );

  expect(node).toEqual({
    name: "outer",
    type: "Box",
    children: [{ name: "inner", type: "Text" }],
  });
});

test("プリミティブノードは name・type・props・children の順で書き出される", () => {
  const written = Node.toJson({
    name: "box",
    type: "Box",
    props: { gap: "md" },
    children: [{ name: "label", type: "Text" }],
  });

  expect(Object.keys(written)).toEqual(["name", "type", "props", "children"]);
});

test("参照ノードは name・ref・overrides の順で書き出される", () => {
  const written = Node.toJson({
    name: "submit",
    ref: "primary-button",
    overrides: { label: "保存" },
  });

  expect(Object.keys(written)).toEqual(["name", "ref", "overrides"]);
});

test("設定されていない props と children は書き出されない", () => {
  expect(Node.toJson({ name: "box", type: "Box" })).toEqual({
    name: "box",
    type: "Box",
  });
});

test("空の props と空の children は書き出されない", () => {
  expect(
    Node.toJson({ name: "box", type: "Box", props: {}, children: [] }),
  ).toEqual({ name: "box", type: "Box" });
});

test("props は名前の昇順で書き出される", () => {
  const written = Node.toJson({
    name: "box",
    type: "Box",
    props: { gap: "md", background: "primary", direction: "row" },
  });

  expect(Object.keys(written.props as object)).toEqual([
    "background",
    "direction",
    "gap",
  ]);
});
