import { expect, test } from "vitest";
import {
  DesignDocument,
  DocumentTemplate,
} from "@/domains/dcmp/design-document";
import type { Node } from "@/domains/dcmp/node";
import { DocumentSelection } from "@/domains/document-selection";
import { Option } from "@/utils/Option";
import { PropControl } from "../index";
import { controlNamed, controlsIn, sectionsOf } from "./setup";

/** 実物のスキーマから引いたコントロールを使う（入力欄の種類を手で組み立てない）。 */
function setupControl(node: Node, prop: string): PropControl {
  const selection = DocumentSelection.fromNames(
    DesignDocument.create({
      tokens: DocumentTemplate.Default.tokens,
      artboards: [{ name: "home", width: 360, height: 240, children: [node] }],
    }),
    [node.name],
  );
  return controlNamed(sectionsOf(selection).flatMap(controlsIn), prop);
}

test("選択式に値を選ぶとその値を設定する編集になる", () => {
  const control = setupControl({ name: "box", type: "Box" }, "direction");

  expect(PropControl.editFrom(control, Option.some("row"))).toEqual({
    names: ["direction"],
    value: Option.some("row"),
  });
});

test("数値入力に入れた文字列は数値として設定される", () => {
  const control = setupControl(
    { name: "box", type: "Box", props: { widthMode: "fixed" } },
    "width",
  );

  expect(PropControl.editFrom(control, Option.some("240"))).toEqual({
    names: ["width"],
    value: Option.some(240),
  });
});

test("文字入力に入れた文字列はそのまま設定される", () => {
  const control = setupControl({ name: "label", type: "Text" }, "content");

  expect(PropControl.editFrom(control, Option.some("240"))).toEqual({
    names: ["content"],
    value: Option.some("240"),
  });
});

test("文字を受ける prop で値が無いときは未設定へ戻す編集になる", () => {
  const control = setupControl({ name: "label", type: "Text" }, "content");

  expect(PropControl.editFrom(control, Option.none).value.some).toBe(false);
});

test("選択式の prop で値が無いときは未設定へ戻す編集になる", () => {
  const control = setupControl({ name: "box", type: "Box" }, "gap");

  expect(PropControl.editFrom(control, Option.none).value.some).toBe(false);
});
