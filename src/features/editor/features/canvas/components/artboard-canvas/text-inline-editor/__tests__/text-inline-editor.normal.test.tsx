import { fireEvent, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { textInlineEditorField } from "@/features/editor/features/canvas/__tests__/canvas-elements";
import type { TextEdit } from "@/features/editor/features/canvas/domains/text-edit";
import { TextInlineEditor } from "../index";

/*
 * 編集を終える 3 つの入口（docs/06-ui.md「確定（Enter / フォーカス外し）」
 * 「キャンセル（Escape）」）。どのキーがどちらへ行くかはこのモジュールが持つ。
 */

/** 文言を打ちかけている状態。 */
function setupEdit(draft: string): TextEdit {
  return { draft, bounds: { left: 40, top: 40, width: 200, height: 28 } };
}

/** 呼ばれた入口を並びで受ける器。どれが呼ばれたかを 1 つの観点で見られる。 */
function setup() {
  const calls: string[] = [];
  render(
    <TextInlineEditor
      edit={setupEdit("ようこそ")}
      onChange={() => calls.push("change")}
      onCommit={() => calls.push("commit")}
      onCancel={() => calls.push("cancel")}
    />,
  );
  return calls;
}

test("打ちかけの文言が入力欄に出る", () => {
  render(
    <TextInlineEditor
      edit={setupEdit("ようこそ")}
      onChange={() => {}}
      onCommit={() => {}}
      onCancel={() => {}}
    />,
  );

  expect(textInlineEditorField().getAttribute("value")).toBe("ようこそ");
});

test("Enter を押すと編集が確定する", () => {
  const calls = setup();

  fireEvent.keyDown(textInlineEditorField(), { key: "Enter" });

  expect(calls).toEqual(["commit"]);
});

test("Escape を押すと編集が取り消される", () => {
  const calls = setup();

  fireEvent.keyDown(textInlineEditorField(), { key: "Escape" });

  expect(calls).toEqual(["cancel"]);
});

test("編集に関わらないキーではどちらも起きない", () => {
  // Enter / Escape 以外で確定してしまうと、打っている途中で閉じる
  const calls = setup();

  fireEvent.keyDown(textInlineEditorField(), { key: "Tab" });

  expect(calls).toEqual([]);
});

test("フォーカスが外れると編集が確定する", () => {
  const calls = setup();

  fireEvent.blur(textInlineEditorField());

  expect(calls).toEqual(["commit"]);
});

test("打つと打った内容が下書きとして伝わる", async () => {
  const drafts: string[] = [];
  render(
    <TextInlineEditor
      edit={setupEdit("")}
      onChange={(draft) => drafts.push(draft)}
      onCommit={() => {}}
      onCancel={() => {}}
    />,
  );

  await userEvent.type(textInlineEditorField(), "あ");

  expect(drafts).toEqual(["あ"]);
});

test("開いた時点で入力欄へフォーカスが当たる", () => {
  // 開いた先で打てないと「その場で編集する」操作にならない
  render(
    <TextInlineEditor
      edit={setupEdit("ようこそ")}
      onChange={() => {}}
      onCommit={() => {}}
      onCancel={() => {}}
    />,
  );

  expect(document.activeElement).toBe(textInlineEditorField());
});
