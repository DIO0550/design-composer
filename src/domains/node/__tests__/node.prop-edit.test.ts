import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { PropEdit, Props } from "../index";

test("設定の編集を適用するとその prop に値が入る", () => {
  expect(Props.apply({}, PropEdit.set("gap", "md"))).toEqual({ gap: "md" });
});

test("設定の編集は同じ prop の値を置き換える", () => {
  expect(Props.apply({ gap: "sm" }, PropEdit.set("gap", "md"))).toEqual({
    gap: "md",
  });
});

test("消去の編集を適用するとその prop は未設定に戻る", () => {
  expect(Props.apply({ gap: "md" }, PropEdit.clear("gap"))).toEqual({});
});

test("消去の編集は他の prop を残す", () => {
  expect(
    Props.apply({ gap: "md", background: "white" }, PropEdit.clear("gap")),
  ).toEqual({ background: "white" });
});

test("消去は値を空文字で置くのではなくキーごと落とす", () => {
  expect(
    "content" in Props.apply({ content: "" }, PropEdit.clear("content")),
  ).toBe(false);
});

test("設定の編集は値を持ち、消去の編集は値を持たない", () => {
  expect(PropEdit.set("width", 240).value).toEqual(Option.some(240));
  expect(PropEdit.clear("width").value.some).toBe(false);
});
