import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { Result } from "@/utils/Result";
import {
  group,
  propsOf,
  setupArtboardDocument,
  setupPanelDocument,
} from "./group-setup";

// docs/06-ui.md「編集操作の一覧」のグループ化・「複数選択」のグループ化

test("揃えを書いていない column の親の下でフローの Text を包むと、Box の幅が fill になる", () => {
  const grouped = group(
    setupPanelDocument({ layout: "column" }, [{ name: "title", type: "Text" }]),
    ["title"],
  );

  expect(propsOf(grouped, "box")).toEqual({ widthMode: "fill" });
});

test("layout: row の親の下でフローの Text を包むと、Box の高さが fill になる", () => {
  const grouped = group(
    setupPanelDocument({ layout: "row" }, [{ name: "title", type: "Text" }]),
    ["title"],
  );

  expect(propsOf(grouped, "box")).toEqual({ heightMode: "fill" });
});

test("何も書いていない artboard の直下で Text を包むと、Box の幅が fill になる", () => {
  const document = setupArtboardDocument({
    children: [{ name: "title", type: "Text" }],
  });

  expect(propsOf(group(document, ["title"]), "box")).toEqual({
    widthMode: "fill",
  });
});

test("layout: row と書いた artboard の直下で Text を包むと、Box の高さが fill になる", () => {
  const document = setupArtboardDocument({
    artboardProps: { layout: "row" },
    children: [{ name: "title", type: "Text" }],
  });

  expect(propsOf(group(document, ["title"]), "box")).toEqual({
    heightMode: "fill",
  });
});

test("揃えが center の column の親の下で Text を包んだ Box は、大きさの prop を持たない", () => {
  const grouped = group(
    setupPanelDocument({ align: "center" }, [{ name: "title", type: "Text" }]),
    ["title"],
  );

  expect(propsOf(grouped, "box")).toEqual({});
});

test("layout: free の親の下で Text を包んだ Box は、大きさの prop を持たない", () => {
  const grouped = group(
    setupPanelDocument({ layout: "free" }, [{ name: "title", type: "Text" }]),
    ["title"],
  );

  expect(propsOf(grouped, "box")).toEqual({});
});

test("揃えが stretch の親の下で絶対配置の Text を包むと、Box は配置だけを持ち fill を持たない", () => {
  const grouped = group(
    setupPanelDocument({}, [
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
    setupPanelDocument({}, [
      { name: "title", type: "Text", props: { content: "見出し" } },
    ]),
    ["title"],
  );

  expect(propsOf(grouped, "title")).toEqual({ content: "見出し" });
});

test("揃えが stretch の親の下で Ellipse を包んだ Box は、大きさの prop を持たない", () => {
  const grouped = group(
    setupPanelDocument({}, [{ name: "dot", type: "Ellipse" }]),
    ["dot"],
  );

  expect(propsOf(grouped, "box")).toEqual({});
});

test("揃えが stretch の親の下で部品のルートが Text のインスタンスを包むと、Box の幅が fill になる", () => {
  const document = setupArtboardDocument({
    components: { caption: { type: "Text" } },
    children: [{ name: "label", ref: "caption" }],
  });

  expect(propsOf(group(document, ["label"]), "box")).toEqual({
    widthMode: "fill",
  });
});

test("揃えが stretch の親の下で部品のルートが Box のインスタンスを包んだ Box は、大きさの prop を持たない", () => {
  const document = setupArtboardDocument({
    components: { card: { type: "Box" } },
    children: [{ name: "hero", ref: "card" }],
  });

  expect(propsOf(group(document, ["hero"]), "box")).toEqual({});
});

test("layout: row と書いた artboard の直下で部品のルートが Text のインスタンスを包むと、Box の高さが fill になる", () => {
  const document = setupArtboardDocument({
    artboardProps: { layout: "row" },
    components: { caption: { type: "Text" } },
    children: [{ name: "label", ref: "caption" }],
  });

  expect(propsOf(group(document, ["label"]), "box")).toEqual({
    heightMode: "fill",
  });
});

test("揃えが stretch の親の下で部品のルートが Text のインスタンスと Box をまとめて包むと、Box の幅が fill になる", () => {
  const document = setupArtboardDocument({
    components: { caption: { type: "Text" } },
    children: [
      { name: "label", ref: "caption" },
      { name: "card", type: "Box" },
    ],
  });

  expect(propsOf(group(document, ["label", "card"]), "box")).toEqual({
    widthMode: "fill",
  });
});

test("column の親の下で Text と Box をまとめて包むと、Box の幅が fill になる", () => {
  const grouped = group(
    setupPanelDocument({}, [
      { name: "title", type: "Text" },
      { name: "card", type: "Box" },
    ]),
    ["title", "card"],
  );

  expect(propsOf(grouped, "box")).toEqual({ widthMode: "fill" });
});

test("row の親の下で Text と Box をまとめて包むと、Box は row で並べ、高さが fill になる", () => {
  const grouped = group(
    setupPanelDocument({ layout: "row" }, [
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

test("揃えが center の親の下で Text と Box をまとめて包むと、Box は親の揃えだけを持ち fill を持たない", () => {
  const grouped = group(
    setupPanelDocument({ align: "center" }, [
      { name: "title", type: "Text" },
      { name: "card", type: "Box" },
    ]),
    ["title", "card"],
  );

  expect(propsOf(grouped, "box")).toEqual({ align: "center" });
});

test("column の親の下で Box、Text の順にまとめて包んでも、Box の幅が fill になる", () => {
  const grouped = group(
    setupPanelDocument({}, [
      { name: "card", type: "Box" },
      { name: "title", type: "Text" },
    ]),
    ["card", "title"],
  );

  expect(propsOf(grouped, "box")).toEqual({ widthMode: "fill" });
});

test("揃えが stretch の親の下の Text を包んでから外すと、元のドキュメントに戻る", () => {
  const document = setupPanelDocument({}, [
    { name: "title", type: "Text", props: { content: "見出し" } },
  ]);

  const ungrouped = Result.unwrap(
    DesignDocument.ungroupBox(group(document, ["title"]), "box"),
  );

  expect(ungrouped.document).toEqual(document);
});

test("揃えが stretch の親の下で部品のルートが Text のインスタンスを包んでから外すと、元のドキュメントに戻る", () => {
  const document = setupArtboardDocument({
    components: { caption: { type: "Text" } },
    children: [{ name: "label", ref: "caption" }],
  });

  const ungrouped = Result.unwrap(
    DesignDocument.ungroupBox(group(document, ["label"]), "box"),
  );

  expect(ungrouped.document).toEqual(document);
});
