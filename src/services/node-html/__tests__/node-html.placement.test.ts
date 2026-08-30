import { expect, test } from "vitest";
import type { ExpandedNode } from "@/domains/dcmp/expanded-node";
import { Result } from "@/utils/Result";
import { NodeHtml } from "../index";

function styleOf(node: ExpandedNode): Readonly<Record<string, string>> {
  return Result.unwrap(NodeHtml.compile(node)).style;
}

/** 子の並びから、指定した宣言の値を並び順に取り出す。 */
function childValuesOf(
  node: ExpandedNode,
  property: string,
): readonly (string | undefined)[] {
  const compiled = Result.unwrap(NodeHtml.compile(node));
  const children = compiled.kind === "box" ? compiled.children : [];
  return children.map((child) => child.style[property]);
}

test("フローの Box は絶対配置の子が位置を測る基準になる", () => {
  expect(styleOf({ name: "box", type: "Box" }).position).toBe("relative");
});

test("絶対配置の Box は指定した座標に置かれる", () => {
  const style = styleOf({
    name: "box",
    type: "Box",
    props: { placement: "absolute", x: 40, y: 24 },
  });

  expect(style).toMatchObject({
    position: "absolute",
    left: "40px",
    top: "24px",
  });
});

test("絶対配置の Text は指定した座標に置かれる", () => {
  const style = styleOf({
    name: "label",
    type: "Text",
    props: { placement: "absolute", x: 40, y: 24 },
  });

  expect(style).toMatchObject({
    position: "absolute",
    left: "40px",
    top: "24px",
  });
});

test("フローの Text は自分では位置を指定しない", () => {
  expect(styleOf({ name: "label", type: "Text" }).position).toBeUndefined();
});

test("配置を指定していないノードは座標を書いても動かない", () => {
  const style = styleOf({
    name: "label",
    type: "Text",
    props: { x: 40, y: 24 },
  });

  expect(style.left).toBeUndefined();
  expect(style.top).toBeUndefined();
});

test("fill が親いっぱいに広がるのはフローの子だけで、絶対配置の子は広がらない", () => {
  const grows = childValuesOf(
    {
      name: "row",
      type: "Box",
      props: { direction: "row" },
      children: [
        {
          name: "floating",
          type: "Box",
          props: { placement: "absolute", x: 40, y: 24, widthMode: "fill" },
        },
        { name: "flowing", type: "Box", props: { widthMode: "fill" } },
      ],
    },
    "flex-grow",
  );

  expect(grows).toEqual([undefined, "1"]);
});
