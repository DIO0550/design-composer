import { expect, test } from "vitest";
import { DesignDocument, DocumentTemplate } from "@/domains/design-document";
import type { Node } from "@/domains/node";
import { EditorState } from "@/features/editor/domains/editor-state";
import { Option } from "@/utils/Option";
import { SelectionControls } from "../index";
import { colorOfControl, sectionsOf } from "./setup";

function setupState(children: readonly Node[], selected: string): EditorState {
  return EditorState.select(
    EditorState.create(
      DesignDocument.create({
        tokens: DocumentTemplate.DEFAULT.tokens,
        components: DocumentTemplate.DEFAULT.components,
        artboards: [
          { name: "home", width: 360, height: 240, children: [...children] },
        ],
      }),
    ),
    selected,
  );
}

function controlOf(state: EditorState, prop: string) {
  return sectionsOf(state)
    .flatMap((section) => section.controls)
    .find((control) => control.prop === prop);
}

test("選択されていないときはコントロールが生成されない", () => {
  const state = EditorState.create(DesignDocument.create({}));

  expect(SelectionControls.forSelection(state)).toEqual(Option.none);
});

test("enum の prop は宣言された値から選ぶコントロールになる", () => {
  const state = setupState([{ name: "box", type: "Box" }], "box");

  expect(controlOf(state, "direction")?.input).toEqual({
    kind: "enum",
    values: ["row", "column"],
  });
});

test("トークン参照の prop はその種別のトークン名から選ぶコントロールになる", () => {
  const state = setupState([{ name: "box", type: "Box" }], "box");

  expect(controlOf(state, "gap")?.input).toEqual({
    kind: "token",
    names: ["xs", "sm", "md", "lg", "xl"],
  });
});

test("色のトークン参照の prop はトークン名から選ぶコントロールになる", () => {
  const state = setupState([{ name: "box", type: "Box" }], "box");

  expect(controlOf(state, "background")?.input.kind).toBe("colorToken");
});

test("色のトークン参照の prop は設定されている色を持つ", () => {
  const state = setupState(
    [{ name: "box", type: "Box", props: { background: "primary" } }],
    "box",
  );

  expect(colorOfControl(controlOf(state, "background"))).toEqual(
    Option.some(DocumentTemplate.DEFAULT.tokens.colors.primary),
  );
});

test("値が無くても既定を持つ色のトークン参照は既定の色を持つ", () => {
  const state = setupState([{ name: "label", type: "Text" }], "label");

  expect(colorOfControl(controlOf(state, "color"))).toEqual(
    Option.some(DocumentTemplate.DEFAULT.tokens.colors["gray-900"]),
  );
});

test("値も既定も持たない色のトークン参照は色を持たない", () => {
  const state = setupState([{ name: "box", type: "Box" }], "box");

  expect(colorOfControl(controlOf(state, "background"))).toEqual(Option.none);
});

test("実在しないトークンを指す色の prop は色を持たない", () => {
  const state = setupState(
    [{ name: "box", type: "Box", props: { background: "nope" } }],
    "box",
  );

  expect(colorOfControl(controlOf(state, "background"))).toEqual(Option.none);
});

test("宣言に無い値が設定されている enum はその値も選択肢に出る", () => {
  const state = setupState(
    [{ name: "box", type: "Box", props: { direction: "diagonal" } }],
    "box",
  );

  expect(controlOf(state, "direction")?.input).toEqual({
    kind: "enum",
    values: ["diagonal", "row", "column"],
  });
});

test("実在しないトークンを指す prop はその名前も選択肢に出る", () => {
  const state = setupState(
    [{ name: "box", type: "Box", props: { gap: "nope" } }],
    "box",
  );

  expect(controlOf(state, "gap")?.input).toEqual({
    kind: "token",
    names: ["nope", "xs", "sm", "md", "lg", "xl"],
  });
});

test("数値の生リテラルの prop は数値入力のコントロールになる", () => {
  const state = setupState(
    [{ name: "box", type: "Box", props: { widthMode: "fixed" } }],
    "box",
  );

  expect(controlOf(state, "width")?.input).toEqual({ kind: "number" });
});

test("文字列の生リテラルの prop は文字列入力のコントロールになる", () => {
  const state = setupState([{ name: "label", type: "Text" }], "label");

  expect(controlOf(state, "content")?.input).toEqual({ kind: "text" });
});

test("設定されている prop はその値がコントロールに乗る", () => {
  const state = setupState(
    [{ name: "box", type: "Box", props: { gap: "md" } }],
    "box",
  );

  expect(controlOf(state, "gap")?.value).toEqual(Option.some("md"));
});

test("設定されていない prop は値を持たず、スキーマの既定だけがコントロールに乗る", () => {
  const state = setupState([{ name: "box", type: "Box" }], "box");
  const control = controlOf(state, "direction");

  expect(control?.value.some).toBe(false);
  expect(control?.defaultValue).toEqual(Option.some("column"));
});

test("条件付きの prop は条件を出している prop の名前を持つ", () => {
  const state = setupState(
    [{ name: "box", type: "Box", props: { widthMode: "fixed" } }],
    "box",
  );

  expect(controlOf(state, "width")?.enabledBy).toEqual(
    Option.some("widthMode"),
  );
});

test("条件を持たない prop は条件を出している prop の名前を持たない", () => {
  const state = setupState([{ name: "box", type: "Box" }], "box");

  expect(controlOf(state, "direction")?.enabledBy).toEqual(Option.none);
});

test("コントロールは group ごとのセクションに分かれる", () => {
  const state = setupState([{ name: "label", type: "Text" }], "label");

  expect(sectionsOf(state).map((s) => s.group)).toEqual([
    "content",
    "appearance",
  ]);
});

test("セクション内のコントロールはスキーマの宣言順に並ぶ", () => {
  const state = setupState([{ name: "label", type: "Text" }], "label");
  const appearance = sectionsOf(state).find(
    (section) => section.group === "appearance",
  );

  expect(appearance?.controls.map((control) => control.prop)).toEqual([
    "typography",
    "color",
    "align",
  ]);
});

test("artboard を選ぶと Box の prop を編集するコントロールが出る", () => {
  const state = setupState([], "home");

  expect(controlOf(state, "background")?.input.kind).toBe("colorToken");
});

test("artboard のはみ出しの既定は clip として出る", () => {
  const state = setupState([], "home");

  expect(controlOf(state, "overflow")?.defaultValue).toEqual(
    Option.some("clip"),
  );
});

test("artboard のサイズは props で変えられないのでコントロールが出ない", () => {
  const state = setupState([], "home");

  expect(controlOf(state, "widthMode")).toBeUndefined();
  expect(controlOf(state, "width")).toBeUndefined();
});
