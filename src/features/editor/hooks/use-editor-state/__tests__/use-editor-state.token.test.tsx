import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { EditContinuities } from "@/domains/session/edit-continuity";
import {
  PrimaryColorTestId,
  primaryColorDocument,
  primaryColorOf,
  primaryColorText,
} from "@/features/editor/__tests__/primary-color-token";
import { useEditorState } from "../index";

/*
 * トークンの値の書き換えのアクションを送って、続き方が履歴のまとまりまで届くことを確かめる
 * （docs/06-ui.md「編集操作の一覧」の tokens 編集・undo）。
 */

/**
 * フックを DOM へ繋いだだけの器。トークンの選択・値の書き換え・undo を 1 つずつ送る口と、
 * `primary` の値の読み出しを与える。
 */
function EditorStateHarness() {
  const [state, dispatch] = useEditorState(primaryColorDocument());

  return (
    <>
      <p data-testid={PrimaryColorTestId}>{primaryColorOf(state)}</p>
      <button
        type="button"
        onClick={() =>
          dispatch({
            type: "select_token",
            ref: { kind: "colors", name: "primary" },
          })
        }
      >
        primary を選ぶ
      </button>
      <button
        type="button"
        onClick={() =>
          dispatch({
            type: "set_token_value",
            value: { kind: "colors", value: "#ff0000" },
            continuity: EditContinuities.Separate,
          })
        }
      >
        #ff0000 を別の編集として送る
      </button>
      <button
        type="button"
        onClick={() =>
          dispatch({
            type: "set_token_value",
            value: { kind: "colors", value: "#00ff00" },
            continuity: EditContinuities.Continued,
          })
        }
      >
        #00ff00 を続きとして送る
      </button>
      <button
        type="button"
        onClick={() =>
          dispatch({
            type: "set_token_value",
            value: { kind: "colors", value: "#00ff00" },
            continuity: EditContinuities.Separate,
          })
        }
      >
        #00ff00 を別の編集として送る
      </button>
      <button type="button" onClick={() => dispatch({ type: "undo" })}>
        戻す
      </button>
    </>
  );
}

test("値を続きとして送ると、1 回の undo で最初の値まで戻る", async () => {
  render(<EditorStateHarness />);

  await userEvent.click(screen.getByText("primary を選ぶ"));
  await userEvent.click(screen.getByText("#ff0000 を別の編集として送る"));
  await userEvent.click(screen.getByText("#00ff00 を続きとして送る"));
  await userEvent.click(screen.getByText("戻す"));

  expect(primaryColorText()).toBe("#000000");
});

test("値を別の編集として送ると、1 回の undo では直前の値までしか戻らない", async () => {
  render(<EditorStateHarness />);

  await userEvent.click(screen.getByText("primary を選ぶ"));
  await userEvent.click(screen.getByText("#ff0000 を別の編集として送る"));
  await userEvent.click(screen.getByText("#00ff00 を別の編集として送る"));
  await userEvent.click(screen.getByText("戻す"));

  expect(primaryColorText()).toBe("#ff0000");
});

test("トークンを選ばずに値を送っても値は変わらない", async () => {
  render(<EditorStateHarness />);

  await userEvent.click(screen.getByText("#ff0000 を別の編集として送る"));

  expect(primaryColorText()).toBe("#000000");
});
