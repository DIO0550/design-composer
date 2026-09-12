import { expect, test } from "vitest";
import { canvasDockStack, renderOpenedDocument } from "./setup";

/*
 * 帯が幅いっぱいでポインタを受け取ると、そこにかかる位置のノードを選べず、範囲選択も
 * パンもその帯から始められない（#466）。
 *
 * このリポジトリでは class にしか出ない形はテストせず開示するのが通例（`drop-line` /
 * `canvas-toolbar` / `document-error-list`）だが、ここだけ綴りを固定する。それらは崩れ
 * れば絵に出るのに対し、当たり判定は見た目が 1px も変わらないので視覚差分でも拾えず、
 * 綴りを見るのが唯一落ちうる形になるため。
 */

test("キャンバス下端の帯はポインタの当たり先にならず、そこに積んだものだけが受け取る", async () => {
  await renderOpenedDocument();

  const passesPointerThrough = [
    "pointer-events-none",
    "[&>*]:pointer-events-auto",
  ];

  const stack = canvasDockStack();

  expect(
    passesPointerThrough.filter((name) => stack.classList.contains(name)),
  ).toEqual(passesPointerThrough);
});
