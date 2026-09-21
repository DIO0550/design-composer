import { screen } from "@testing-library/react";
import { expect, test } from "vitest";
import {
  pressedSegmentsOf,
  segmentOf,
} from "@/components/__tests__/segmented-controls";
import { setupEditablePanel } from "./setup";

test("セグメントを押すとその値が選ばれた状態になる", async () => {
  const { user } = setupEditablePanel("home-title");

  await user.click(segmentOf("Align", "center"));

  expect(pressedSegmentsOf("Align")).toEqual(["center"]);
});

test("選ばれているセグメントをもう一度押すと未指定へ戻り既定が効く表示になる", async () => {
  const { user } = setupEditablePanel("home-title");
  await user.click(segmentOf("Align", "center"));

  await user.click(segmentOf("Align", "center"));

  expect(screen.getByText("未指定（既定: left）")).toBeDefined();
});

test("同じ選択肢を持つ 2 つの enum は取り違えずに別々に編集できる", async () => {
  /*
   * Box の `align` と `justify` はどちらも start / center / end を持つ。
   * 取り違えると押した側が空になり、押していない側が `center` になって落ちる。
   */
  const { user } = setupEditablePanel("home-body");

  await user.click(segmentOf("Justify", "center"));

  expect([pressedSegmentsOf("Align"), pressedSegmentsOf("Justify")]).toEqual([
    [],
    ["center"],
  ]);
});

test("文字入力の prop を書き換えるとその値が入力欄に反映される", async () => {
  const { user } = setupEditablePanel("home-title");

  await user.clear(screen.getByRole("textbox", { name: "Content" }));
  await user.type(screen.getByRole("textbox", { name: "Content" }), "設定");

  expect(screen.getByRole("textbox", { name: "Content" })).toHaveProperty(
    "value",
    "設定",
  );
});

test("トークン参照の prop を選び直すとその値が入力欄に反映される", async () => {
  const { user } = setupEditablePanel("home-title");

  await user.selectOptions(screen.getByRole("combobox", { name: "Color" }), [
    "primary",
  ]);

  expect(screen.getByRole("combobox", { name: "Color" })).toHaveProperty(
    "value",
    "primary",
  );
});

test("インスタンスの公開 prop を書き換えると overrides として反映される", async () => {
  const { user } = setupEditablePanel("home-action");

  await user.type(screen.getByRole("textbox", { name: "Label" }), "ログイン");

  expect(screen.getByRole("textbox", { name: "Label" })).toHaveProperty(
    "value",
    "ログイン",
  );
});

/*
 * 空欄を「値が無い」と読むのはこのパネルの入力欄の約束事（`valueFrom`）なので、
 * ドメイン側ではなくここで守る。上書きが解けたかは `overridden` の添え書きで見る
 * （入力欄の `value` は、空文字を設定してしまう壊し方でも空のままになる）。
 */
test("インスタンスの公開 prop の入力欄を空にすると上書きが解かれる", async () => {
  const { user } = setupEditablePanel("home-action");
  await user.type(screen.getByRole("textbox", { name: "Label" }), "ログイン");

  await user.clear(screen.getByRole("textbox", { name: "Label" }));

  expect(screen.queryByText(/overridden/)).toBeNull();
});

test("サイズのモードを fixed にすると長さの入力欄が現れる", async () => {
  const { user } = setupEditablePanel("home-body");
  expect(screen.queryByRole("spinbutton", { name: "Width" })).toBeNull();

  await user.click(segmentOf("Width Mode", "fixed"));

  expect(screen.getByRole("spinbutton", { name: "Width" })).toBeDefined();
});

test("サイズのモードを fixed から戻すと長さの入力欄が消える", async () => {
  const { user } = setupEditablePanel("home-body");
  await user.click(segmentOf("Width Mode", "fixed"));

  await user.click(segmentOf("Width Mode", "hug"));

  expect(screen.queryByRole("spinbutton", { name: "Width" })).toBeNull();
});

test("数値入力の prop を書き換えるとその値が入力欄に反映される", async () => {
  const { user } = setupEditablePanel("home-body");
  await user.click(segmentOf("Width Mode", "fixed"));

  await user.type(screen.getByRole("spinbutton", { name: "Width" }), "240");

  expect(screen.getByRole("spinbutton", { name: "Width" })).toHaveProperty(
    "value",
    "240",
  );
});
