import { fireEvent, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import {
  artboardHandle,
  canvasSurface,
} from "@/features/canvas/__tests__/canvas-elements";
import {
  drawn,
  renderCanvas,
  resizeHandleFor,
  selectionFromArtboards,
} from "./setup";

/*
 * 右クリックの受け口（docs/06-ui.md「コンテキストメニュー」）。
 *
 * キャンバスが決めるのは「どこを押したか」を何として伝えるかだけで、並ぶものと押せるか
 * どうかは編集画面側（`EditMenu`）が決める。
 */

/** `home` に Text の `title` を 1 つ持つ対。 */
function selectionWithTitle() {
  return selectionFromArtboards([
    {
      name: "home",
      width: 360,
      height: 240,
      children: [{ name: "title", type: "Text" }],
    },
  ]);
}

test("ノードを右クリックすると、押された位置から外へ辿った名前が届く", () => {
  const onOpenContextMenu = vi.fn();
  renderCanvas({ selection: selectionWithTitle(), onOpenContextMenu });

  fireEvent.contextMenu(drawn("title"), { clientX: 120, clientY: 80 });

  expect(onOpenContextMenu).toHaveBeenCalledWith(["title", "home"], {
    x: 120,
    y: 80,
  });
});

test("artboard の見出しを右クリックすると、届くのはその artboard の名前だけ", () => {
  const onOpenContextMenu = vi.fn();
  renderCanvas({ selection: selectionWithTitle(), onOpenContextMenu });

  fireEvent.contextMenu(artboardHandle("home"), { clientX: 40, clientY: 20 });

  expect(onOpenContextMenu).toHaveBeenCalledWith(["home"], { x: 40, y: 20 });
});

test("空き領域を右クリックすると、名前は 1 つも届かない", () => {
  const onOpenContextMenu = vi.fn();
  renderCanvas({ selection: selectionWithTitle(), onOpenContextMenu });

  fireEvent.contextMenu(canvasSurface(), { clientX: 8, clientY: 8 });

  expect(onOpenContextMenu).toHaveBeenCalledWith([], { x: 8, y: 8 });
});

test("枠の中の右クリックは、空き領域としては届かない", () => {
  const onOpenContextMenu = vi.fn();
  renderCanvas({ selection: selectionWithTitle(), onOpenContextMenu });

  fireEvent.contextMenu(drawn("title"), { clientX: 120, clientY: 80 });

  /*
   * 土台の受け口は名前を渡さないので、枠が止めていないと「名前つき」と「空」の 2 回
   * 届く。呼ばれた回数ではなく**空で呼ばれていないこと**を見る（回数だけだと、枠の
   * 受け口そのものを消した実装でも 1 回になる）。
   */
  expect(onOpenContextMenu).not.toHaveBeenCalledWith([], expect.anything());
});

test("ファイルが不正な間は右クリックの受け口が呼ばれない", () => {
  const onOpenContextMenu = vi.fn();
  renderCanvas({
    selection: selectionWithTitle(),
    isFrozen: true,
    onOpenContextMenu,
  });

  fireEvent.contextMenu(drawn("title"), { clientX: 120, clientY: 80 });

  expect(onOpenContextMenu).not.toHaveBeenCalled();
});

test("ファイルが不正でなければ同じ右クリックで受け口が呼ばれる", () => {
  const onOpenContextMenu = vi.fn();
  renderCanvas({ selection: selectionWithTitle(), onOpenContextMenu });

  // 上のテストの対照。これが無いと、受け口を一切呼ばない実装でも通ってしまう
  fireEvent.contextMenu(drawn("title"), { clientX: 120, clientY: 80 });

  expect(onOpenContextMenu).toHaveBeenCalled();
});

test("右ボタンの押下では artboard の移動が始まらない", () => {
  const onRepositionArtboard = vi.fn();
  renderCanvas({ selection: selectionWithTitle(), onRepositionArtboard });
  const frame = drawn("home");

  fireEvent.pointerDown(frame, { button: 2, clientX: 40, clientY: 40 });
  fireEvent.pointerMove(frame, { clientX: 140, clientY: 140 });
  fireEvent.pointerUp(frame, { clientX: 140, clientY: 140 });

  expect(onRepositionArtboard).not.toHaveBeenCalled();
});

test("主ボタンの押下なら同じ操作で artboard が動く", () => {
  const onRepositionArtboard = vi.fn();
  renderCanvas({ selection: selectionWithTitle(), onRepositionArtboard });
  const frame = drawn("home");

  // 上のテストの対照。これが無いと、artboard を一切動かさない実装でも通ってしまう
  fireEvent.pointerDown(frame, { button: 0, clientX: 40, clientY: 40 });
  fireEvent.pointerMove(frame, { clientX: 140, clientY: 140 });
  fireEvent.pointerUp(frame, { clientX: 140, clientY: 140 });

  expect(onRepositionArtboard).toHaveBeenCalled();
});

test("掴めるリサイズハンドルの上で右クリックしても受け口が呼ばれる", () => {
  const onOpenContextMenu = vi.fn();
  renderCanvas({
    selection: selectionFromArtboards(
      [{ name: "home", width: 360, height: 240, children: [] }],
      ["home"],
    ),
    onOpenContextMenu,
  });

  /*
   * ハンドルは土台（`canvas-surface`）の外に重なる。土台で受けていると、ここだけ
   * アプリのメニューが出ずブラウザの既定メニューが出る。
   */
  fireEvent.contextMenu(resizeHandleFor("both"), {
    clientX: 200,
    clientY: 200,
  });

  expect(onOpenContextMenu).toHaveBeenCalledWith([], { x: 200, y: 200 });
});

test("右クリックはブラウザ既定のメニューを止める", () => {
  renderCanvas({ selection: selectionWithTitle() });

  /*
   * `fireEvent` は既定動作が止められたときに `false` を返す。止め忘れると、アプリの
   * メニューとブラウザの既定メニューが同時に出る。
   */
  expect(
    fireEvent.contextMenu(drawn("title"), { clientX: 1, clientY: 1 }),
  ).toBe(false);
});

test("ファイルが不正な間も、ブラウザ既定のメニューは止める", () => {
  renderCanvas({ selection: selectionWithTitle(), isFrozen: true });

  // アプリのメニューを出さないことと、既定のメニューを出さないことは別の判断
  expect(
    fireEvent.contextMenu(canvasSurface(), { clientX: 1, clientY: 1 }),
  ).toBe(false);
});

test("文言のその場編集の入力欄では、ブラウザ既定のメニューを残す", () => {
  const onOpenContextMenu = vi.fn();
  renderCanvas({
    selection: selectionFromArtboards(
      [
        {
          name: "home",
          width: 360,
          height: 240,
          children: [
            { name: "title", type: "Text", props: { content: "ホーム" } },
          ],
        },
      ],
      ["title"],
    ),
    onOpenContextMenu,
  });
  fireEvent.doubleClick(drawn("title"));
  const editor = screen.getByRole("textbox", { name: "文言を編集" });

  /*
   * 切り取り / 貼り付けはブラウザのものが要るので、入力欄の上では既定のメニューを残す。
   * 止めていないことは `fireEvent` の戻り値（`true`）で見る。
   */
  expect(fireEvent.contextMenu(editor, { clientX: 1, clientY: 1 })).toBe(true);
  expect(onOpenContextMenu).not.toHaveBeenCalled();
});
