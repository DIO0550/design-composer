import { expect, test } from "vitest";
import type { ExpandedNode } from "@/domains/dcmp/expanded-node";
import { Result } from "@/utils/Result";
import type { ParentContext } from "../index";
import { NodeHtml } from "../index";

function styleOf(
  node: ExpandedNode,
  parent?: ParentContext,
): Readonly<Record<string, string>> {
  return Result.unwrap(NodeHtml.compile(node, parent)).style;
}

test("widthMode が hug のとき幅は内容に合わせて縮む", () => {
  const style = styleOf({
    name: "box",
    type: "Box",
    props: { widthMode: "hug" },
  });

  expect(style.width).toBe("fit-content");
});

test("widthMode が fixed のとき幅は指定した px 値になる", () => {
  const style = styleOf({
    name: "box",
    type: "Box",
    props: { widthMode: "fixed", width: 320 },
  });

  expect(style.width).toBe("320px");
});

test("heightMode が fixed のとき高さは指定した px 値になる", () => {
  const style = styleOf({
    name: "box",
    type: "Box",
    props: { heightMode: "fixed", height: 240 },
  });

  expect(style.height).toBe("240px");
});

test("fixed 以外のモードでは width の値は無視される", () => {
  const style = styleOf({
    name: "box",
    type: "Box",
    props: { widthMode: "hug", width: 320 },
  });

  expect(style.width).toBe("fit-content");
});

test("横並びの親の中で widthMode を fill にすると主軸方向に伸びる", () => {
  const style = styleOf(
    { name: "box", type: "Box", props: { widthMode: "fill" } },
    { direction: "row" },
  );

  expect(style["flex-grow"]).toBe("1");
  expect(style).not.toHaveProperty("width");
});

test("縦並びの親の中で widthMode を fill にすると交差軸方向に引き伸ばされる", () => {
  const style = styleOf(
    { name: "box", type: "Box", props: { widthMode: "fill" } },
    { direction: "column" },
  );

  expect(style["align-self"]).toBe("stretch");
});

test("縦並びの親の中で heightMode を fill にすると主軸方向に伸びる", () => {
  const style = styleOf(
    { name: "box", type: "Box", props: { heightMode: "fill" } },
    { direction: "column" },
  );

  expect(style["flex-grow"]).toBe("1");
});

test("横並びの親の中で heightMode を fill にすると交差軸方向に引き伸ばされる", () => {
  const style = styleOf(
    { name: "box", type: "Box", props: { heightMode: "fill" } },
    { direction: "row" },
  );

  expect(style["align-self"]).toBe("stretch");
});

test("子の fill は親ノードの direction に従って出し分けられる", () => {
  const compiled = Result.unwrap(
    NodeHtml.compile({
      name: "row",
      type: "Box",
      props: { direction: "row" },
      children: [{ name: "child", type: "Box", props: { widthMode: "fill" } }],
    }),
  );

  expect(compiled.kind === "box" && compiled.children[0].style).toEqual({
    display: "flex",
    "flex-direction": "column",
    "align-items": "stretch",
    "justify-content": "start",
    "flex-grow": "1",
    height: "fit-content",
  });
});

test("親を持たない位置の fill は flex アイテムではないため宣言を出力しない", () => {
  const style = styleOf({
    name: "root",
    type: "Box",
    props: { widthMode: "fill" },
  });

  expect(style).not.toHaveProperty("flex-grow");
  expect(style).not.toHaveProperty("align-self");
});

test("widthMode が fixed でも width が未指定なら幅の宣言を出力しない", () => {
  const style = styleOf({
    name: "box",
    type: "Box",
    props: { widthMode: "fixed" },
  });

  expect(style).not.toHaveProperty("width");
});
