import { expect, test } from "vitest";
import { Option } from "@/utils/Option";
import { Result } from "@/utils/Result";
import { Node, PropEdit, Props } from "../index";

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
  expect(Option.isSome(PropEdit.clear(["width"]).value)).toBe(false);
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

test("写す編集は、指した prop のうち書かれているものだけを同じ値で設定する", () => {
  expect(
    PropEdit.collectWritten({ gap: "md", wrap: "wrap", layout: "row" }, [
      "gap",
      "layout",
      "align",
    ]),
  ).toEqual([PropEdit.set(["gap"], "md"), PropEdit.set(["layout"], "row")]);
});

test("指した prop が 1 つも書かれていなければ、写す編集は空", () => {
  expect(PropEdit.collectWritten({ gap: "md" }, ["layout"])).toEqual([]);
});

test("インスタンス自身の値の編集は自身の値を変え、公開 prop の上書きを変えない", () => {
  const edited = Node.applyRefOwnPropEdit(
    { name: "submit", ref: "primary-button", overrides: { label: "保存" } },
    PropEdit.set(["locking"], "locked"),
  );

  expect(edited).toEqual(
    Result.ok({
      name: "submit",
      ref: "primary-button",
      locking: "locked",
      overrides: { label: "保存" },
    }),
  );
});

test("インスタンス自身の値を消す編集では、そのキーも残らない", () => {
  const edited = Result.unwrap(
    Node.applyRefOwnPropEdit(
      { name: "submit", ref: "primary-button", locking: "locked" },
      PropEdit.clear(["locking"]),
    ),
  );

  expect("locking" in edited).toBe(false);
});

test("インスタンス自身の値として持てない prop の編集は、その prop の名前で失敗する", () => {
  const edited = Node.applyRefOwnPropEdit(
    { name: "submit", ref: "primary-button" },
    PropEdit.set(["label"], "保存"),
  );

  expect(edited).toEqual(Result.err(["label"]));
});

test("複数の prop を指す編集に持てない prop が混じっていれば、持てない prop の名前だけで失敗する", () => {
  const edited = Node.applyRefOwnPropEdit(
    { name: "submit", ref: "primary-button" },
    PropEdit.set(["locking", "label"], "locked"),
  );

  expect(edited).toEqual(Result.err(["label"]));
});

test("持てない prop が 2 つ以上あれば、編集が指す順にすべての名前で失敗する", () => {
  const edited = Node.applyRefOwnPropEdit(
    { name: "submit", ref: "primary-button" },
    PropEdit.set(["label", "gap"], "md"),
  );

  expect(edited).toEqual(Result.err(["label", "gap"]));
});
