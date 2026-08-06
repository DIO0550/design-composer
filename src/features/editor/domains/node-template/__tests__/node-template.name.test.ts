import { expect, test } from "vitest";
import { NodeTemplate } from "../index";

test("同じ名前が使われているときは連番を付けた名前でできる", () => {
  const node = NodeTemplate.toNode(
    { kind: "primitive", type: "Box" },
    new Set(["box"]),
  );

  expect(node.name).toBe("box-2");
});

test("連番の名前も使われているときはさらに先の連番になる", () => {
  const node = NodeTemplate.toNode(
    { kind: "primitive", type: "Box" },
    new Set(["box", "box-2"]),
  );

  expect(node.name).toBe("box-3");
});

test("部品名は名前空間を部品定義と共有するため、インスタンスは連番の名前になる", () => {
  const node = NodeTemplate.toNode(
    { kind: "instance", componentName: "card" },
    new Set(["card"]),
  );

  expect(node.name).toBe("card-2");
});
