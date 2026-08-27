import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import {
  enterPointer,
  pressPointer,
} from "@/components/__tests__/pointer-gesture";
import { dragRowNamed, rowOf } from "@/components/__tests__/row-drag";
import { DropLineTestId } from "@/components/drop-line";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { DocumentSelection } from "@/domains/session/document-selection";
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
  list: HTMLElement;
  add: ReturnType<typeof vi.fn>;
  reorder: ReturnType<typeof vi.fn>;
} {
  const add = vi.fn();
  const reorder = vi.fn();
  const { container } = render(
    <ArtboardList
      selection={DocumentSelection.fromNames(document, [])}
      onSelect={vi.fn()}
      artboardActions={{ add, reorder }}
    />,
  );
  return { list: container, add, reorder };
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

test("行を後ろの行の上へ運ぶと今の位置と移す先が伝わる", () => {
  const { list, reorder } = renderList();

  dragRowNamed(list, { from: "settings", to: "about" });

  expect(reorder).toHaveBeenCalledWith({ fromIndex: 1, toIndex: 2 });
});

test("行を前の行の上へ運ぶと今の位置と移す先が伝わる", () => {
  const { list, reorder } = renderList();

  dragRowNamed(list, { from: "settings", to: "home" });

  expect(reorder).toHaveBeenCalledWith({ fromIndex: 1, toIndex: 0 });
});

test("掴んだ行の上で離しても移動は伝わらない", () => {
  const { list, reorder } = renderList();

  dragRowNamed(list, { from: "settings", to: "settings" });

  expect(reorder).not.toHaveBeenCalled();
});

test("運んでいる間は落ちる先が示される", () => {
  const { list } = renderList();

  pressPointer(rowOf(list, "home"), { x: 0, y: 0 });
  enterPointer(rowOf(list, "about"));

  expect(screen.getAllByTestId(DropLineTestId)).toHaveLength(1);
});

test("掴んだだけで動かしていない間は落ちる先が出ない", () => {
  const { list } = renderList();

  pressPointer(rowOf(list, "home"), { x: 0, y: 0 });

  expect(screen.queryByTestId(DropLineTestId)).toBeNull();
});

/* UI 案（展開後 379〜382 行）が置いているのは `+` の 1 字。 */
test("追加のボタンには + が出る", () => {
  renderList();

  expect(
    screen.getByRole("button", { name: "artboard を追加" }).textContent,
  ).toBe("+");
});
