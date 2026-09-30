import { expect, test } from "vitest";
import { DocumentNames } from "../index";

function renamedCopyName(names: readonly string[], name: string): string {
  const [renamed] = DocumentNames.renameSubtree(DocumentNames.create(names), [
    { name, type: "Text" },
  ]);
  return renamed.name;
}

test("連番付きの名前を複製すると、連番を重ねずに次の番号になる", () => {
  expect(renamedCopyName(["title", "title-2"], "title-2")).toBe("title-3");
});

test("連番付きの名前でも、使われていなければそのまま残る", () => {
  expect(renamedCopyName(["title"], "step-5")).toBe("step-5");
});

test("連番を除いた名前が使われていなくても、その名前には戻らず次の番号になる", () => {
  expect(renamedCopyName(["step-2"], "step-2")).toBe("step-3");
});

test("元の番号より前の空きには戻らず、後ろの空いている番号になる", () => {
  expect(renamedCopyName(["title", "title-3", "title-4"], "title-3")).toBe(
    "title-5",
  );
});

test("途中にだけ -<数字> がある名前は、連番とみなさず -2 を付ける", () => {
  expect(renamedCopyName(["icon-2x"], "icon-2x")).toBe("icon-2x-2");
});

test("2 桁以上の連番を複製すると、その次の番号になる", () => {
  expect(renamedCopyName(["grid-12"], "grid-12")).toBe("grid-13");
});

test("連番とみなすのは末尾の番号 1 つだけ", () => {
  expect(renamedCopyName(["a-2-3"], "a-2-3")).toBe("a-2-4");
});

test("末尾が -0 の名前を複製すると、連番は 2 から付く", () => {
  expect(renamedCopyName(["box-0"], "box-0")).toBe("box-2");
});

test("末尾が -1 の名前を複製すると、連番は 2 から付く", () => {
  expect(renamedCopyName(["box-1"], "box-1")).toBe("box-2");
});

test("新しいノードの名前を作るときは、付けたい名前の末尾の数字を連番とみなさない", () => {
  const documentNames = DocumentNames.create(["icon-24"]);

  expect(DocumentNames.uniqueName(documentNames, "icon-24")).toBe("icon-24-2");
});

test("2^53 を超える連番も、使われている番号を飛ばして次の番号になる", () => {
  expect(
    renamedCopyName(
      ["a-9007199254740993", "a-9007199254740994"],
      "a-9007199254740993",
    ),
  ).toBe("a-9007199254740995");
});

test("22 桁以上の連番も、指数表記にならず数字の連番になる", () => {
  expect(
    renamedCopyName(["a-9999999999999999999999"], "a-9999999999999999999999"),
  ).toBe("a-10000000000000000000000");
});
