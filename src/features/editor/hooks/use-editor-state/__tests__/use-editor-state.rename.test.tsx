import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { EditorState } from "@/features/editor/domains/editor-state";
import { Option } from "@/utils/Option";
import { useEditorState } from "../index";
import { homeChildNames } from "./setup";

/*
 * 名前の変更のアクションを 1 つずつ送って、変わるときと変わらないときを対で確かめる
 * （docs/06-ui.md「名前の変更」）。
 */

function setupDocument(): DesignDocument {
  return DesignDocument.create({
    artboards: [
      {
        name: "home",
        width: 375,
        height: 812,
        children: [
          { name: "title", type: "Text" },
          { name: "lead", type: "Text" },
        ],
      },
    ],
  });
}

/**
 * フックを DOM へ繋いだだけの器。名前の編集に関わるアクションを 1 つずつ送る口と、
 * 編集中のものと子の並びの読み出しを与える。
 */
function EditorStateHarness() {
  const [state, dispatch] = useEditorState(setupDocument());

  return (
    <>
      <p data-testid="renaming">
        {Option.unwrapOr(EditorState.renamingName(state), "編集なし")}
      </p>
      <p data-testid="children">{homeChildNames(state).join(",")}</p>
      <button
        type="button"
        onClick={() => dispatch({ type: "select", name: "title" })}
      >
        title を選ぶ
      </button>
      <button
        type="button"
        onClick={() => dispatch({ type: "clear_selection" })}
      >
        選択を外す
      </button>
      <button
        type="button"
        onClick={() => dispatch({ type: "start_renaming" })}
      >
        名前の編集に入る
      </button>
      <button
        type="button"
        onClick={() => dispatch({ type: "start_renaming_at", name: "lead" })}
      >
        lead の名前の編集に入る
      </button>
      <button
        type="button"
        onClick={() => dispatch({ type: "start_renaming_at", name: "missing" })}
      >
        居ないものの名前の編集に入る
      </button>
      <button
        type="button"
        onClick={() => dispatch({ type: "cancel_renaming" })}
      >
        編集をやめる
      </button>
      <button
        type="button"
        onClick={() => dispatch({ type: "rename_selected", name: "caption" })}
      >
        caption にする
      </button>
      <button
        type="button"
        onClick={() => dispatch({ type: "rename_selected", name: "lead" })}
      >
        lead にする
      </button>
      <button
        type="button"
        onClick={() => dispatch({ type: "finish_renaming", name: "lead" })}
      >
        lead で終える
      </button>
      <button
        type="button"
        onClick={() => dispatch({ type: "finish_renaming", name: "caption" })}
      >
        caption で終える
      </button>
    </>
  );
}

function renaming(): string {
  return screen.getByTestId("renaming").textContent ?? "";
}

function childNames(): string {
  return screen.getByTestId("children").textContent ?? "";
}

test("1 つ選んでから名前の編集に入るアクションを送ると、それが編集中になる", async () => {
  render(<EditorStateHarness />);

  await userEvent.click(screen.getByText("title を選ぶ"));
  await userEvent.click(screen.getByText("名前の編集に入る"));

  expect(renaming()).toBe("title");
});

test("何も選ばずに名前の編集に入るアクションを送っても編集は始まらない", async () => {
  render(<EditorStateHarness />);

  await userEvent.click(screen.getByText("名前の編集に入る"));

  expect(renaming()).toBe("編集なし");
});

test("行を指して編集に入るアクションを送ると、その行が編集中になる", async () => {
  render(<EditorStateHarness />);

  await userEvent.click(screen.getByText("lead の名前の編集に入る"));

  expect(renaming()).toBe("lead");
});

test("居ない名前を指して編集に入るアクションを送っても編集は始まらない", async () => {
  render(<EditorStateHarness />);

  await userEvent.click(screen.getByText("居ないものの名前の編集に入る"));

  expect(renaming()).toBe("編集なし");
});

test("編集をやめるアクションを送ると編集が閉じる", async () => {
  render(<EditorStateHarness />);

  await userEvent.click(screen.getByText("lead の名前の編集に入る"));
  await userEvent.click(screen.getByText("編集をやめる"));

  expect(renaming()).toBe("編集なし");
});

test("編集をやめるアクションを送っても名前は変わらない", async () => {
  render(<EditorStateHarness />);

  await userEvent.click(screen.getByText("lead の名前の編集に入る"));
  await userEvent.click(screen.getByText("編集をやめる"));

  expect(childNames()).toBe("title,lead");
});

test("編集中に名前を変えるアクションを送ると、その名前になる", async () => {
  render(<EditorStateHarness />);

  await userEvent.click(screen.getByText("title を選ぶ"));
  await userEvent.click(screen.getByText("名前の編集に入る"));
  await userEvent.click(screen.getByText("caption にする"));

  expect(childNames()).toBe("caption,lead");
});

test("編集していないときに名前を変えるアクションを送っても名前は変わらない", async () => {
  render(<EditorStateHarness />);

  await userEvent.click(screen.getByText("title を選ぶ"));
  await userEvent.click(screen.getByText("caption にする"));

  expect(childNames()).toBe("title,lead");
});

test("使えない名前へ変えるアクションを送ると、名前は変わらず編集も閉じない", async () => {
  render(<EditorStateHarness />);

  await userEvent.click(screen.getByText("title を選ぶ"));
  await userEvent.click(screen.getByText("名前の編集に入る"));
  await userEvent.click(screen.getByText("lead にする"));

  expect(childNames()).toBe("title,lead");
  expect(renaming()).toBe("title");
});

test("使えない名前で終えるアクションを送ると、名前は変わらないまま編集が閉じる", async () => {
  render(<EditorStateHarness />);

  await userEvent.click(screen.getByText("title を選ぶ"));
  await userEvent.click(screen.getByText("名前の編集に入る"));
  await userEvent.click(screen.getByText("lead で終える"));

  expect(childNames()).toBe("title,lead");
  expect(renaming()).toBe("編集なし");
});

test("使える名前で終えるアクションを送ると、その名前になる", async () => {
  render(<EditorStateHarness />);

  await userEvent.click(screen.getByText("title を選ぶ"));
  await userEvent.click(screen.getByText("名前の編集に入る"));
  await userEvent.click(screen.getByText("caption で終える"));

  expect(childNames()).toBe("caption,lead");
});
