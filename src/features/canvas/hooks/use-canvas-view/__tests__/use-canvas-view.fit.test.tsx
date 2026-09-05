import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test } from "vitest";
import {
  clearDrawn,
  drawNamed,
  stubBounds,
} from "@/features/canvas/__tests__/canvas-measure";
import { CanvasView } from "@/features/canvas/domains/canvas-view";
import { useCanvasView } from "../index";

/*
 * 名前で指したものを画面へ収める操作。
 *
 * 測定を差し替えないと土台も対象も 0 × 0 になり、`fitTo` の「面積が無ければ何もしない」に
 * 全入力が落ちて実装を何に壊しても通る（差し替えの詳細は `canvas-measure` の doc）。
 */

afterEach(clearDrawn);

/** キャンバスの土台の矩形。左上を 0 以外にして、土台からの相対に直していることが見える。 */
const Surface = { left: 100, top: 50, width: 800, height: 600 };

/**
 * フックを DOM へ繋ぎ、収める操作を押せるようにした器。
 * 収める対象は器ごとに変えたいので props で受ける。
 */
function FitHarness({ names }: Readonly<{ names: readonly string[] }>) {
  const { view, surfaceRef, fitTo } = useCanvasView();

  return (
    <>
      <div
        data-testid="surface"
        ref={(element) => {
          if (element !== null) {
            stubBounds(element, Surface);
          }
          surfaceRef.current = element;
        }}
      />
      <p data-testid="transform">{CanvasView.transform(view)}</p>
      <button type="button" onClick={() => fitTo(names)}>
        収める
      </button>
    </>
  );
}

function transform(): string {
  return screen.getByTestId("transform").textContent ?? "";
}

async function pressFit(): Promise<void> {
  await userEvent.click(screen.getByRole("button", { name: "収める" }));
}

test("名前で指したものが収まる倍率と位置になる", async () => {
  // 等倍・原点で描かれている 1552 × 352 を、余白込みの 1600 × 400 として 0.5 倍で収める
  drawNamed("home", { left: 100, top: 50, width: 1552, height: 352 });
  render(<FitHarness names={["home"]} />);

  await pressFit();

  expect(transform()).toBe("translate(12px, 212px) scale(0.5)");
});

test("複数の名前を渡すと、すべてを含む範囲に収まる", async () => {
  /*
   * 1 枚目だけなら 4 倍まで寄れる小さい矩形を置き、2 枚目で範囲を広げる。
   * 片方しか見ない実装だと倍率が変わるので落ちる。
   */
  drawNamed("home", { left: 100, top: 50, width: 20, height: 20 });
  drawNamed("about", { left: 100, top: 50, width: 1552, height: 352 });
  render(<FitHarness names={["home", "about"]} />);

  await pressFit();

  expect(transform()).toBe("translate(12px, 212px) scale(0.5)");
});

test("描かれていない名前が混ざっていても、描かれているぶんで収まる", async () => {
  drawNamed("home", { left: 100, top: 50, width: 1552, height: 352 });
  render(<FitHarness names={["home", "描かれていない"]} />);

  await pressFit();

  expect(transform()).toBe("translate(12px, 212px) scale(0.5)");
});

test("どれも描かれていなければ見え方は変わらない", async () => {
  // 対照として 1 枚描いておく。名前で絞れていない実装だとこちらへ収まって落ちる
  drawNamed("home", { left: 100, top: 50, width: 1552, height: 352 });
  render(<FitHarness names={["描かれていない"]} />);

  await pressFit();

  expect(transform()).toBe("translate(0px, 0px) scale(1)");
});

test("収める対象を 1 つも渡さなければ見え方は変わらない", async () => {
  drawNamed("home", { left: 100, top: 50, width: 1552, height: 352 });
  render(<FitHarness names={[]} />);

  await pressFit();

  expect(transform()).toBe("translate(0px, 0px) scale(1)");
});
