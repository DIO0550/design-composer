import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/dcmp/design-document";
import type { NonEmptyArray } from "@/types/NonEmptyArray";
import { Result } from "@/utils/Result";
import { propsOf, setupDocument } from "./group-setup";

/*
 * 親の `stretch` に交差軸へ引き伸ばされているノードを包むと、Box もその軸を `fill` にする
 * （docs/06-ui.md「編集操作の一覧」のグループ化・「複数選択」）。
 */

/**
 * 名前で指したノードを box という名前の Box で包む。
 *
 * @param document 包む先のドキュメント
 * @param names 包むノードの名前
 * @returns 包んだあとのドキュメント
 */
function group(
  document: DesignDocument,
  names: NonEmptyArray<string>,
): DesignDocument {
  return Result.unwrap(DesignDocument.groupIntoBox(document, names, "box"));
}

test("揃えを書いていない column の親の下でフローの Text を包むと、Box の幅が fill になる", () => {
  const grouped = group(
    setupDocument({ layout: "column" }, [{ name: "title", type: "Text" }]),
    ["title"],
  );

  expect(propsOf(grouped, "box")).toEqual({ widthMode: "fill" });
});

test("layout: row の親の下でフローの Text を包むと、Box の高さが fill になる", () => {
  const grouped = group(
    setupDocument({ layout: "row" }, [{ name: "title", type: "Text" }]),
    ["title"],
  );

  expect(propsOf(grouped, "box")).toEqual({ heightMode: "fill" });
});

test("何も書いていない artboard の直下で Text を包むと、Box の幅が fill になる", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [{ name: "title", type: "Text" }],
      },
    ],
  });

  expect(propsOf(group(document, ["title"]), "box")).toEqual({
    widthMode: "fill",
  });
});

test("layout: row と書いた artboard の直下で Text を包むと、Box の高さが fill になる", () => {
  const document = DesignDocument.create({
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        props: { layout: "row" },
        children: [{ name: "title", type: "Text" }],
      },
    ],
  });

  expect(propsOf(group(document, ["title"]), "box")).toEqual({
    heightMode: "fill",
  });
});

test("揃えが center の column の親の下で Text を包んだ Box は、大きさの prop を持たない", () => {
  const grouped = group(
    setupDocument({ align: "center" }, [{ name: "title", type: "Text" }]),
    ["title"],
  );

  expect(propsOf(grouped, "box")).toEqual({});
});

test("layout: free の親の下で Text を包んだ Box は、大きさの prop を持たない", () => {
  const grouped = group(
    setupDocument({ layout: "free" }, [{ name: "title", type: "Text" }]),
    ["title"],
  );

  expect(propsOf(grouped, "box")).toEqual({});
});

test("stretch の親の下で絶対配置の Text を包むと、Box は配置だけを持ち fill を持たない", () => {
  const grouped = group(
    setupDocument({}, [
      {
        name: "title",
        type: "Text",
        props: { placement: "absolute", x: 24, y: 48 },
      },
    ]),
    ["title"],
  );

  expect(propsOf(grouped, "box")).toEqual({
    placement: "absolute",
    x: 24,
    y: 48,
  });
});

test("Text を包んでも Text の props は変わらない", () => {
  const grouped = group(
    setupDocument({}, [
      { name: "title", type: "Text", props: { content: "見出し" } },
    ]),
    ["title"],
  );

  expect(propsOf(grouped, "title")).toEqual({ content: "見出し" });
});

test("stretch の親の下で Ellipse を包んだ Box は、大きさの prop を持たない", () => {
  const grouped = group(setupDocument({}, [{ name: "dot", type: "Ellipse" }]), [
    "dot",
  ]);

  expect(propsOf(grouped, "box")).toEqual({});
});

test("stretch の親の下で部品インスタンスを包んだ Box は、大きさの prop を持たない", () => {
  const document = DesignDocument.create({
    components: { Caption: { type: "Text" } },
    artboards: [
      {
        name: "screen",
        width: 375,
        height: 812,
        children: [{ name: "caption", ref: "Caption" }],
      },
    ],
  });

  expect(propsOf(group(document, ["caption"]), "box")).toEqual({});
});

test("column の親の下で Text と Box をまとめて包むと、Box の幅が fill になる", () => {
  const grouped = group(
    setupDocument({}, [
      { name: "title", type: "Text" },
      { name: "card", type: "Box" },
    ]),
    ["title", "card"],
  );

  expect(propsOf(grouped, "box")).toEqual({ widthMode: "fill" });
});

test("row の親の下で Text と Box をまとめて包むと、Box は row で並べ、高さが fill になる", () => {
  const grouped = group(
    setupDocument({ layout: "row" }, [
      { name: "title", type: "Text" },
      { name: "card", type: "Box" },
    ]),
    ["title", "card"],
  );

  expect(propsOf(grouped, "box")).toEqual({
    layout: "row",
    heightMode: "fill",
  });
});

test("stretch の親の下の Text を包んでから外すと、元のドキュメントに戻る", () => {
  const document = setupDocument({}, [
    { name: "title", type: "Text", props: { content: "見出し" } },
  ]);

  const ungrouped = Result.unwrap(
    DesignDocument.ungroupBox(group(document, ["title"]), "box"),
  );

  expect(ungrouped.document).toEqual(document);
});
