import { expect, test } from "vitest";
import type { ComponentSet } from "@/domains/component";
import { ExpandedNode } from "@/domains/expanded-node";
import type { RefNode } from "@/domains/node";
import { Result } from "@/utils/Result";
import { NodeHtml } from "../index";

test("未知の type のノードはコンパイルできずエラーになる", () => {
  const result = NodeHtml.compile({ name: "unknown", type: "Image" });

  expect(result.ok).toBe(false);
});

test("子孫に未知の type があればツリー全体のコンパイルが失敗する", () => {
  const result = NodeHtml.compile({
    name: "root",
    type: "Box",
    children: [{ name: "broken", type: "Image" }],
  });

  expect(result.ok).toBe(false);
});

test("入れ子のノードは階層を保ったままコンパイルされる", () => {
  const compiled = Result.unwrap(
    NodeHtml.compile({
      name: "root",
      type: "Box",
      children: [
        {
          name: "inner",
          type: "Box",
          children: [{ name: "label", type: "Text" }],
        },
      ],
    }),
  );

  const inner = compiled.kind === "box" ? compiled.children[0] : undefined;
  const label =
    inner !== undefined && inner.kind === "box" ? inner.children[0] : undefined;

  expect(inner?.name).toBe("inner");
  expect(label?.name).toBe("label");
  expect(label?.kind).toBe("text");
});

test("子を持たない Box の children は空になる", () => {
  const compiled = Result.unwrap(
    NodeHtml.compile({ name: "box", type: "Box" }),
  );

  expect(compiled.kind === "box" && compiled.children).toEqual([]);
});

test("同じノードをコンパイルすると常に同じ出力になる", () => {
  const node = {
    name: "card",
    type: "Box",
    props: { direction: "row", gap: "md", background: "primary" },
    children: [{ name: "label", type: "Text", props: { content: "Hello" } }],
  } as const;

  const first = Result.unwrap(NodeHtml.compile(node));
  const second = Result.unwrap(NodeHtml.compile(node));

  expect(first).toEqual(second);
});

test("部品インスタンスは展開してからコンパイルすると部品の見た目になる", () => {
  const components: ComponentSet = {
    "primary-button": {
      type: "Box",
      props: { background: "primary", radius: "md" },
      children: [
        {
          name: "primary-button-label",
          type: "Text",
          props: { content: "OK" },
        },
      ],
    },
  };
  const instance: RefNode = { name: "save-button", ref: "primary-button" };

  const expanded = Result.unwrap(ExpandedNode.fromNode(instance, components));
  const compiled = Result.unwrap(NodeHtml.compile(expanded));

  expect(compiled.name).toBe("save-button");
  expect(compiled.style.background).toBe("var(--colors-primary)");
  expect(compiled.style["border-radius"]).toBe("var(--radius-md)");
  expect(
    compiled.kind === "box" &&
      compiled.children[0].kind === "text" &&
      compiled.children[0].content,
  ).toBe("OK");
});

test("複数のノードをまとめてコンパイルすると並び順が保たれる", () => {
  const compiled = Result.unwrap(
    NodeHtml.compileAll([
      { name: "first", type: "Box" },
      { name: "second", type: "Text" },
    ]),
  );

  expect(compiled.map((element) => element.name)).toEqual(["first", "second"]);
});

test("まとめてコンパイルするときも親の direction が子へ渡る", () => {
  const compiled = Result.unwrap(
    NodeHtml.compileAll(
      [{ name: "child", type: "Box", props: { widthMode: "fill" } }],
      { direction: "row" },
    ),
  );

  expect(compiled[0].style["flex-grow"]).toBe("1");
});
