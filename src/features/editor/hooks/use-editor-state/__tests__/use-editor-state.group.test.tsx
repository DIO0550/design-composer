import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { EditorState } from "@/features/editor/domains/editor-state";
import { Option } from "@/utils/Option";
import { useEditorState } from "../index";
import { homeChildNames } from "./setup";

/** `home` に Text の `title` と、Text を 1 つ抱えた Box の `panel` が並ぶドキュメント。 */
function setupDocument(): DesignDocument {
  return DesignDocument.create({
    artboards: [
      {
        name: "home",
        width: 375,
        height: 812,
        children: [
          { name: "title", type: "Text" },
          {
            name: "panel",
            type: "Box",
            children: [{ name: "panel-label", type: "Text" }],
          },
        ],
      },
    ],
  });
}

/**
 * グループ化・グループ解除のアクションを送る器。どちらも `home` の子の並びが変わるので、
 * 効いたかどうかはその並びで読める。
 */
function GroupHarness() {
  const [state, dispatch] = useEditorState(setupDocument());

  return (
    <>
      <p data-testid="home-children">{homeChildNames(state).join(",")}</p>
      <p data-testid="selected">
        {Option.unwrapOr(EditorState.singleName(state), "選択なし")}
      </p>
      <button
        type="button"
        onClick={() => dispatch({ type: "select", name: "title" })}
      >
        title を選ぶ
      </button>
      <button
        type="button"
        onClick={() => dispatch({ type: "select", name: "panel" })}
      >
        panel を選ぶ
      </button>
      <button
        type="button"
        onClick={() => dispatch({ type: "group_selected" })}
      >
        包む
      </button>
      <button
        type="button"
        onClick={() => dispatch({ type: "ungroup_selected" })}
      >
        外す
      </button>
    </>
  );
}

test("ノードを選んで包むと、その位置に新しい Box が入る", async () => {
  const user = userEvent.setup();
  render(<GroupHarness />);

  await user.click(screen.getByRole("button", { name: "title を選ぶ" }));
  await user.click(screen.getByRole("button", { name: "包む" }));

  expect(screen.getByTestId("home-children").textContent).toBe("box,panel");
});

test("包むと、新しい Box が選ばれる", async () => {
  const user = userEvent.setup();
  render(<GroupHarness />);

  await user.click(screen.getByRole("button", { name: "title を選ぶ" }));
  await user.click(screen.getByRole("button", { name: "包む" }));

  expect(screen.getByTestId("selected").textContent).toBe("box");
});

test("Box を選んで外すと、その子が親へ戻る", async () => {
  const user = userEvent.setup();
  render(<GroupHarness />);

  await user.click(screen.getByRole("button", { name: "panel を選ぶ" }));
  await user.click(screen.getByRole("button", { name: "外す" }));

  expect(screen.getByTestId("home-children").textContent).toBe(
    "title,panel-label",
  );
});

test("何も選んでいないときに包んでも木は変わらない", async () => {
  const user = userEvent.setup();
  render(<GroupHarness />);

  await user.click(screen.getByRole("button", { name: "包む" }));

  expect(screen.getByTestId("home-children").textContent).toBe("title,panel");
});

test("Text を選んで外しても木は変わらない", async () => {
  const user = userEvent.setup();
  render(<GroupHarness />);

  await user.click(screen.getByRole("button", { name: "title を選ぶ" }));
  await user.click(screen.getByRole("button", { name: "外す" }));

  expect(screen.getByTestId("home-children").textContent).toBe("title,panel");
});
