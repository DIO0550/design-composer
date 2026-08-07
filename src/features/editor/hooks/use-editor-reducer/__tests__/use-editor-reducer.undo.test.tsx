import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import { EditorState } from "@/features/editor/domains/editor-state";
import { Option } from "@/utils/Option";
import { useEditorReducer } from "../index";

function setupDocument(): DesignDocument {
  return DesignDocument.create({
    artboards: [
      {
        name: "home",
        width: 375,
        height: 812,
        children: [{ name: "title", type: "Text" }],
      },
    ],
  });
}

function childNames(state: EditorState): readonly string[] {
  const artboard = Option.unwrap(
    DesignDocument.findArtboard(EditorState.document(state), "home"),
  );
  return artboard.children.map((child) => child.name);
}

/** 編集を 1 つ行い、それを戻す / やり直すアクションを送る器。 */
function UndoHarness() {
  const [state, dispatch] = useEditorReducer(setupDocument());

  return (
    <>
      <p data-testid="children">{childNames(state).join(",")}</p>
      <button
        type="button"
        onClick={() => dispatch({ type: "select", name: "home" })}
      >
        home を選ぶ
      </button>
      <button
        type="button"
        onClick={() =>
          dispatch({
            type: "insert_node",
            template: { kind: "primitive", type: "Box" },
          })
        }
      >
        Box を挿す
      </button>
      <button type="button" onClick={() => dispatch({ type: "undo" })}>
        戻す
      </button>
      <button type="button" onClick={() => dispatch({ type: "redo" })}>
        やり直す
      </button>
    </>
  );
}

test("挿入を戻すと挿す前の並びに戻る", async () => {
  render(<UndoHarness />);
  await userEvent.click(screen.getByRole("button", { name: "home を選ぶ" }));
  await userEvent.click(screen.getByRole("button", { name: "Box を挿す" }));

  await userEvent.click(screen.getByRole("button", { name: "戻す" }));

  expect(screen.getByTestId("children").textContent).toBe("title");
});

test("戻した挿入をやり直すと挿したあとの並びに戻る", async () => {
  render(<UndoHarness />);
  await userEvent.click(screen.getByRole("button", { name: "home を選ぶ" }));
  await userEvent.click(screen.getByRole("button", { name: "Box を挿す" }));
  const inserted = screen.getByTestId("children").textContent;
  await userEvent.click(screen.getByRole("button", { name: "戻す" }));

  await userEvent.click(screen.getByRole("button", { name: "やり直す" }));

  expect(screen.getByTestId("children").textContent).toBe(inserted);
});

test("戻る先が無いときに戻しても並びは変わらない", async () => {
  render(<UndoHarness />);

  await userEvent.click(screen.getByRole("button", { name: "戻す" }));

  expect(screen.getByTestId("children").textContent).toBe("title");
});

test("やり直す先が無いときにやり直しても並びは変わらない", async () => {
  render(<UndoHarness />);

  await userEvent.click(screen.getByRole("button", { name: "やり直す" }));

  expect(screen.getByTestId("children").textContent).toBe("title");
});
