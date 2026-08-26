import { expect, test } from "vitest";
import {
  DesignDocument,
  DocumentTemplate,
} from "@/domains/dcmp/design-document";
import type { Node } from "@/domains/dcmp/node";
import { DocumentSelection } from "@/domains/document-selection";
import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";
import { SelectionControls } from "../index";
import {
  colorOfControl,
  controlsIn,
  resolvedValueOfControl,
  sectionsOf,
} from "./setup";

function setupDocument(children: readonly Node[]): DesignDocument {
  return DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
    components: DocumentTemplate.Default.components,
    artboards: [
      { name: "home", width: 360, height: 240, children: [...children] },
    ],
  });
}

function setupSelection(
  children: readonly Node[],
  ...selected: readonly string[]
): DocumentSelection {
  return DocumentSelection.fromNames(setupDocument(children), selected);
}

function controlOf(selection: DocumentSelection, prop: string) {
  return sectionsOf(selection)
    .flatMap(controlsIn)
    .find((control) => control.prop === prop);
}

test("選択されていないときはコントロールが生成されない", () => {
  const selection = DocumentSelection.fromNames(DesignDocument.create({}), []);

  expect(SelectionControls.forSelection(selection)).toEqual(Option.none);
});

test("選んでいる名前がドキュメントに無いときはコントロールが生成されない", () => {
  const selection = setupSelection([{ name: "box", type: "Box" }], "ghost");

  expect(SelectionControls.forSelection(selection)).toEqual(Option.none);
});

test("複数選んでいるときは編集欄を持たず選択件数だけを持つ", () => {
  const selection = setupSelection(
    [
      { name: "box", type: "Box" },
      { name: "title", type: "Text" },
      { name: "note", type: "Text" },
    ],
    "box",
    "title",
    "note",
  );

  expect(SelectionControls.forSelection(selection)).toEqual(
    Option.some({ kind: "multiple", count: 3 }),
  );
});

test("enum の prop は宣言された値から選ぶコントロールになる", () => {
  const selection = setupSelection([{ name: "box", type: "Box" }], "box");

  expect(controlOf(selection, "direction")?.input).toEqual({
    kind: "enum",
    values: ["row", "column"],
  });
});

test("トークン参照の prop はその種別のトークン名から選ぶコントロールになる", () => {
  const selection = setupSelection([{ name: "box", type: "Box" }], "box");

  expect(controlOf(selection, "shadow")?.input).toEqual({
    kind: "token",
    names: ["sm", "md", "lg"],
  });
});

test("数値のトークンを取る prop は今効いているトークンの解決値を持つ", () => {
  const selection = setupSelection(
    [{ name: "box", type: "Box", props: { gap: "md" } }],
    "box",
  );

  expect(resolvedValueOfControl(controlOf(selection, "gap"))).toEqual(
    Option.some(DocumentTemplate.Default.tokens.spacing.md),
  );
});

test("値も既定も持たない数値のトークン参照は解決値を持たない", () => {
  const selection = setupSelection([{ name: "box", type: "Box" }], "box");

  expect(resolvedValueOfControl(controlOf(selection, "gap"))).toEqual(
    Option.none,
  );
});

test("実在しないトークンを指す数値の prop は解決値を持たない", () => {
  const selection = setupSelection(
    [{ name: "box", type: "Box", props: { gap: "nope" } }],
    "box",
  );

  expect(resolvedValueOfControl(controlOf(selection, "gap"))).toEqual(
    Option.none,
  );
});

test("トークンの値を変えると解決値もその値に追随する", () => {
  const document = setupDocument([
    { name: "box", type: "Box", props: { gap: "md" } },
  ]);
  const edited = Result.unwrap(
    DesignDocument.replaceToken(document, {
      kind: "spacing",
      name: "md",
      value: 40,
    }),
  );

  expect(
    resolvedValueOfControl(
      controlOf(DocumentSelection.fromNames(edited, ["box"]), "gap"),
    ),
  ).toEqual(Option.some(40));
});

test("色のトークン参照の prop はトークン名から選ぶコントロールになる", () => {
  const selection = setupSelection([{ name: "box", type: "Box" }], "box");

  expect(controlOf(selection, "background")?.input.kind).toBe("colorToken");
});

test("色のトークン参照の prop は設定されている色を持つ", () => {
  const selection = setupSelection(
    [{ name: "box", type: "Box", props: { background: "primary" } }],
    "box",
  );

  expect(colorOfControl(controlOf(selection, "background"))).toEqual(
    Option.some(DocumentTemplate.Default.tokens.colors.primary),
  );
});

