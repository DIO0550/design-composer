import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";
import { NodeHtml } from "../index";
import { styleOf } from "./setup";

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
    Option.some("row"),
  );

  expect(style["flex-grow"]).toBe("1");
  expect(style).not.toHaveProperty("width");
});

test("縦並びの親の中で widthMode を fill にすると交差軸方向に引き伸ばされる", () => {
  const style = styleOf(
    { name: "box", type: "Box", props: { widthMode: "fill" } },
    Option.some("column"),
  );

  expect(style["align-self"]).toBe("stretch");
});

test("縦並びの親の中で heightMode を fill にすると主軸方向に伸びる", () => {
  const style = styleOf(
    { name: "box", type: "Box", props: { heightMode: "fill" } },
    Option.some("column"),
  );

  expect(style["flex-grow"]).toBe("1");
});

test("横並びの親の中で heightMode を fill にすると交差軸方向に引き伸ばされる", () => {
  const style = styleOf(
    { name: "box", type: "Box", props: { heightMode: "fill" } },
    Option.some("row"),
  );

  expect(style["align-self"]).toBe("stretch");
});

test("子の fill は親ノードの layout に従って出し分けられる", () => {
  const compiled = Result.unwrap(
    NodeHtml.compile({
      name: "row",
      type: "Box",
      props: { layout: "row" },
      children: [{ name: "child", type: "Box", props: { widthMode: "fill" } }],
    }),
  );

  expect(compiled.kind === "box" && compiled.children[0].style).toEqual({
    display: "flex",
    position: "relative",
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

test("自由配置の親の中では子の fill が宣言を出さない", () => {
  const compiled = Result.unwrap(
    NodeHtml.compile({
      name: "free",
      type: "Box",
      props: { layout: "free" },
      children: [
        { name: "child", type: "Box", props: { widthMode: "fill" } },
        { name: "tall", type: "Box", props: { heightMode: "fill" } },
      ],
    }),
  );

  const children = compiled.kind === "box" ? compiled.children : [];
  expect(children.map((child) => child.style)).toEqual([
    expect.not.objectContaining({ "flex-grow": "1" }),
    expect.not.objectContaining({ "flex-grow": "1" }),
  ]);
});

test("横並びの親の中では子の fill が宣言を出す", () => {
  const compiled = Result.unwrap(
    NodeHtml.compile({
      name: "row",
      type: "Box",
      props: { layout: "row" },
      children: [{ name: "child", type: "Box", props: { widthMode: "fill" } }],
    }),
  );

  const children = compiled.kind === "box" ? compiled.children : [];
  expect(children[0].style["flex-grow"]).toBe("1");
});
