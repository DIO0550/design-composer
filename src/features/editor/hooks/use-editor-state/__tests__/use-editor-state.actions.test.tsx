import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import { SampleSyntaxError } from "@/domains/__tests__/document-errors";
import { ReceivedAt } from "@/domains/__tests__/instants";
import { AxisLength } from "@/domains/dcmp/axis-length";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { Node } from "@/domains/dcmp/node";
import { EditorState } from "@/features/editor/domains/editor-state";
import { Option } from "@/utils/Option";
import { useEditorState } from "../index";
import { homeChildNames } from "./setup";

function setupDocument(): DesignDocument {
  return DesignDocument.create({
    artboards: [
      {
        name: "home",
        width: 375,
        height: 812,
        children: [
          { name: "title", type: "Text" },
          // 置き直しの相手は絶対配置でなければ意味を持たないので、片方をそう置く
          {
            name: "footer",
            type: "Text",
            props: { placement: "absolute", x: 40, y: 24 },
          },
        ],
      },
    ],
  });
}

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

/**
 * `home` が今置かれているキャンバス上の位置。
 * 座標を持たないうちは「無し」を出し、置き直しで付いたことが見える形にする。
 *
 * @param state 読み先の編集状態
 * @returns `x,y` の並び。座標を持たなければ「無し」
 */
function artboardCanvasPosition(state: EditorState): string {
  const position = Option.unwrap(
    DesignDocument.findArtboard(EditorState.document(state), "home"),
  ).canvasPosition;
  return position === undefined ? "無し" : `${position.x},${position.y}`;
}

function artboardWidth(state: EditorState): number {
  return Option.unwrap(
    DesignDocument.findArtboard(EditorState.document(state), "home"),
  ).width;
}

/**
 * `footer` が今置かれている座標。縦横を続けて読み、片方だけの書き換えも見える形にする。
 * 読み直しで `footer` ごと消える器なので、居ないときは座標の代わりに「無し」を出す。
 */
function footerCoordinates(state: EditorState): string {
  const found = DesignDocument.findNode(EditorState.document(state), "footer");
  if (!found.some) {
    return "無し";
  }
  const props = Node.isPrimitive(found.value) ? (found.value.props ?? {}) : {};
  return `${props.x},${props.y}`;
}

/**
 * フックを DOM へ繋いだだけの器。
 * アクションを 1 つずつ送る口と、状態の読み出し（選択・子の並び）を与える。
 */
