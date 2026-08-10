import { expect, test } from "vitest";
import type { ComponentSet } from "@/domains/component";
import { DesignDocument, DocumentTemplate } from "@/domains/design-document";
import type { Node } from "@/domains/node";
import { EditorState } from "@/features/editor/domains/editor-state";
import { Option } from "@/utils/Option";
import { SelectionControls } from "../index";
import {
  controlNamed,
  instanceOf,
  resolvedValueOfControl,
  sectionsOf,
} from "./setup";

const COMPONENTS: ComponentSet = {
  "primary-button": {
    publicProps: { label: { node: "button-label", prop: "content" } },
    type: "Box",
    children: [
      { name: "button-label", type: "Text", props: { content: "Button" } },
    ],
  },
  /** 数値のトークンを公開 prop にしている部品。既定からの解決を見るために使う。 */
  "gapped-card": {
    publicProps: { gap: { node: "gapped-card", prop: "gap" } },
    type: "Box",
    props: { gap: "lg" },
    children: [{ name: "gapped-card-title", type: "Text" }],
  },
  /** 公開 prop の並びと、条件つきの公開 prop を見るための部品。 */
  "sized-card": {
    publicProps: {
      title: { node: "sized-card-title", prop: "content" },
      widthMode: { node: "sized-card", prop: "widthMode" },
      width: { node: "sized-card", prop: "width" },
    },
    type: "Box",
    children: [{ name: "sized-card-title", type: "Text" }],
  },
};

function setupInstanceState(node: Node): EditorState {
  return EditorState.select(
    EditorState.create(
      DesignDocument.create({
        tokens: DocumentTemplate.DEFAULT.tokens,
        components: COMPONENTS,
        artboards: [
          { name: "home", width: 360, height: 240, children: [node] },
        ],
      }),
    ),
    node.name,
  );
}

function publicPropNames(state: EditorState): readonly string[] {
  return instanceOf(state).publicProps.map((control) => control.prop);
}

test("インスタンスを選ぶと部品が公開している prop のコントロールが出る", () => {
  const state = setupInstanceState({ name: "action", ref: "primary-button" });

  expect(publicPropNames(state)).toEqual(["label"]);
});

test("インスタンスを選ぶと元になっている部品の名前が出る", () => {
  const state = setupInstanceState({ name: "action", ref: "primary-button" });

  expect(instanceOf(state).source).toBe("primary-button");
});

test("インスタンス以外を選ぶと group ごとのセクションになる", () => {
  const state = setupInstanceState({ name: "action", type: "Box" });

  expect(sectionsOf(state).length).toBeGreaterThan(0);
});

test("公開 prop のコントロールは binding 先の prop の入力形式になる", () => {
  const state = setupInstanceState({ name: "action", ref: "primary-button" });

  expect(controlNamed(instanceOf(state).publicProps, "label").input).toEqual({
    kind: "text",
  });
});

test("上書きしていない数値トークンの公開 prop は部品が設定している値の解決値を持つ", () => {
  const state = setupInstanceState({ name: "action", ref: "gapped-card" });

  expect(
    resolvedValueOfControl(controlNamed(instanceOf(state).publicProps, "gap")),
  ).toEqual(Option.some(DocumentTemplate.DEFAULT.tokens.spacing.lg));
});

test("上書きしていない公開 prop は部品が設定している値が既定として出る", () => {
  const state = setupInstanceState({ name: "action", ref: "primary-button" });
  const control = controlNamed(instanceOf(state).publicProps, "label");

  expect(control.value.some).toBe(false);
  expect(control.defaultValue).toEqual(Option.some("Button"));
});

test("上書きしている公開 prop はその値がコントロールに乗る", () => {
  const state = setupInstanceState({
    name: "action",
    ref: "primary-button",
    overrides: { label: "ログイン" },
  });

  expect(controlNamed(instanceOf(state).publicProps, "label").value).toEqual(
    Option.some("ログイン"),
  );
});

test("公開 prop は部品が宣言した順に並ぶ", () => {
  const state = setupInstanceState({
    name: "card",
    ref: "sized-card",
    overrides: { widthMode: "fixed" },
  });

  expect(publicPropNames(state)).toEqual(["title", "widthMode", "width"]);
});

test("条件を満たさない公開 prop はコントロールが出ない", () => {
  const state = setupInstanceState({
    name: "card",
    ref: "sized-card",
    overrides: { widthMode: "hug" },
  });

  expect(publicPropNames(state)).toEqual(["title", "widthMode"]);
});

test("存在しない部品を指すインスタンスには公開 prop のコントロールが出ない", () => {
  const state = setupInstanceState({ name: "action", ref: "missing" });

  expect(instanceOf(state).publicProps).toEqual([]);
});

test("存在しない部品を指すインスタンスは解除できない", () => {
  const state = setupInstanceState({ name: "action", ref: "missing" });

  expect(instanceOf(state).isDetachEnabled).toBe(false);
});

test("部品が引けるインスタンスは解除できる", () => {
  const state = setupInstanceState({ name: "action", ref: "primary-button" });

  expect(instanceOf(state).isDetachEnabled).toBe(true);
});

test("スキーマの分からない type のノードにはコントロールが出ない", () => {
  const state = setupInstanceState({ name: "action", type: "Unknown" });

  expect(sectionsOf(state)).toEqual([]);
});

test("インスタンスを選ぶと元の部品の名前が Assets 側へも渡る", () => {
  const state = setupInstanceState({ name: "action", ref: "primary-button" });

  expect(SelectionControls.sourceName(instanceOf(state))).toEqual(
    Option.some("primary-button"),
  );
});

test("インスタンス以外を選んでいるときは元の部品が無い", () => {
  const state = setupInstanceState({ name: "action", type: "Box" });

  expect(
    SelectionControls.sourceName(
      Option.unwrap(SelectionControls.forSelection(state)),
    ),
  ).toEqual(Option.none);
});
