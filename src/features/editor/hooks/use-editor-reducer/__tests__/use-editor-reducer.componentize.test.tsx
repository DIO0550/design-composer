import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { ComponentSet } from "@/domains/component";
import { DesignDocument } from "@/domains/design-document";
import { Node } from "@/domains/node";
import { EditorState } from "@/features/editor/domains/editor-state";
import { Option } from "@/utils/Option";
import { useEditorReducer } from "../index";

/** 部品化の対象になるノードと、名前が衝突する既存の部品を 1 つずつ置く。 */
function setupDocument(): DesignDocument {
  return DesignDocument.create({
    components: {
      card: {
        type: "Box",
        children: [
          { name: "card-label", type: "Text", props: { content: "Card" } },
        ],
      },
    },
    artboards: [
      {
        name: "home",
        width: 375,
        height: 812,
        children: [
          {
            name: "home-panel",
            type: "Box",
            children: [{ name: "home-title", type: "Text" }],
          },
        ],
      },
    ],
  });
}

/** 名前で引いたノードが参照ノードか。引けなければ `false`。 */
function isRefNamed(state: EditorState, name: string): boolean {
  const node = DesignDocument.findNode(EditorState.document(state), name);
  return node.some && Node.isRef(node.value);
}

/**
 * 部品化のアクションを送る器。部品が増えたかは部品名の並びで、元の位置が
 * インスタンスになったかは参照ノードかどうかで読める。
 */
function ComponentizeHarness() {
  const [state, dispatch] = useEditorReducer(setupDocument());

  return (
    <>
      <p data-testid="components">
        {ComponentSet.names(EditorState.document(state).components).join(",")}
      </p>
      <p data-testid="panel-is-ref">
        {String(isRefNamed(state, "home-panel"))}
      </p>
      <p data-testid="selected">
        {Option.unwrapOr(state.selectedName, "選択なし")}
      </p>
      <button
        type="button"
        onClick={() => dispatch({ type: "select", name: "home-panel" })}
      >
        home-panel を選ぶ
      </button>
      <button
        type="button"
        onClick={() =>
          dispatch({ type: "create_component", componentName: "info-panel" })
        }
      >
        info-panel として部品にする
      </button>
      <button
        type="button"
        onClick={() =>
          dispatch({ type: "create_component", componentName: "card" })
        }
      >
        card として部品にする
      </button>
      <button
        type="button"
        onClick={() =>
          dispatch({ type: "create_component", componentName: "Info Panel" })
        }
      >
        Info Panel として部品にする
      </button>
    </>
  );
}

test("ノードを選んで部品化のアクションを送るとその名前の部品が増える", async () => {
  const user = userEvent.setup();
  render(<ComponentizeHarness />);

  await user.click(screen.getByRole("button", { name: "home-panel を選ぶ" }));
  await user.click(
    screen.getByRole("button", { name: "info-panel として部品にする" }),
  );

  expect(screen.getByTestId("components").textContent).toBe("card,info-panel");
});

test("部品化のアクションを送ると元の位置がインスタンスになる", async () => {
  const user = userEvent.setup();
  render(<ComponentizeHarness />);

  await user.click(screen.getByRole("button", { name: "home-panel を選ぶ" }));
  await user.click(
    screen.getByRole("button", { name: "info-panel として部品にする" }),
  );

  expect(screen.getByTestId("panel-is-ref").textContent).toBe("true");
});

test("部品化のアクションを送っても選択は同じ名前のまま残る", async () => {
  const user = userEvent.setup();
  render(<ComponentizeHarness />);

  await user.click(screen.getByRole("button", { name: "home-panel を選ぶ" }));
  await user.click(
    screen.getByRole("button", { name: "info-panel として部品にする" }),
  );

  expect(screen.getByTestId("selected").textContent).toBe("home-panel");
});

test("何も選ばずに部品化のアクションを送っても部品は増えない", async () => {
  const user = userEvent.setup();
  render(<ComponentizeHarness />);

  await user.click(
    screen.getByRole("button", { name: "info-panel として部品にする" }),
  );

  expect(screen.getByTestId("components").textContent).toBe("card");
});

test("既にある名前で部品化のアクションを送っても部品は増えない", async () => {
  const user = userEvent.setup();
  render(<ComponentizeHarness />);

  await user.click(screen.getByRole("button", { name: "home-panel を選ぶ" }));
  await user.click(
    screen.getByRole("button", { name: "card として部品にする" }),
  );

  expect(screen.getByTestId("components").textContent).toBe("card");
});

test("識別子の規則を満たさない名前で部品化のアクションを送っても部品は増えない", async () => {
  const user = userEvent.setup();
  render(<ComponentizeHarness />);

  await user.click(screen.getByRole("button", { name: "home-panel を選ぶ" }));
  await user.click(
    screen.getByRole("button", { name: "Info Panel として部品にする" }),
  );

  expect(screen.getByTestId("components").textContent).toBe("card");
});
