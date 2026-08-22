import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";
import { DesignDocument } from "@/domains/design-document";
import { DocumentSelection } from "@/domains/document-selection";
import { injectedStyles, renderCanvas } from "./setup";

/*
 * 外部編集でファイルが壊れている間のキャンバス（#135）。
 *
 * 掴める帯を出さないことと、選択の枠を残すことは対で決めた判断なので、
 * 片方だけを見ると（枠まで消す実装 / 帯を出したままの実装のどちらかが）通ってしまう。
 */

/** artboard を 1 枚だけ持ち、それを選んでいる対。artboard は 2 軸とも fixed なので帯が出る。 */
function selectedArtboard(): DocumentSelection {
  return DocumentSelection.fromNames(
    DesignDocument.create({
      artboards: [{ name: "home", width: 360, height: 240, children: [] }],
    }),
    ["home"],
  );
}

test("ファイルが不正な間は掴める帯を描かない", () => {
  renderCanvas({ selection: selectedArtboard(), isFrozen: true });

  expect(injectedStyles()).not.toContain('[data-name="home"]::after');
});

test("ファイルが不正でなければ選択中の artboard に掴める帯が出る", () => {
  renderCanvas({ selection: selectedArtboard() });

  // 上のテストの対照。これが無いと、帯を一切描かない実装でも通ってしまう
  expect(injectedStyles()).toContain('[data-name="home"]::after');
});

test("ファイルが不正でも、選択の枠は残る", () => {
  renderCanvas({ selection: selectedArtboard(), isFrozen: true });

  expect(injectedStyles()).toContain('[data-name="home"]{outline:2px solid');
});

test("ファイルが不正な間はキーボードで artboard を活性化しても選択が起きない", async () => {
  const onSelect = vi.fn();
  renderCanvas({ selection: selectedArtboard(), isFrozen: true, onSelect });

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
