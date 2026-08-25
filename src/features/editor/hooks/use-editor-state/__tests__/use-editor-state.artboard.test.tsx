import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import { EditorState } from "@/features/editor/domains/editor-state";
import { Option } from "@/utils/Option";
import { useEditorState } from "../index";

/** artboard 2 枚。並べ替えを確かめるのに 1 枚では足りない。 */
function setupDocument(): DesignDocument {
  return DesignDocument.create({
    artboards: [
      {
        name: "home",
        width: 375,
        height: 812,
        children: [{ name: "title", type: "Text" }],
      },
      { name: "settings", width: 375, height: 812, children: [] },
    ],
  });
}

function artboardNames(state: EditorState): readonly string[] {
  return EditorState.document(state).artboards.map((artboard) => artboard.name);
}

/** artboard 操作のアクションだけを送る器。 */
function ArtboardActionHarness() {
  const [state, dispatch] = useEditorState(setupDocument());

  return (
    <>
      <p data-testid="artboards">{artboardNames(state).join(",")}</p>
      <p data-testid="selected">
        {Option.unwrapOr(EditorState.singleName(state), "選択なし")}
      </p>
      <button type="button" onClick={() => dispatch({ type: "add_artboard" })}>
        artboard を足す
      </button>
      <button
        type="button"
        onClick={() =>
          dispatch({ type: "reorder_artboard", fromIndex: 0, toIndex: 1 })
        }
      >
        先頭を下へ
      </button>
      <button
        type="button"
        onClick={() =>
          dispatch({ type: "reorder_artboard", fromIndex: 0, toIndex: 5 })
        }
      >
        並びの外へ
      </button>
      <button
        type="button"
        onClick={() => dispatch({ type: "select", name: "home" })}
      >
        home を選ぶ
      </button>
      <button
        type="button"
        onClick={() => dispatch({ type: "remove_selected" })}
      >
        選んでいるものを消す
      </button>
    </>
  );
}

function artboards(): string {
  return screen.getByTestId("artboards").textContent ?? "";
}

async function press(name: string): Promise<void> {
  await userEvent.click(screen.getByRole("button", { name }));
}

test("追加のアクションを送ると artboard が末尾に1枚増える", async () => {
  render(<ArtboardActionHarness />);

  await press("artboard を足す");

  expect(artboards()).toBe("home,settings,artboard");
});

test("追加のアクションを送ると足した artboard が選択になる", async () => {
  render(<ArtboardActionHarness />);

  await press("artboard を足す");

  expect(screen.getByTestId("selected").textContent).toBe("artboard");
});

test("並べ替えのアクションを送ると並び順が入れ替わる", async () => {
  render(<ArtboardActionHarness />);

  await press("先頭を下へ");

  expect(artboards()).toBe("settings,home");
});

test("並びの外を指す並べ替えでは並び順が変わらない", async () => {
  render(<ArtboardActionHarness />);

  await press("並びの外へ");

  expect(artboards()).toBe("home,settings");
});

test("artboard を選んで削除のアクションを送るとその1枚が消える", async () => {
  render(<ArtboardActionHarness />);
  await press("home を選ぶ");

  await press("選んでいるものを消す");

  expect(artboards()).toBe("settings");
});
