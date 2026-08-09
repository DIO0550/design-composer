import { expect, test } from "vitest";
import { DesignDocument, DocumentTemplate } from "@/domains/design-document";
import type { Node } from "@/domains/node";
import { EditorState } from "@/features/editor/domains/editor-state";
import { Option } from "@/utils/Option";
import { PropControl } from "../index";
import { controlNamed, sectionsOf } from "./setup";

/** 実物のスキーマから引いたコントロールを使う（入力欄の種類を手で組み立てない）。 */
function setupControl(node: Node, prop: string): PropControl {
  const state = EditorState.select(
    EditorState.create(
      DesignDocument.create({
        tokens: DocumentTemplate.DEFAULT.tokens,
        artboards: [
          { name: "home", width: 360, height: 240, children: [node] },
        ],
      }),
    ),
    node.name,
  );
  return controlNamed(
    sectionsOf(state).flatMap((section) => section.controls),
    prop,
  );
}

test("選択式に値を選ぶとその値を設定する編集になる", () => {
  const control = setupControl({ name: "box", type: "Box" }, "direction");

  expect(PropControl.editFrom(control, "row")).toEqual({
    name: "direction",
    value: Option.some("row"),
  });
});

test("数値入力に入れた文字列は数値として設定される", () => {
  const control = setupControl(
    { name: "box", type: "Box", props: { widthMode: "fixed" } },
    "width",
  );

  expect(PropControl.editFrom(control, "240")).toEqual({
    name: "width",
    value: Option.some(240),
  });
});

test("文字入力に入れた文字列はそのまま設定される", () => {
  const control = setupControl({ name: "label", type: "Text" }, "content");

  expect(PropControl.editFrom(control, "240")).toEqual({
    name: "content",
    value: Option.some("240"),
  });
});

test("空欄にすると未設定へ戻す編集になる", () => {
  const control = setupControl({ name: "label", type: "Text" }, "content");

  expect(PropControl.editFrom(control, "").value.some).toBe(false);
});

test("選択式で未指定を選んでも未設定へ戻す編集になる", () => {
  const control = setupControl({ name: "box", type: "Box" }, "gap");

  expect(PropControl.editFrom(control, "").value.some).toBe(false);
});
