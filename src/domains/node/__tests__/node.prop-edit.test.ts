import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { PropEdit, Props } from "../index";

test("設定の編集を適用するとその prop に値が入る", () => {
  expect(Props.apply({}, PropEdit.set(["gap"], "md"))).toEqual({ gap: "md" });
});

test("設定の編集は同じ prop の値を置き換える", () => {
  expect(Props.apply({ gap: "sm" }, PropEdit.set(["gap"], "md"))).toEqual({
    gap: "md",
  });
});

test("消去の編集を適用するとその prop は未設定に戻る", () => {
  expect(Props.apply({ gap: "md" }, PropEdit.clear(["gap"]))).toEqual({});
});

test("消去の編集は他の prop を残す", () => {
  expect(
    Props.apply({ gap: "md", background: "white" }, PropEdit.clear(["gap"])),
  ).toEqual({ background: "white" });
});

test("消去は値を空文字で置くのではなくキーごと落とす", () => {
  expect(
    "content" in Props.apply({ content: "" }, PropEdit.clear(["content"])),
  ).toBe(false);
});

test("設定の編集は値を持ち、消去の編集は値を持たない", () => {
  expect(PropEdit.set(["width"], 240).value).toEqual(Option.some(240));
  expect(PropEdit.clear(["width"]).value.some).toBe(false);
});

test("複数の prop を指す編集を適用すると、指したすべての prop が同じ値になる", () => {
  expect(
    Props.apply(
      { paddingTop: "sm" },
      PropEdit.set(["paddingTop", "paddingBottom"], "md"),
    ),
  ).toEqual({ paddingTop: "md", paddingBottom: "md" });
});

test("複数の prop を指す消去を適用すると、指したすべての prop が未設定へ戻る", () => {
  expect(
    Props.apply(
      { paddingTop: "md", paddingBottom: "md" },
      PropEdit.clear(["paddingTop", "paddingBottom"]),
    ),
  ).toEqual({});
});

test("複数の prop を指す編集は、指していない prop を変えない", () => {
  expect(
    Props.apply(
      { paddingTop: "sm", paddingRight: "sm" },
      PropEdit.set(["paddingTop", "paddingBottom"], "md"),
    ),
  ).toEqual({ paddingTop: "md", paddingRight: "sm", paddingBottom: "md" });
});
