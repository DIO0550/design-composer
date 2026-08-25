import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import { DocumentSelection } from "@/domains/document-selection";
import { ArtboardList } from "../index";

/** artboard 3 枚。両端と中ほどで並べ替えのボタンの出方が変わるので 3 枚要る。 */
function setupDocument(): DesignDocument {
  return DesignDocument.create({
    artboards: [
      { name: "home", width: 360, height: 240, children: [] },
      { name: "settings", width: 360, height: 240, children: [] },
      { name: "about", width: 360, height: 240, children: [] },
    ],
  });
}

/** 受け口一式。押した結果がどちらへ届くかを見分けられるよう 2 つとも返す。 */
function renderList(document: DesignDocument = setupDocument()): {
  add: ReturnType<typeof vi.fn>;
  reorder: ReturnType<typeof vi.fn>;
} {
  const add = vi.fn();
  const reorder = vi.fn();
  render(
    <ArtboardList
      selection={DocumentSelection.fromNames(document, [])}
      onSelect={vi.fn()}
      artboardActions={{ add, reorder }}
    />,
  );
  return { add, reorder };
}

test("見出しの追加ボタンを押すと追加が伝わる", async () => {
  const { add } = renderList();

  await userEvent.click(
    screen.getByRole("button", { name: "artboard を追加" }),
  );

  expect(add).toHaveBeenCalledTimes(1);
});

/*
 * 1 枚目を足す導線はここにしか無いので、空のときに追加ボタンを畳むと詰む
 * （「artboard がありません」の行だけが出て、そこから抜けられなくなる）。
 */
test("artboard が1枚も無くても追加ボタンは出る", () => {
  renderList(DesignDocument.create({ artboards: [] }));

  expect(screen.getByRole("button", { name: "artboard を追加" })).toBeDefined();
});

test("行を下へ動かすと今の位置と1つ後ろの位置が伝わる", async () => {
  const { reorder } = renderList();

  await userEvent.click(
    screen.getByRole("button", { name: "settings を下へ" }),
  );

  expect(reorder).toHaveBeenCalledWith({ fromIndex: 1, toIndex: 2 });
});

test("行を上へ動かすと今の位置と1つ前の位置が伝わる", async () => {
  const { reorder } = renderList();

  await userEvent.click(
    screen.getByRole("button", { name: "settings を上へ" }),
  );

  expect(reorder).toHaveBeenCalledWith({ fromIndex: 1, toIndex: 0 });
});

test("並びの先頭の行には上へ動かすボタンが出ない", () => {
  renderList();

  expect(screen.queryByRole("button", { name: "home を上へ" })).toBeNull();
});

/*
 * 末尾の行に `↓` が残ると、並びの外を指す移動を画面から作れてしまう
 * （`EditorState.reorderArtboard` の `none` に画面の操作から到達する）。
 * 先頭側だけを見ていると、行に渡す並びの長さを取り違えても気づけない。
 */
test("並びの末尾の行には下へ動かすボタンが出ない", () => {
  renderList();

  expect(screen.queryByRole("button", { name: "about を下へ" })).toBeNull();
});

/* UI 案（展開後 379〜382 行）が置いているのは `+` の 1 字。 */
test("追加のボタンには + が出る", () => {
  renderList();

  expect(
    screen.getByRole("button", { name: "artboard を追加" }).textContent,
  ).toBe("+");
});
