import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { PropEdit } from "@/domains/dcmp/node";
import { EditContinuities } from "@/domains/session/edit-continuity";
import { EditorState } from "@/features/editor/domains/editor-state";
import { useEditorState } from "../index";

/** `home` の直下に Text の `title` と、部品 `card` のインスタンス `home-card` が並ぶ。 */
function setupDocument(): DesignDocument {
  return DesignDocument.create({
    components: {
      card: {
        type: "Box",
        children: [{ name: "card-label", type: "Text" }],
      },
    },
    artboards: [
      {
        name: "home",
        width: 375,
        height: 812,
        children: [
          { name: "title", type: "Text" },
          { name: "home-card", ref: "card" },
        ],
      },
    ],
  });
}

/** ロックしているかを、ロックしていれば `locked`、していなければ `unlocked` の綴りで出す。 */
function lockingOf(state: EditorState, name: string): string {
  return DesignDocument.isLocked(EditorState.document(state), name)
    ? "locked"
    : "unlocked";
}

/**
 * インスタンス自身の値の編集を送る器。ロックできたかはインスタンスと Text のロックの綴りで
 * 読める。
 */
function InstanceLockHarness() {
  const [state, dispatch] = useEditorState(setupDocument());

  return (
    <>
      <p data-testid="card-locking">{lockingOf(state, "home-card")}</p>
      <p data-testid="title-locking">{lockingOf(state, "title")}</p>
      <button
        type="button"
        onClick={() => dispatch({ type: "select", name: "home-card" })}
      >
        home-card を選ぶ
      </button>
      <button
        type="button"
        onClick={() => dispatch({ type: "select", name: "title" })}
      >
        title を選ぶ
      </button>
      <button
        type="button"
        onClick={() =>
          dispatch({
            type: "apply_ref_own_prop_edit",
            edit: PropEdit.set(["locking"], "locked"),
            continuity: EditContinuities.Separate,
          })
        }
      >
        ロックする
      </button>
      <button
        type="button"
        onClick={() =>
          dispatch({
            type: "apply_ref_own_prop_edit",
            edit: PropEdit.set(["label"], "x"),
            continuity: EditContinuities.Separate,
          })
        }
      >
        持てない prop を書く
      </button>
      <button type="button" onClick={() => dispatch({ type: "undo" })}>
        元に戻す
      </button>
    </>
  );
}

test("インスタンスを選んでロックの編集を送ると、インスタンスがロックされる", async () => {
  const user = userEvent.setup();
  render(<InstanceLockHarness />);

  await user.click(screen.getByRole("button", { name: "home-card を選ぶ" }));
  await user.click(screen.getByRole("button", { name: "ロックする" }));

  expect(screen.getByTestId("card-locking").textContent).toBe("locked");
});

test("プリミティブを選んでインスタンス自身の値の編集を送っても、木は変わらない", async () => {
  const user = userEvent.setup();
  render(<InstanceLockHarness />);

  await user.click(screen.getByRole("button", { name: "title を選ぶ" }));
  await user.click(screen.getByRole("button", { name: "ロックする" }));

  expect(screen.getByTestId("title-locking").textContent).toBe("unlocked");
});

test("何も選んでいないときにインスタンス自身の値の編集を送っても、木は変わらない", async () => {
  const user = userEvent.setup();
  render(<InstanceLockHarness />);

  await user.click(screen.getByRole("button", { name: "ロックする" }));

  expect([
    screen.getByTestId("card-locking").textContent,
    screen.getByTestId("title-locking").textContent,
  ]).toEqual(["unlocked", "unlocked"]);
});

test("ロックしたあとに持てない prop の編集を送ってから元に戻すと、ロックが外れる", async () => {
  /*
   * 持てない prop の編集が履歴に段を積むと、1 回の元に戻すはその空の段を戻すだけで
   * ロックが残って落ちる。
   */
  const user = userEvent.setup();
  render(<InstanceLockHarness />);

  await user.click(screen.getByRole("button", { name: "home-card を選ぶ" }));
  await user.click(screen.getByRole("button", { name: "ロックする" }));
  await user.click(
    screen.getByRole("button", { name: "持てない prop を書く" }),
  );
  await user.click(screen.getByRole("button", { name: "元に戻す" }));

  expect(screen.getByTestId("card-locking").textContent).toBe("unlocked");
});