test("値が無くても既定を持つ色のトークン参照は既定の色を持つ", () => {
  const selection = setupSelection([{ name: "label", type: "Text" }], "label");

  expect(colorOfControl(controlOf(selection, "color"))).toEqual(
    Option.some(DocumentTemplate.Default.tokens.colors["gray-900"]),
  );
});

test("値も既定も持たない色のトークン参照は色を持たない", () => {
  const selection = setupSelection([{ name: "box", type: "Box" }], "box");

  expect(colorOfControl(controlOf(selection, "background"))).toEqual(
    Option.none,
  );
});

test("実在しないトークンを指す色の prop は色を持たない", () => {
  const selection = setupSelection(
    [{ name: "box", type: "Box", props: { background: "nope" } }],
    "box",
  );

  expect(colorOfControl(controlOf(selection, "background"))).toEqual(
    Option.none,
  );
});

test("宣言に無い値が設定されている enum はその値も選択肢に出る", () => {
  const selection = setupSelection(
    [{ name: "box", type: "Box", props: { direction: "diagonal" } }],
    "box",
  );

  expect(controlOf(selection, "direction")?.input).toEqual({
    kind: "enum",
    values: ["diagonal", "row", "column"],
  });
});

test("実在しないトークンを指す prop はその名前も選択肢に出る", () => {
  const selection = setupSelection(
    [{ name: "box", type: "Box", props: { gap: "nope" } }],
    "box",
  );

  expect(controlOf(selection, "gap")?.input).toEqual({
    kind: "numericToken",
    names: ["nope", "xs", "sm", "md", "lg", "xl"],
    resolvedValue: Option.none,
  });
});

test("数値の生リテラルの prop は数値入力のコントロールになる", () => {
  const selection = setupSelection(
    [{ name: "box", type: "Box", props: { widthMode: "fixed" } }],
    "box",
  );

  expect(controlOf(selection, "width")?.input).toEqual({ kind: "number" });
});

test("文字列の生リテラルの prop は文字列入力のコントロールになる", () => {
  const selection = setupSelection([{ name: "label", type: "Text" }], "label");

  expect(controlOf(selection, "content")?.input).toEqual({ kind: "text" });
});

test("設定されている prop はその値がコントロールに乗る", () => {
  const selection = setupSelection(
    [{ name: "box", type: "Box", props: { gap: "md" } }],
    "box",
  );

  expect(controlOf(selection, "gap")?.value).toEqual(Option.some("md"));
});

test("設定されていない prop は値を持たず、スキーマの既定だけがコントロールに乗る", () => {
  const selection = setupSelection([{ name: "box", type: "Box" }], "box");
  const control = controlOf(selection, "direction");

  expect(control?.value.some).toBe(false);
  expect(control?.defaultValue).toEqual(Option.some("column"));
});

test("条件付きの prop は条件を出している prop の名前を持つ", () => {
  const selection = setupSelection(
    [{ name: "box", type: "Box", props: { widthMode: "fixed" } }],
    "box",
  );

  expect(controlOf(selection, "width")?.enabledBy).toEqual(
    Option.some("widthMode"),
  );
});

test("条件を持たない prop は条件を出している prop の名前を持たない", () => {
  const selection = setupSelection([{ name: "box", type: "Box" }], "box");

  expect(controlOf(selection, "direction")?.enabledBy).toEqual(Option.none);
});

test("コントロールは group ごとのセクションに分かれる", () => {
  const selection = setupSelection([{ name: "label", type: "Text" }], "label");

  expect(sectionsOf(selection).map((s) => s.group)).toEqual([
    "content",
    "appearance",
  ]);
});

test("セクション内のコントロールはスキーマの宣言順に並ぶ", () => {
  const selection = setupSelection([{ name: "label", type: "Text" }], "label");
  const appearance = sectionsOf(selection).find(
    (section) => section.group === "appearance",
  );

  expect(
    appearance === undefined
      ? undefined
      : controlsIn(appearance).map((control) => control.prop),
  ).toEqual(["typography", "color", "align"]);
});

test("artboard を選ぶと Box の prop を編集するコントロールが出る", () => {
  const selection = setupSelection([], "home");

  expect(controlOf(selection, "background")?.input.kind).toBe("colorToken");
});

test("artboard のはみ出しの既定は clip として出る", () => {
  const selection = setupSelection([], "home");

  expect(controlOf(selection, "overflow")?.defaultValue).toEqual(
    Option.some("clip"),
  );
});

test("artboard のサイズは props で変えられないのでコントロールが出ない", () => {
  const selection = setupSelection([], "home");

  expect(controlOf(selection, "widthMode")).toBeUndefined();
  expect(controlOf(selection, "width")).toBeUndefined();
});
