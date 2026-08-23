import { expect, test } from "vitest";
import type { ComponentSet } from "@/domains/component";
import { DesignDocument, DocumentTemplate } from "@/domains/design-document";
import { DocumentSelection } from "@/domains/document-selection";
import type { Node } from "@/domains/node";
import { Option } from "@/utils/Option";
import {
  controlNamed,
  instanceOf,
  resolvedValueOfControl,
  sectionsOf,
} from "./setup";

const Components: ComponentSet = {
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

function setupInstanceSelection(node: Node): DocumentSelection {
  return DocumentSelection.fromNames(
    DesignDocument.create({
      tokens: DocumentTemplate.Default.tokens,
      components: Components,
      artboards: [{ name: "home", width: 360, height: 240, children: [node] }],
    }),
    [node.name],
  );
}

function publicPropNames(selection: DocumentSelection): readonly string[] {
  return instanceOf(selection).publicProps.map((control) => control.prop);
}

test("インスタンスを選ぶと部品が公開している prop のコントロールが出る", () => {
  const selection = setupInstanceSelection({
    name: "action",
    ref: "primary-button",
  });

  expect(publicPropNames(selection)).toEqual(["label"]);
});

test("インスタンスを選ぶと元になっている部品の名前が出る", () => {
  const selection = setupInstanceSelection({
    name: "action",
    ref: "primary-button",
  });

  expect(instanceOf(selection).source).toBe("primary-button");
});

test("インスタンス以外を選ぶと group ごとのセクションになる", () => {
  const selection = setupInstanceSelection({ name: "action", type: "Box" });

  expect(sectionsOf(selection).length).toBeGreaterThan(0);
});

test("公開 prop のコントロールは binding 先の prop の入力形式になる", () => {
  const selection = setupInstanceSelection({
    name: "action",
    ref: "primary-button",
  });

  expect(
    controlNamed(instanceOf(selection).publicProps, "label").input,
  ).toEqual({
    kind: "text",
  });
});

test("上書きしていない数値トークンの公開 prop は部品が設定している値の解決値を持つ", () => {
  const selection = setupInstanceSelection({
    name: "action",
    ref: "gapped-card",
  });

  expect(
    resolvedValueOfControl(
      controlNamed(instanceOf(selection).publicProps, "gap"),
    ),
  ).toEqual(Option.some(DocumentTemplate.Default.tokens.spacing.lg));
});

test("上書きしていない公開 prop は部品が設定している値が既定として出る", () => {
  const selection = setupInstanceSelection({
    name: "action",
    ref: "primary-button",
  });
  const control = controlNamed(instanceOf(selection).publicProps, "label");

  expect(control.value.some).toBe(false);
  expect(control.defaultValue).toEqual(Option.some("Button"));
});

test("上書きしている公開 prop はその値がコントロールに乗る", () => {
  const selection = setupInstanceSelection({
    name: "action",
    ref: "primary-button",
    overrides: { label: "ログイン" },
  });

  expect(
    controlNamed(instanceOf(selection).publicProps, "label").value,
  ).toEqual(Option.some("ログイン"));
});

test("公開 prop は部品が宣言した順に並ぶ", () => {
  const selection = setupInstanceSelection({
    name: "card",
    ref: "sized-card",
    overrides: { widthMode: "fixed" },
  });

  expect(publicPropNames(selection)).toEqual(["title", "widthMode", "width"]);
});

test("条件を満たさない公開 prop はコントロールが出ない", () => {
  const selection = setupInstanceSelection({
    name: "card",
    ref: "sized-card",
    overrides: { widthMode: "hug" },
  });

  expect(publicPropNames(selection)).toEqual(["title", "widthMode"]);
});

test("存在しない部品を指すインスタンスには公開 prop のコントロールが出ない", () => {
  const selection = setupInstanceSelection({ name: "action", ref: "missing" });

  expect(instanceOf(selection).publicProps).toEqual([]);
});

/*
 * 解除できるかの規則そのもの（参照先が無い・循環している）は
 * `design-document.detachable.test.ts` が持つ。ここが見るのは、答えが
 * **選んでいるインスタンス自身**のもので、それがそのまま編集欄に載るかだけ。
 * 2 件が同じドキュメントを共有しているのはそのためで、別々のドキュメントに
 * 分けると「そのドキュメント唯一のインスタンス」で答える誤りが通ってしまう。
 */
function setupDetachSelection(selected: string): DocumentSelection {
  return DocumentSelection.fromNames(
    DesignDocument.create({
      tokens: DocumentTemplate.Default.tokens,
      components: Components,
      artboards: [
        {
          name: "home",
          width: 360,
          height: 240,
          children: [
            { name: "action", ref: "primary-button" },
            { name: "broken", ref: "missing" },
          ],
        },
      ],
    }),
    [selected],
  );
}

test("参照先の部品が引けるインスタンスは解除できるものとして出る", () => {
  expect(instanceOf(setupDetachSelection("action")).isDetachable).toBe(true);
});

test("存在しない部品を指すインスタンスは解除できないものとして出る", () => {
  expect(instanceOf(setupDetachSelection("broken")).isDetachable).toBe(false);
});

test("スキーマの分からない type のノードにはコントロールが出ない", () => {
  const selection = setupInstanceSelection({ name: "action", type: "Unknown" });

  expect(sectionsOf(selection)).toEqual([]);
});
