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
import {
  EditorProvider,
  useEditor,
} from "@/features/editor/components/editor-provider";
import { useTokenActions } from "../index";

/*
 * 値の書き換えに渡した続き方が、そのまま履歴のまとまりに効くことを確かめる
 * （docs/06-ui.md「編集操作の一覧」の tokens 編集・undo）。
 */

/**
 * 実物の `EditorProvider` の内側でフックを描いた器。選択・値の書き換えはフックから、
 * undo と `primary` の値の読み出しはエディタの状態から行う。
 */
function TokenActionsHarness() {
  const actions = useTokenActions();
  const { state, dispatch } = useEditor();

  return (
    <>
      <p data-testid={PrimaryColorTestId}>{primaryColorOf(state)}</p>
      <button
        type="button"
        onClick={() => actions.select({ kind: "colors", name: "primary" })}
      >
        primary を選ぶ
      </button>
      <button
        type="button"
        onClick={() =>
          actions.setValue(
            { kind: "colors", value: "#ff0000" },
            EditContinuities.Separate,
          )
        }
      >
        #ff0000 を別の編集として送る
      </button>
      <button
        type="button"
        onClick={() =>
          actions.setValue(
            { kind: "colors", value: "#00ff00" },
            EditContinuities.Continued,
          )
        }
      >
        #00ff00 を続きとして送る
      </button>
      <button
        type="button"
        onClick={() =>
          actions.setValue(
            { kind: "colors", value: "#00ff00" },
            EditContinuities.Separate,
          )
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

function renderHarness(): void {
  render(
    <EditorProvider initialDocument={primaryColorDocument()}>
      <TokenActionsHarness />
    </EditorProvider>,
  );
}

test("続きとして書き換えた値は、1 回の undo で最初の値まで戻る", async () => {
  renderHarness();

  await userEvent.click(screen.getByText("primary を選ぶ"));
  await userEvent.click(screen.getByText("#ff0000 を別の編集として送る"));
  await userEvent.click(screen.getByText("#00ff00 を続きとして送る"));
  await userEvent.click(screen.getByText("戻す"));

  expect(primaryColorText()).toBe("#000000");
});

test("別の編集として書き換えた値は、1 回の undo では直前の値までしか戻らない", async () => {
  renderHarness();

  await userEvent.click(screen.getByText("primary を選ぶ"));
  await userEvent.click(screen.getByText("#ff0000 を別の編集として送る"));
  await userEvent.click(screen.getByText("#00ff00 を別の編集として送る"));
  await userEvent.click(screen.getByText("戻す"));

  expect(primaryColorText()).toBe("#ff0000");
});
