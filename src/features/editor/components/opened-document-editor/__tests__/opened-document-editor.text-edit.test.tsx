import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { renderedElement } from "@/features/canvas/__tests__/canvas-elements";
import { canvasPane, propertyPane, renderOpenedDocument } from "./setup";

/**
 * 3 ペインを実物のまま組み立て、キャンバス上のダブルクリックから
 * 文言がドキュメントへ反映されるまでを確かめる
 * （docs/06-ui.md「キャンバス直接操作」の「Text のインライン編集」）。
 */
/** 重ねて出ている入力欄。 */
function editor(): HTMLElement {
  return screen.getByRole("textbox", { name: "文言を編集" });
}

test("Text をダブルクリックして書き換え確定すると、キャンバスの文言が変わる", async () => {
  await renderOpenedDocument();

  await userEvent.dblClick(renderedElement(canvasPane(), "home-title"));
  await userEvent.clear(editor());
  await userEvent.type(editor(), "トップ{Enter}");

  expect(renderedElement(canvasPane(), "home-title").textContent).toBe(
    "トップ",
  );
});

test("確定した文言はプロパティパネルの content にも出る", async () => {
  await renderOpenedDocument();

  await userEvent.dblClick(renderedElement(canvasPane(), "home-title"));
  await userEvent.clear(editor());
  await userEvent.type(editor(), "トップ{Enter}");

  expect(
    within(propertyPane()).getByLabelText<HTMLInputElement>("Content").value,
  ).toBe("トップ");
});

test("Escape で取り消すとキャンバスの文言は元のままになる", async () => {
  await renderOpenedDocument();

  await userEvent.dblClick(renderedElement(canvasPane(), "home-title"));
  await userEvent.clear(editor());
  await userEvent.type(editor(), "トップ{Escape}");

  expect(renderedElement(canvasPane(), "home-title").textContent).toBe(
    "ホーム",
  );
});
