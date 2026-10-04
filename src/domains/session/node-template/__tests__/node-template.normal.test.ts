import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { Node } from "@/domains/dcmp/node";
import { NodeTemplate } from "../index";

test("Box の挿入指定からは型が Box のノードができる", () => {
  const node = NodeTemplate.toNode(
    { kind: "primitive", type: "Box" },
    DesignDocument.create({}),
  );

  expect(Node.isPrimitive(node) && node.type).toBe("Box");
});

test("部品の挿入指定からはその部品を指す参照ノードができる", () => {
  const node = NodeTemplate.toNode(
    { kind: "instance", componentName: "primary-button" },
    DesignDocument.create({}),
  );

  expect(Node.isRef(node) && node.ref).toBe("primary-button");
});

test("プリミティブの名前は型名を小文字にしたものになる", () => {
  const node = NodeTemplate.toNode(
    { kind: "primitive", type: "Text" },
    DesignDocument.create({}),
  );

  expect(node.name).toBe("text");
});

test("部品インスタンスの名前は部品名から採る", () => {
  const node = NodeTemplate.toNode(
    { kind: "instance", componentName: "card" },
    DesignDocument.create({}),
  );

  expect(node.name).toBe("card");
});

test("挿入する Text はキャンバスで掴めるよう文言を持った状態でできる", () => {
  const node = NodeTemplate.toNode(
    { kind: "primitive", type: "Text" },
    DesignDocument.create({}),
  );

  expect(Node.isPrimitive(node) && node.props?.content).toBe("テキスト");
});

test("挿入する Box はキャンバスで掴めるよう大きさを持った状態でできる", () => {
  const node = NodeTemplate.toNode(
    { kind: "primitive", type: "Box" },
    DesignDocument.create({}),
  );

  expect(Node.isPrimitive(node) && node.props?.widthMode).toBe("fixed");
});

test("挿入する Ellipse は props を書かずにできる", () => {
  /*
   * スキーマの既定（100 × 100・gray-300）のままで見えるので足すものが無く、空の props を
   * 書くとファイルに `"props": {}` が残る。
   */
  const node = NodeTemplate.toNode(
    { kind: "primitive", type: "Ellipse" },
    DesignDocument.create({}),
  );

  expect(node).toEqual({ name: "ellipse", type: "Ellipse" });
});
