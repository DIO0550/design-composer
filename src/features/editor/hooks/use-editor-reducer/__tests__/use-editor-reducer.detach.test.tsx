import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import { Node } from "@/domains/node";
import { EditorState } from "@/features/editor/domains/editor-state";
import { Option } from "@/utils/Option";
import { useEditorReducer } from "../index";

/**
 * `home-broken` は定義の無い部品を指す。解除は失敗し木は変わらないが、
 * 不正なドキュメントも画面には残る（docs/03-schema.md「不正ファイル時の挙動」）ので、
 * この状態はアクションの送り先として実在する。
 */
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
          { name: "title", type: "Text" },
          { name: "home-card", ref: "card" },
          { name: "home-broken", ref: "missing" },
        ],
      },
    ],
  });
}

/** 名前で引いたノードの子の名前。引けなければ空。 */
function childNamesOf(state: EditorState, name: string): readonly string[] {
  const node = DesignDocument.findNode(EditorState.document(state), name);
  return node.some ? Node.children(node.value).map((child) => child.name) : [];
}

/**
 * 解除のアクションを送る器。参照ノードのままなら子は無く、実体になれば
 * 部品の中身が子として現れるので、解除できたかは子の並びで読める。
 */
function DetachHarness() {
  const [state, dispatch] = useEditorReducer(setupDocument());

  return (
    <>
      <p data-testid="card-children">
        {childNamesOf(state, "home-card").join(",")}
      </p>
      <p data-testid="broken-children">
        {childNamesOf(state, "home-broken").join(",")}
      </p>
      <p data-testid="selected">
        {Option.unwrapOr(state.selectedName, "選択なし")}
      </p>
      <button
        type="button"
        onClick={() => dispatch({ type: "select", name: "home-card" })}
      >
        home-card を選ぶ
      </button>
      <button
        type="button"
        onClick={() => dispatch({ type: "select", name: "home-broken" })}
      >
        home-broken を選ぶ
      </button>
      <button
        type="button"
        onClick={() => dispatch({ type: "select", name: "title" })}
      >
        title を選ぶ
      </button>
      <button
        type="button"
        onClick={() => dispatch({ type: "detach_instance" })}
      >
        解除する
      </button>
      <button type="button" onClick={() => dispatch({ type: "undo" })}>
        元に戻す
      </button>
    </>
  );
}

test("インスタンスを選んで解除すると部品の中身が子として現れる", async () => {
  const user = userEvent.setup();
  render(<DetachHarness />);

  await user.click(screen.getByRole("button", { name: "home-card を選ぶ" }));
  await user.click(screen.getByRole("button", { name: "解除する" }));

  /*
   * `card-label` は部品定義の内部ノード名として既に使われているので、実体化した側は
   * 採番される（docs/01-file-format.md「ツールはコピー & ペースト時に自動リネームして
   * 一意性を保つ」と同じ規則）。採番の規則そのものは
   * `services/instance-composition` のテストが持つ。
   */
  expect(screen.getByTestId("card-children").textContent).toBe("card-label-2");
});

test("解除しても選択は外れない", async () => {
  const user = userEvent.setup();
  render(<DetachHarness />);

  await user.click(screen.getByRole("button", { name: "home-card を選ぶ" }));
  await user.click(screen.getByRole("button", { name: "解除する" }));

  expect(screen.getByTestId("selected").textContent).toBe("home-card");
});

test("解除したあとに元に戻すと参照ノードに戻る", async () => {
  const user = userEvent.setup();
  render(<DetachHarness />);

  await user.click(screen.getByRole("button", { name: "home-card を選ぶ" }));
  await user.click(screen.getByRole("button", { name: "解除する" }));
  await user.click(screen.getByRole("button", { name: "元に戻す" }));

  expect(screen.getByTestId("card-children").textContent).toBe("");
});

test("存在しない部品を指すインスタンスを解除しても木は変わらない", async () => {
  const user = userEvent.setup();
  render(<DetachHarness />);

  await user.click(screen.getByRole("button", { name: "home-broken を選ぶ" }));
  await user.click(screen.getByRole("button", { name: "解除する" }));

  expect(screen.getByTestId("broken-children").textContent).toBe("");
});

test("インスタンスでないノードを選んで解除しても木は変わらない", async () => {
  const user = userEvent.setup();
  render(<DetachHarness />);

  await user.click(screen.getByRole("button", { name: "title を選ぶ" }));
  await user.click(screen.getByRole("button", { name: "解除する" }));

  expect(screen.getByTestId("card-children").textContent).toBe("");
});

test("何も選んでいないときに解除しても木は変わらない", async () => {
  const user = userEvent.setup();
  render(<DetachHarness />);

  await user.click(screen.getByRole("button", { name: "解除する" }));

  expect(screen.getByTestId("card-children").textContent).toBe("");
});
