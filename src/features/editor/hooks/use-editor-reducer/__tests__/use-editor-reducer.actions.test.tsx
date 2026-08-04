import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import type { DocumentError } from "@/features/editor/domains/document-error";
import type { EditorState } from "@/features/editor/domains/editor-state";
import { Option } from "@/utils/Option";
import { useEditorReducer } from "../index";

function setupDocument(): DesignDocument {
  return DesignDocument.create({
    artboards: [
      {
        name: "home",
        width: 375,
        height: 812,
        children: [
          { name: "title", type: "Text" },
          { name: "footer", type: "Text" },
        ],
      },
    ],
  });
}

/** 外部エディタが不正なファイルを保存したときに届くエラー。 */
const SYNTAX_ERROR: DocumentError = {
  kind: "syntax-error",
  message: "expected ',' or '}'",
  location: { kind: "text-position", position: 42 },
};

/** 読み直し後のドキュメント。`title` が無くなり、`lead` が増えている。 */
function setupReloadedDocument(): DesignDocument {
  return DesignDocument.create({
    artboards: [
      {
        name: "home",
        width: 375,
        height: 812,
        children: [{ name: "lead", type: "Text" }],
      },
    ],
  });
}

function childNames(state: EditorState): readonly string[] {
  const artboard = Option.unwrap(
    DesignDocument.findArtboard(state.document, "home"),
  );
  return artboard.children.map((child) => child.name);
}

/**
 * フックを DOM へ繋いだだけの器。
 * アクションを 1 つずつ送る口と、状態の読み出し（選択・子の並び）を与える。
 */
function EditorReducerHarness() {
  const [state, dispatch] = useEditorReducer(setupDocument());

  return (
    <>
      <p data-testid="selected">
        {Option.unwrapOr(state.selectedName, "選択なし")}
      </p>
      <p data-testid="children">{childNames(state).join(",")}</p>
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
        onClick={() =>
          dispatch({
            type: "reload_document",
            reload: { kind: "reloaded", document: setupReloadedDocument() },
          })
        }
      >
        読み直す
      </button>
      <button
        type="button"
        onClick={() =>
          dispatch({
            type: "reload_document",
            reload: { kind: "rejected", errors: [SYNTAX_ERROR] },
          })
        }
      >
        不正なファイルを取り込む
      </button>
      <button
        type="button"
        onClick={() =>
          dispatch({
            type: "reorder_node",
            from: { parentName: "home", index: 0 },
            toIndex: 1,
          })
        }
      >
        title を下へ
      </button>
      <button
        type="button"
        onClick={() =>
          dispatch({
            type: "reorder_node",
            from: { parentName: "home", index: 0 },
            toIndex: 5,
          })
        }
      >
        並びの外へ
      </button>
      <button
        type="button"
        onClick={() =>
          dispatch({
            type: "move_node",
            name: "title",
            to: { parentName: "home", index: 2 },
          })
        }
      >
        title を末尾へ運ぶ
      </button>
      <button
        type="button"
        onClick={() =>
          dispatch({
            type: "move_node",
            name: "title",
            to: { parentName: "footer", index: 0 },
          })
        }
      >
        title を Text の下へ運ぶ
      </button>
    </>
  );
}

function selected(): string {
  return screen.getByTestId("selected").textContent ?? "";
}

function children(): string {
  return screen.getByTestId("children").textContent ?? "";
}

test("開いた直後は何も選択されていない", () => {
  render(<EditorReducerHarness />);

  expect(selected()).toBe("選択なし");
});

test("選択のアクションを送るとそのノードが選択される", async () => {
  render(<EditorReducerHarness />);

  await userEvent.click(screen.getByRole("button", { name: "title を選ぶ" }));

  expect(selected()).toBe("title");
});

test("選択解除のアクションを送ると選択が外れる", async () => {
  render(<EditorReducerHarness />);
  await userEvent.click(screen.getByRole("button", { name: "title を選ぶ" }));

  await userEvent.click(screen.getByRole("button", { name: "選択を外す" }));

  expect(selected()).toBe("選択なし");
});

test("読み直しのアクションを送るとドキュメントが差し替わる", async () => {
  render(<EditorReducerHarness />);

  await userEvent.click(screen.getByRole("button", { name: "読み直す" }));

  expect(children()).toBe("lead");
});

test("読み直したドキュメントに選択中のノードが無ければ選択が外れる", async () => {
  render(<EditorReducerHarness />);
  await userEvent.click(screen.getByRole("button", { name: "title を選ぶ" }));

  await userEvent.click(screen.getByRole("button", { name: "読み直す" }));

  expect(selected()).toBe("選択なし");
});

test("不正なファイルを取り込むアクションを送ってもドキュメントは差し替わらない", async () => {
  render(<EditorReducerHarness />);

  await userEvent.click(
    screen.getByRole("button", { name: "不正なファイルを取り込む" }),
  );

  expect(children()).toBe("title,footer");
});

test("並べ替えのアクションを送ると子の並びがその順序に変わる", async () => {
  render(<EditorReducerHarness />);

  await userEvent.click(screen.getByRole("button", { name: "title を下へ" }));

  expect(children()).toBe("footer,title");
});

test("並べ替えても選択していたノードは選択されたままになる", async () => {
  render(<EditorReducerHarness />);
  await userEvent.click(screen.getByRole("button", { name: "title を選ぶ" }));

  await userEvent.click(screen.getByRole("button", { name: "title を下へ" }));

  expect(selected()).toBe("title");
});

test("並びの外を移動先にした並べ替えでは子の並びが変わらない", async () => {
  render(<EditorReducerHarness />);

  await userEvent.click(screen.getByRole("button", { name: "並びの外へ" }));

  expect(children()).toBe("title,footer");
});

test("移動のアクションを送ると、離した位置に応じて子の並びが変わる", async () => {
  render(<EditorReducerHarness />);

  await userEvent.click(
    screen.getByRole("button", { name: "title を末尾へ運ぶ" }),
  );

  expect(children()).toBe("footer,title");
});

test("子を持てないノードの下を移動先にすると子の並びが変わらない", async () => {
  render(<EditorReducerHarness />);

  await userEvent.click(
    screen.getByRole("button", { name: "title を Text の下へ運ぶ" }),
  );

  expect(children()).toBe("title,footer");
});
