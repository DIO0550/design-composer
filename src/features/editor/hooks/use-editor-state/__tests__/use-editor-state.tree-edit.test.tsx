import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { EditorState } from "@/features/editor/domains/editor-state";
import { Option } from "@/utils/Option";
import { useEditorState } from "../index";
import { homeChildNames } from "./setup";

function setupDocument(): DesignDocument {
  return DesignDocument.create({
    components: { card: { type: "Box" } },
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

/**
 * 挿入・削除・コピー & ペーストのアクションを 1 つずつ送る器。
 * 選択の切り替えも同じ器から行い、選択に応じた結果を見る。
 */
function TreeEditHarness() {
  const [state, dispatch] = useEditorState(setupDocument());

  return (
    <>
      <p data-testid="children">{homeChildNames(state).join(",")}</p>
      <p data-testid="selected">
        {Option.unwrapOr(EditorState.singleName(state), "選択なし")}
      </p>
      <button
        type="button"
        onClick={() => dispatch({ type: "select", name: "home" })}
      >
        home を選ぶ
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
            type: "insert_node",
            template: { kind: "primitive", type: "Box" },
          })
        }
      >
        Box を挿す
      </button>
      <button
        type="button"
        onClick={() =>
          dispatch({
            type: "insert_node",
            template: { kind: "instance", componentName: "card" },
          })
        }
      >
        card を挿す
      </button>
      <button
        type="button"
        onClick={() => dispatch({ type: "remove_selected" })}
      >
        削除する
      </button>
      <button type="button" onClick={() => dispatch({ type: "copy_node" })}>
        コピーする
      </button>
      <button type="button" onClick={() => dispatch({ type: "paste_node" })}>
        貼り付ける
      </button>
    </>
  );
}

test("artboard を選んで挿入すると子の並びの末尾に加わる", async () => {
  const user = userEvent.setup();
  render(<TreeEditHarness />);

  await user.click(screen.getByRole("button", { name: "home を選ぶ" }));
  await user.click(screen.getByRole("button", { name: "Box を挿す" }));

  expect(screen.getByTestId("children").textContent).toBe("title,box");
});

test("部品を挿入すると参照ノードが子の並びに加わる", async () => {
  const user = userEvent.setup();
  render(<TreeEditHarness />);

  await user.click(screen.getByRole("button", { name: "home を選ぶ" }));
  await user.click(screen.getByRole("button", { name: "card を挿す" }));

  expect(screen.getByTestId("children").textContent).toBe("title,card-2");
});

test("ノードを選んで削除すると子の並びから消える", async () => {
  const user = userEvent.setup();
  render(<TreeEditHarness />);

  await user.click(screen.getByRole("button", { name: "title を選ぶ" }));
  await user.click(screen.getByRole("button", { name: "削除する" }));

  expect(screen.getByTestId("children").textContent).toBe("");
});

test("削除すると選択が外れる", async () => {
  const user = userEvent.setup();
  render(<TreeEditHarness />);

  await user.click(screen.getByRole("button", { name: "title を選ぶ" }));
  await user.click(screen.getByRole("button", { name: "削除する" }));

  expect(screen.getByTestId("selected").textContent).toBe("選択なし");
});

test("何も選んでいないときに削除しても子の並びは変わらない", async () => {
  const user = userEvent.setup();
  render(<TreeEditHarness />);

  await user.click(screen.getByRole("button", { name: "削除する" }));

  expect(screen.getByTestId("children").textContent).toBe("title");
});

test("ノードをコピーして artboard へ貼ると連番の名前で子の並びに加わる", async () => {
  const user = userEvent.setup();
  render(<TreeEditHarness />);

  await user.click(screen.getByRole("button", { name: "title を選ぶ" }));
  await user.click(screen.getByRole("button", { name: "コピーする" }));
  await user.click(screen.getByRole("button", { name: "home を選ぶ" }));
  await user.click(screen.getByRole("button", { name: "貼り付ける" }));

  expect(screen.getByTestId("children").textContent).toBe("title,title-2");
});

test("コピーしただけでは子の並びは変わらない", async () => {
  const user = userEvent.setup();
  render(<TreeEditHarness />);

  await user.click(screen.getByRole("button", { name: "title を選ぶ" }));
  await user.click(screen.getByRole("button", { name: "コピーする" }));

  expect(screen.getByTestId("children").textContent).toBe("title");
});

test("何もコピーしていないときに貼り付けても子の並びは変わらない", async () => {
  const user = userEvent.setup();
  render(<TreeEditHarness />);

  await user.click(screen.getByRole("button", { name: "home を選ぶ" }));
  await user.click(screen.getByRole("button", { name: "貼り付ける" }));

  expect(screen.getByTestId("children").textContent).toBe("title");
});

test("何も選んでいないときにコピーしても貼り付けるものは増えない", async () => {
  const user = userEvent.setup();
  render(<TreeEditHarness />);

  await user.click(screen.getByRole("button", { name: "コピーする" }));
  await user.click(screen.getByRole("button", { name: "home を選ぶ" }));
  await user.click(screen.getByRole("button", { name: "貼り付ける" }));

  expect(screen.getByTestId("children").textContent).toBe("title");
});