function EditorStateHarness() {
  const [state, dispatch] = useEditorState(setupDocument());

  return (
    <>
      <p data-testid="selected">
        {Option.unwrapOr(EditorState.singleName(state), "選択なし")}
      </p>
      <p data-testid="children">{homeChildNames(state).join(",")}</p>
      <p data-testid="artboard-width">{artboardWidth(state)}</p>
      <p data-testid="footer-coordinates">{footerCoordinates(state)}</p>
      <p data-testid="artboard-canvas-position">
        {artboardCanvasPosition(state)}
      </p>
      <p data-testid="file-validity">{state.fileValidity.kind}</p>
      <button
        type="button"
        onClick={() => dispatch({ type: "select", name: "title" })}
      >
        title を選ぶ
      </button>
      <button
        type="button"
        onClick={() => dispatch({ type: "select", name: "home" })}
      >
        home を選ぶ
      </button>
      <button
        type="button"
        onClick={() => dispatch({ type: "clear_selection" })}
      >
        選択を外す
      </button>
      <button
        type="button"
        onClick={() => dispatch({ type: "select_all_instances" })}
      >
        まとめて選ぶ
      </button>
      <button
        type="button"
        onClick={() =>
          dispatch({
            type: "reload_document",
            reload: { kind: "reloaded", document: setupReloadedDocument() },
            at: ReceivedAt,
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
            reload: { kind: "rejected", errors: [SampleSyntaxError] },
            at: ReceivedAt,
          })
        }
      >
        不正なファイルを取り込む
      </button>
      <button
        type="button"
        onClick={() => dispatch({ type: "reveal", name: "footer" })}
      >
        footer を明かす
      </button>
      <button
        type="button"
        onClick={() => dispatch({ type: "reveal", name: "居ないノード" })}
      >
        居ないノードを明かす
      </button>
      <button type="button" onClick={() => dispatch({ type: "revert_file" })}>
        ファイルへ書き戻す
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
      <button
        type="button"
        onClick={() =>
          dispatch({
            type: "insert_node_at",
            template: { kind: "primitive", type: "Box" },
            at: { parentName: "home", index: 1 },
          })
        }
      >
        home の 2 番目へ挿す
      </button>
      <button
        type="button"
        onClick={() =>
          dispatch({
            type: "insert_node_at",
            template: { kind: "primitive", type: "Box" },
            at: { parentName: "title", index: 0 },
          })
        }
      >
        Text の下へ挿す
      </button>
      <button
        type="button"
        onClick={() =>
          dispatch({ type: "resize", sizes: [AxisLength.create("width", 500)] })
        }
      >
        幅を 500 にする
      </button>
      <button
        type="button"
        onClick={() =>
          dispatch({
            type: "reposition_node",
            name: "footer",
            placement: { mode: "absolute", x: 70, y: 12 },
          })
        }
      >
        footer を別の座標へ置き直す
      </button>
      <button
        type="button"
        onClick={() =>
          dispatch({
            type: "reposition_artboard",
            name: "home",
            canvasPosition: { x: 900, y: 300 },
          })
        }
      >
        home をキャンバス上の別の位置へ置き直す
      </button>
      <button
        type="button"
        onClick={() =>
          dispatch({
            type: "reposition_artboard",
            name: "footer",
            canvasPosition: { x: 900, y: 300 },
          })
        }
      >
        footer をキャンバス上の別の位置へ置き直す
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

function artboardWidthText(): string {
  return screen.getByTestId("artboard-width").textContent ?? "";
}

function fileValidityKind(): string {
  return screen.getByTestId("file-validity").textContent ?? "";
}

function artboardCanvasPositionText(): string {
  return screen.getByTestId("artboard-canvas-position").textContent ?? "";
}

function footerCoordinatesText(): string {
  return screen.getByTestId("footer-coordinates").textContent ?? "";
}

test("開いた直後は何も選択されていない", () => {
  render(<EditorStateHarness />);

  expect(selected()).toBe("選択なし");
});

test("選択のアクションを送るとそのノードが選択される", async () => {
  render(<EditorStateHarness />);

  await userEvent.click(screen.getByRole("button", { name: "title を選ぶ" }));

  expect(selected()).toBe("title");
});

test("選択解除のアクションを送ると選択が外れる", async () => {
  render(<EditorStateHarness />);
  await userEvent.click(screen.getByRole("button", { name: "title を選ぶ" }));

  await userEvent.click(screen.getByRole("button", { name: "選択を外す" }));

  expect(selected()).toBe("選択なし");
});

test("読み直しのアクションを送るとドキュメントが差し替わる", async () => {
  render(<EditorStateHarness />);

  await userEvent.click(screen.getByRole("button", { name: "読み直す" }));

  expect(children()).toBe("lead");
});

test("読み直したドキュメントに選択中のノードが無ければ選択が外れる", async () => {
  render(<EditorStateHarness />);
  await userEvent.click(screen.getByRole("button", { name: "title を選ぶ" }));

  await userEvent.click(screen.getByRole("button", { name: "読み直す" }));

  expect(selected()).toBe("選択なし");
});

test("不正なファイルを取り込むアクションを送ってもドキュメントは差し替わらない", async () => {
  render(<EditorStateHarness />);

  await userEvent.click(
    screen.getByRole("button", { name: "不正なファイルを取り込む" }),
  );

  expect(children()).toBe("title,footer");
});

test("並べ替えのアクションを送ると子の並びがその順序に変わる", async () => {
  render(<EditorStateHarness />);

  await userEvent.click(screen.getByRole("button", { name: "title を下へ" }));

  expect(children()).toBe("footer,title");
});

test("並べ替えても選択していたノードは選択されたままになる", async () => {
  render(<EditorStateHarness />);
  await userEvent.click(screen.getByRole("button", { name: "title を選ぶ" }));

  await userEvent.click(screen.getByRole("button", { name: "title を下へ" }));

  expect(selected()).toBe("title");
});

test("並びの外を移動先にした並べ替えでは子の並びが変わらない", async () => {
  render(<EditorStateHarness />);

  await userEvent.click(screen.getByRole("button", { name: "並びの外へ" }));

  expect(children()).toBe("title,footer");
});

test("移動のアクションを送ると、離した位置に応じて子の並びが変わる", async () => {
  render(<EditorStateHarness />);

  await userEvent.click(
    screen.getByRole("button", { name: "title を末尾へ運ぶ" }),
  );

  expect(children()).toBe("footer,title");
});

test("子を持てないノードの下を移動先にすると子の並びが変わらない", async () => {
  render(<EditorStateHarness />);

  await userEvent.click(
    screen.getByRole("button", { name: "title を Text の下へ運ぶ" }),
  );

  expect(children()).toBe("title,footer");
});

test("落とし先を指した挿入のアクションを送ると、その位置に子が増える", async () => {
  render(<EditorStateHarness />);

  // 先頭・末尾だと、落とし先を捨てて足すだけの実装でも同じ並びになる
  await userEvent.click(
    screen.getByRole("button", { name: "home の 2 番目へ挿す" }),
  );

  expect(children()).toBe("title,box,footer");
});

test("子を持てないノードを落とし先にした挿入のアクションを送っても子は増えない", async () => {
  render(<EditorStateHarness />);

  /*
   * 画面の操作からは `DropParent.innermost` が受け入れられない親を外すのでここへ来ないが、
   * アクションは誰でも送れるので、届いたときに何もしないことをここで固定する。
   */
  await userEvent.click(
    screen.getByRole("button", { name: "Text の下へ挿す" }),
  );

  expect(children()).toBe("title,footer");
});

test("置き直しのアクションを送ると縦横とも新しい座標になる", async () => {
  render(<EditorStateHarness />);

  await userEvent.click(
    screen.getByRole("button", { name: "footer を別の座標へ置き直す" }),
  );

  expect(footerCoordinatesText()).toBe("70,12");
});

test("artboard の置き直しのアクションを送るとキャンバス上の位置が付く", async () => {
  render(<EditorStateHarness />);

  await userEvent.click(
    screen.getByRole("button", {
      name: "home をキャンバス上の別の位置へ置き直す",
    }),
  );

  expect(artboardCanvasPositionText()).toBe("900,300");
});

test("artboard の置き直しにノードの名前を送っても何も変わらない", async () => {
  // キャンバス上の位置を持つのは artboard だけ（ノードの座標は親からの相対）
  render(<EditorStateHarness />);

  await userEvent.click(
    screen.getByRole("button", {
      name: "footer をキャンバス上の別の位置へ置き直す",
    }),
  );

  expect(artboardCanvasPositionText()).toBe("無し");
});

test("置き直しのアクションを送っても選択は変わらない", async () => {
  render(<EditorStateHarness />);
  await userEvent.click(screen.getByRole("button", { name: "title を選ぶ" }));

  await userEvent.click(
    screen.getByRole("button", { name: "footer を別の座標へ置き直す" }),
  );

  expect(selected()).toBe("title");
});

test("選択中の artboard にリサイズのアクションを送るとその大きさになる", async () => {
  render(<EditorStateHarness />);
  await userEvent.click(screen.getByRole("button", { name: "home を選ぶ" }));

  await userEvent.click(
    screen.getByRole("button", { name: "幅を 500 にする" }),
  );

  expect(artboardWidthText()).toBe("500");
});

test("何も選んでいないままリサイズのアクションを送っても大きさは変わらない", async () => {
  render(<EditorStateHarness />);

  await userEvent.click(
    screen.getByRole("button", { name: "幅を 500 にする" }),
  );

  expect(artboardWidthText()).toBe("375");
});

test("明かすアクションを送ると、そのノードが選択される", async () => {
  render(<EditorStateHarness />);
  // 別のノードを選択済みから始める（選択なしだと「何もしない」実装でも通る）
  await userEvent.click(screen.getByRole("button", { name: "title を選ぶ" }));

  await userEvent.click(
    screen.getByRole("button", { name: "footer を明かす" }),
  );

  expect(selected()).toBe("footer");
});

test("表示中のドキュメントに無いノードを明かしても選択は変わらない", async () => {
  render(<EditorStateHarness />);
  await userEvent.click(screen.getByRole("button", { name: "title を選ぶ" }));

  await userEvent.click(
    screen.getByRole("button", { name: "居ないノードを明かす" }),
  );

  expect(selected()).toBe("title");
});

test("書き戻しのアクションを送ると、ファイル由来のエラーが消える", async () => {
  render(<EditorStateHarness />);
  await userEvent.click(
    screen.getByRole("button", { name: "不正なファイルを取り込む" }),
  );

  await userEvent.click(
    screen.getByRole("button", { name: "ファイルへ書き戻す" }),
  );

  expect(fileValidityKind()).toBe("valid");
});

test("不正なファイルを取り込むと、ファイル由来のエラーが載る", async () => {
  render(<EditorStateHarness />);

  await userEvent.click(
    screen.getByRole("button", { name: "不正なファイルを取り込む" }),
  );

  expect(fileValidityKind()).toBe("invalid");
});

test("インスタンス以外を選んでまとめて選ぶアクションを送っても選択は変わらない", async () => {
  render(<EditorStateHarness />);
  await userEvent.click(screen.getByRole("button", { name: "title を選ぶ" }));

  await userEvent.click(screen.getByRole("button", { name: "まとめて選ぶ" }));

  expect(screen.getByTestId("selected").textContent).toBe("title");
});
