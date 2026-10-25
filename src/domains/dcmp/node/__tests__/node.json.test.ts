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

  expect(Result.isOk(result)).toBe(false);
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
    props: { gap: "md", background: "primary", layout: "row" },
  });

  expect(Object.keys(written.props as object)).toEqual([
    "background",
    "gap",
    "layout",
  ]);
});

test("参照ノード直下のロックはインスタンス自身の値として読み込まれる", () => {
  const node = Result.unwrap(
    Node.fromJson(
      Json.create(
        { name: "submit", ref: "primary-button", locking: "locked" },
        "node",
      ),
    ),
  );

  expect(node).toEqual({
    name: "submit",
    ref: "primary-button",
    locking: "locked",
  });
});

test("ロックを持つ参照ノードは name・ref・locking・overrides の順で書き出される", () => {
  const written = Node.toJson({
    name: "submit",
    ref: "primary-button",
    overrides: { label: "保存" },
    locking: "locked",
  });

  expect(Object.keys(written)).toEqual(["name", "ref", "locking", "overrides"]);
});

test("ロックが設定されていない参照ノードはロックを書き出さない", () => {
  expect(Node.toJson({ name: "submit", ref: "primary-button" })).toEqual({
    name: "submit",
    ref: "primary-button",
  });
});

test("参照ノード直下のロックがオブジェクトなら型違いとして読み込めない", () => {
  const result = Node.fromJson(
    Json.create(
      { name: "submit", ref: "primary-button", locking: { on: true } },
      "node",
    ),
  );

  expect(Result.isOk(result) ? [] : result.error).toEqual([
    expect.objectContaining({ kind: "invalid-type", path: "node.locking" }),
  ]);
});

test("参照ノード直下のロックは語彙に無い綴りでも読み込まれる", () => {
  const node = Result.unwrap(
    Node.fromJson(
      Json.create(
        { name: "submit", ref: "primary-button", locking: "frozen" },
        "node",
      ),
    ),
  );

  expect(node).toEqual({
    name: "submit",
    ref: "primary-button",
    locking: "frozen",
  });
});
