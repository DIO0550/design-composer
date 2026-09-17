import { screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { segmentOf } from "@/components/__tests__/segmented-controls";
import { EditContinuities } from "@/domains/session/edit-continuity";
import { setupEditablePanel } from "./setup";

/*
 * 1 つの欄への打ち込みが履歴の上で 1 件になるよう、パネルが編集に添える続き方を確かめる
 * （docs/06-ui.md「編集操作の一覧」の props 編集）。届いた続き方が履歴でどう扱われるかは
 * `opened-document-editor.prop-edit.test.tsx` が通す。
 */

const { Separate, Continued } = EditContinuities;

test("文言欄に続けて打つと、2 打鍵目からは続きとして届く", async () => {
  const { user, continuities } = setupEditablePanel("home-title");

  await user.type(screen.getByRole("textbox", { name: "Content" }), "ab");

  expect(continuities).toEqual([Separate, Continued]);
});

test("同じ欄へフォーカスし直して打つと、そこからまた別のまとまりとして届く", async () => {
  const { user, continuities } = setupEditablePanel("home-title");
  await user.type(screen.getByRole("textbox", { name: "Content" }), "ab");

  await user.tab();
  await user.type(screen.getByRole("textbox", { name: "Content" }), "c");

  expect(continuities).toEqual([Separate, Continued, Separate]);
});

test("別の欄へ移って打つと、そこからまた別のまとまりとして届く", async () => {
  /*
   * まとまりを欄ごとではなくパネルに 1 つ持つ実装は、ここだけが落ちる
   * （欄をまたいで畳むと、幅を打ち替えてから高さを打った 1 回の undo で幅まで戻る）。
   */
  const { user, continuities } = setupEditablePanel("home-panel");
  await user.type(screen.getByRole("spinbutton", { name: "Width" }), "4");

  await user.type(screen.getByRole("spinbutton", { name: "Height" }), "5");

  expect(continuities).toEqual([Separate, Separate]);
});

test("トークンを選び直すたびに別のまとまりとして届く", async () => {
  const { user, continuities } = setupEditablePanel("home-title");

  await user.selectOptions(screen.getByRole("combobox", { name: "Color" }), [
    "primary",
  ]);
  await user.selectOptions(screen.getByRole("combobox", { name: "Color" }), [
    "gray-900",
  ]);

  expect(continuities).toEqual([Separate, Separate]);
});

test("セグメントを押すたびに別のまとまりとして届く", async () => {
  const { user, continuities } = setupEditablePanel("home-title");

  await user.click(segmentOf("Align", "center"));
  await user.click(segmentOf("Align", "right"));

  expect(continuities).toEqual([Separate, Separate]);
});
