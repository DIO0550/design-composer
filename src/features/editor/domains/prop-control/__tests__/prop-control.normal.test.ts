import { expect, test } from "vitest";
import { DesignDocument, DocumentTemplate } from "@/domains/design-document";
import type { Node } from "@/domains/node";
import { EditorState } from "@/features/editor/domains/editor-state";
import { Option } from "@/utils/Option";
import { PropControlSection } from "../index";

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
  return PropControlSection.forSelection(state)
    .flatMap((section) => section.controls)
    .find((control) => control.prop === prop);
}

test("選択されていないときはコントロールが生成されない", () => {
  const state = EditorState.create(DesignDocument.create({}));

  expect(PropControlSection.forSelection(state)).toEqual([]);
});

test("enum の prop は宣言された値から選ぶコントロールになる", () => {
  const state = setupState([{ name: "box", type: "Box" }], "box");

  expect(controlOf(state, "direction")?.input).toEqual({
    kind: "choice",
    options: ["row", "column"],
  });
});

test("トークン参照の prop はその種別のトークン名から選ぶコントロールになる", () => {
  const state = setupState([{ name: "box", type: "Box" }], "box");

  expect(controlOf(state, "gap")?.input).toEqual({
    kind: "choice",
    options: ["xs", "sm", "md", "lg", "xl"],
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

test("コントロールは group ごとのセクションに分かれる", () => {
  const state = setupState([{ name: "label", type: "Text" }], "label");

  expect(PropControlSection.forSelection(state).map((s) => s.group)).toEqual([
    "content",
    "appearance",
  ]);
});

test("セクション内のコントロールはスキーマの宣言順に並ぶ", () => {
  const state = setupState([{ name: "label", type: "Text" }], "label");
  const appearance = PropControlSection.forSelection(state).find(
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

  expect(controlOf(state, "background")?.input.kind).toBe("choice");
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
