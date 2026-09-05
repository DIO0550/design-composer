import userEvent from "@testing-library/user-event";
import { expect, test } from "vitest";
import {
  canvasContent,
  canvasSurface,
  stubBounds,
} from "@/features/canvas/__tests__";
import { drawn, renderOpenedDocument } from "./setup";

/*
 * キーボードから画面へ収めるところまでの通し（#419）。
 *
 * happy-dom はレイアウトを行わず矩形をすべて 0 で返すので、**測定を差し替えないと**
 * 収める側の「面積が無ければ何もしない」に落ちて、配線が切れていても通ってしまう
 * （差し替えの詳細は `canvas-measure` の doc）。
 */

/** キャンバスの土台。収める先になる。 */
const Surface = { left: 0, top: 0, width: 800, height: 600 };

/**
 * 2 枚の artboard が横に並んで描かれていることにする。
 * 全体は幅 1552・高さ 240 で、余白込みの 1600 × 288 として 0.5 倍で収まる。
 */
function drawArtboards(): void {
  stubBounds(canvasSurface(), Surface);
  stubBounds(drawn("home"), { left: 0, top: 0, width: 700, height: 240 });
  stubBounds(drawn("settings"), {
    left: 852,
    top: 0,
    width: 700,
    height: 240,
  });
}

test("Shift+1 を押すと文書全体が画面に収まる", async () => {
  const user = userEvent.setup();
  await renderOpenedDocument();
  drawArtboards();

  await user.keyboard("{Shift>}!{/Shift}");

  expect(canvasContent().style.transform).toBe(
    "translate(12px, 240px) scale(0.5)",
  );
});

test("Shift+2 を押すと選んでいるものが画面に収まる", async () => {
  const user = userEvent.setup();
  await renderOpenedDocument();
  await user.click(drawn("home-title"));
  /*
   * 選んだノードだけを収める。artboard 全体とは違う倍率・位置になる寸法にしてあるので、
   * 収める対象を選択ではなく全体にした実装だと落ちる。
   */
  drawArtboards();
  stubBounds(drawn("home-title"), {
    left: 40,
    top: 40,
    width: 1552,
    height: 40,
  });

  await user.keyboard("{Shift>}@{/Shift}");

  expect(canvasContent().style.transform).toBe(
    "translate(-8px, 270px) scale(0.5)",
  );
});

test("何も選んでいなければ Shift+2 では見え方が変わらない", async () => {
  // artboard は描かれているので、選択を見ずに全体へ倒す実装だと落ちる
  const user = userEvent.setup();
  await renderOpenedDocument();
  drawArtboards();

  await user.keyboard("{Shift>}@{/Shift}");

  expect(canvasContent().style.transform).toBe("translate(0px, 0px) scale(1)");
});
