import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import { SampleSyntaxError } from "@/features/editor/__tests__/document-errors";
import { ReceivedAt } from "@/features/editor/__tests__/instants";
import { EditorState } from "@/features/editor/domains/editor-state";
import { injectedStyles, renderCanvas } from "./setup";

/*
 * 外部編集でファイルが壊れている間のキャンバス（#135）。
 *
 * 掴める帯を出さないことと、選択の枠を残すことは対で決めた判断なので、
 * 片方だけを見ると（枠まで消す実装 / 帯を出したままの実装のどちらかが）通ってしまう。
 */

/** artboard を 1 枚だけ持ち、それを選んでいる状態。artboard は 2 軸とも fixed なので帯が出る。 */
function selectedArtboard(): EditorState {
  return EditorState.select(
    EditorState.create(
      DesignDocument.create({
        artboards: [{ name: "home", width: 360, height: 240, children: [] }],
      }),
    ),
    "home",
  );
}

/** 外部変更を拒んだあとの状態（画面はファイルと食い違ったまま）。 */
function frozen(state: EditorState): EditorState {
  return EditorState.applyReload(
    state,
    { kind: "rejected", errors: [SampleSyntaxError] },
    ReceivedAt,
  );
}

test("ファイルが不正な間は掴める帯を描かない", () => {
  renderCanvas({ state: frozen(selectedArtboard()) });

  expect(injectedStyles()).not.toContain('[data-name="home"]::after');
});

test("ファイルが不正でなければ選択中の artboard に掴める帯が出る", () => {
  renderCanvas({ state: selectedArtboard() });

  // 上のテストの対照。これが無いと、帯を一切描かない実装でも通ってしまう
  expect(injectedStyles()).toContain('[data-name="home"]::after');
});

test("ファイルが不正でも、選択の枠は残る", () => {
  renderCanvas({ state: frozen(selectedArtboard()) });

  expect(injectedStyles()).toContain('[data-name="home"]{outline:2px solid');
});

test("ファイルが不正な間はキーボードで artboard を活性化しても選択が起きない", async () => {
  const onSelect = vi.fn();
  renderCanvas({ state: frozen(selectedArtboard()), onSelect });

  /*
   * `inert` はフォーカスを拒むので、この focus は通らず Enter はどこにも届かない。
   * happy-dom が強制するのは focus までで click は届くため、押せないことまでは
   * ブラウザでしか確かめられない（対照は artboard-canvas.selection の
   * 「キーボードで artboard を活性化するとその artboard だけが候補になる」）。
   */
  screen.getByRole("button", { name: "home" }).focus();
  await userEvent.keyboard("{Enter}");

  expect(onSelect).not.toHaveBeenCalled();
});
