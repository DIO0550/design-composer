import { expect, test } from "vitest";
import type { Props } from "@/domains/dcmp/node";
import { Result } from "@/utils/Result";
import { DesignDocument } from "../index";
import { group, propsOf, setupArtboardDocument } from "./group-setup";

/*
 * 包むときに、ノードの `fill` を Box へ引き継ぐ（docs/06-ui.md「編集操作の一覧」の
 * グループ化）。
 */

/**
 * 画面の直下に 1 つのノードを置いたドキュメントで、そのノードを包む。
 *
 * @param props 包むノード（Box）の props
 * @returns 包んだあとのドキュメント
 */
function setupGrouped(props: Props): DesignDocument {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [{ name: "card", type: "Box", props, children: [] }],
      },
    ],
  });

  return Result.unwrap(DesignDocument.groupIntoBox(document, ["card"], "box"));
}

test("幅が fill のノードを包むと、Box の幅も fill になる", () => {
  const grouped = setupGrouped({ widthMode: "fill" });

  expect(propsOf(grouped, "box")).toEqual({ widthMode: "fill" });
});

test("高さが fill のノードを包むと、Box の高さも fill になる", () => {
  const grouped = setupGrouped({ heightMode: "fill" });

  expect(propsOf(grouped, "box")).toEqual({ heightMode: "fill" });
});

test("下限・上限の付いた fill のノードを包むと、Box も同じ下限・上限を持つ", () => {
  const grouped = setupGrouped({
    widthMode: "fill",
    minWidth: 120,
    maxWidth: 320,
  });

  expect(propsOf(grouped, "box")).toEqual({
    widthMode: "fill",
    minWidth: 120,
    maxWidth: 320,
  });
});

test("fill を持つノードを包んでも、ノードの fill は残る", () => {
  const grouped = setupGrouped({ widthMode: "fill", heightMode: "fill" });

  expect(propsOf(grouped, "card")).toEqual({
    widthMode: "fill",
    heightMode: "fill",
  });
});

test("長さが fixed のノードを包んだ Box は、大きさの prop を持たない", () => {
  const grouped = setupGrouped({
    widthMode: "fixed",
    width: 200,
    heightMode: "fixed",
    height: 80,
  });

  expect(propsOf(grouped, "box")).toEqual({});
});

test("下限・上限の付いた高さが fill のノードを包むと、Box も同じ高さの下限・上限を持つ", () => {
  const grouped = setupGrouped({
    heightMode: "fill",
    minHeight: 40,
    maxHeight: 160,
  });

  expect(propsOf(grouped, "box")).toEqual({
    heightMode: "fill",
    minHeight: 40,
    maxHeight: 160,
  });
});

test("部品のルートの幅が fill のインスタンスを包むと、Box の幅も fill になる", () => {
  const document = setupArtboardDocument({
    components: { card: { type: "Box", props: { widthMode: "fill" } } },
    children: [{ name: "hero", ref: "card" }],
  });

  expect(propsOf(group(document, ["hero"]), "box")).toEqual({
    widthMode: "fill",
  });
});

test("部品のルートの高さが下限・上限の付いた fill のインスタンスを包むと、Box も同じ高さの下限・上限を持つ", () => {
  const document = setupArtboardDocument({
    components: {
      card: {
        type: "Box",
        props: { heightMode: "fill", minHeight: 40, maxHeight: 160 },
      },
    },
    children: [{ name: "hero", ref: "card" }],
  });

  expect(propsOf(group(document, ["hero"]), "box")).toEqual({
    heightMode: "fill",
    minHeight: 40,
    maxHeight: 160,
  });
});

test("公開 prop で部品のルートの幅を fill に上書きしたインスタンスを包むと、Box の幅も fill になる", () => {
  const document = setupArtboardDocument({
    components: {
      card: {
        type: "Box",
        props: { widthMode: "hug" },
        publicProps: { width: { node: "card", prop: "widthMode" } },
      },
    },
    children: [{ name: "hero", ref: "card", overrides: { width: "fill" } }],
  });

  expect(propsOf(group(document, ["hero"]), "box")).toEqual({
    widthMode: "fill",
  });
});

test("layout: free の親の下で部品のルートの幅が fill のインスタンスを包んだ Box は、大きさの prop を持たない", () => {
  const document = setupArtboardDocument({
    artboardProps: { layout: "free" },
    components: { card: { type: "Box", props: { widthMode: "fill" } } },
    children: [{ name: "hero", ref: "card" }],
  });

  expect(propsOf(group(document, ["hero"]), "box")).toEqual({});
});

test("参照先の部品が無いインスタンスを包むと、包めて、Box は大きさの prop を持たない", () => {
  const document = setupArtboardDocument({
    children: [{ name: "hero", ref: "missing" }],
  });

  const grouped = DesignDocument.groupIntoBox(document, ["hero"], "box");

  expect(Result.map(grouped, (done) => propsOf(done, "box"))).toEqual(
    Result.ok({}),
  );
});
