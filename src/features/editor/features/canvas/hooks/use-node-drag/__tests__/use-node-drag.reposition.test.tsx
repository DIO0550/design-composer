import { expect, test } from "vitest";
import { harnessOutput } from "@/components/__tests__/harness-output";
import {
  canvasContent,
  drawn,
} from "@/features/editor/features/canvas/__tests__/canvas-elements";
import {
  movePointer,
  pressPointer,
  pressPointerHolding,
  releasePointer,
} from "@/features/editor/features/canvas/__tests__/canvas-gesture";
import { drawnAt } from "@/features/editor/features/canvas/__tests__/canvas-measure";
import { CanvasView } from "@/features/editor/features/canvas/domains/canvas-view";
import { renderHarness } from "./setup";

/**
 * `home` を原点に置き、`badge` を掴んだ時点の座標 (40, 24) に 20x20 で描く。`card` と
 * `title` は `badge` の運び先から離れた下側に置き、揃え先にならないようにする。
 */
function drawHomeAtOrigin(): void {
  drawnAt("home", { left: 0, top: 0, width: 360, height: 240 });
  drawnAt("card", { left: 0, top: 120, width: 200, height: 100 });
  drawnAt("title", { left: 0, top: 225, width: 300, height: 15 });
  drawnAt("badge", { left: 40, top: 24, width: 20, height: 20 });
}

/** `badge` を (100, 100) で掴み、`to` の上で (30, -12) 運んだ位置まで動かす。 */
function carryBadgeOnto(to: Element): void {
  pressPointer(drawn("badge"), { x: 100, y: 100 });
  movePointer(to, { x: 130, y: 88 });
}

test("絶対配置のノードを運んで離すと、掴んだ時点の座標から動いた分だけずれた座標が届く", () => {
  const { onReposition } = renderHarness();
  drawHomeAtOrigin();

  carryBadgeOnto(drawn("home"));
  releasePointer(drawn("home"), { x: 130, y: 88 });

  expect(onReposition.mock.calls).toEqual([
    [
      "badge",
      { parentName: "home", placement: { mode: "absolute", x: 70, y: 12 } },
    ],
  ]);
});

test("倍率を上げると、届く座標の動きは画面上ではなくドキュメント上の px になる", () => {
  const { onReposition } = renderHarness({ ...CanvasView.create(), scale: 2 });
  drawHomeAtOrigin();

  carryBadgeOnto(drawn("home"));
  releasePointer(drawn("home"), { x: 130, y: 88 });

  expect(onReposition.mock.calls).toEqual([
    [
      "badge",
      { parentName: "home", placement: { mode: "absolute", x: 55, y: 18 } },
    ],
  ]);
});

test("別の親の上で離すと、2 つの親の左上のずれを打ち消した座標が届く", () => {
  const { onReposition } = renderHarness();
  // settings の左上は home の左上から (400, 40) ずれている
  drawnAt("home", { left: 100, top: 60, width: 360, height: 240 });
  drawnAt("settings", { left: 500, top: 100, width: 360, height: 240 });
  drawnAt("badge", { left: 140, top: 84, width: 20, height: 20 });

  carryBadgeOnto(drawn("settings"));
  releasePointer(drawn("settings"), { x: 130, y: 88 });

  expect(onReposition.mock.calls).toEqual([
    [
      "badge",
      {
        parentName: "settings",
        placement: { mode: "absolute", x: -330, y: -28 },
      },
    ],
  ]);
});

test("運んでいる間、掴んだノードは運んだ分だけずれて見える", () => {
  renderHarness();
  drawHomeAtOrigin();

  carryBadgeOnto(drawn("home"));

  expect(harnessOutput("reposition-preview")).toBe("badge 30,-12");
});

test("落とせる親が無い場所へ運んでいる間も、掴んだノードは運んだ分だけずれて見える", () => {
  renderHarness();
  drawHomeAtOrigin();

  carryBadgeOnto(canvasContent());

  expect(harnessOutput("reposition-preview")).toBe("badge 30,-12");
});

test("落とせる親が無い場所で離すと置き直しは届かない", () => {
  const { onReposition } = renderHarness();
  drawHomeAtOrigin();

  carryBadgeOnto(canvasContent());
  releasePointer(canvasContent(), { x: 130, y: 88 });

  expect(onReposition).not.toHaveBeenCalled();
});

test("親の縁の近くまで運んで離すと、縁に揃う座標が届く", () => {
  const { onReposition } = renderHarness();
  drawHomeAtOrigin();

  // 左辺が x=3 まで来ると、home の左縁 x=0 との差 3px が閾値の内側に入る
  pressPointer(drawn("badge"), { x: 100, y: 100 });
  movePointer(drawn("home"), { x: 63, y: 100 });
  releasePointer(drawn("home"), { x: 63, y: 100 });

  expect(onReposition.mock.calls).toEqual([
    [
      "badge",
      { parentName: "home", placement: { mode: "absolute", x: 0, y: 24 } },
    ],
  ]);
});

test("⌘ を押しながら縁の近くまで運んで離すと、運んだ量そのままの座標が届く", () => {
  const { onReposition } = renderHarness();
  drawHomeAtOrigin();

  pressPointerHolding(drawn("badge"), { x: 100, y: 100 }, "meta");
  movePointer(drawn("home"), { x: 63, y: 100 }, "meta");
  releasePointer(drawn("home"), { x: 63, y: 100 });

  expect(onReposition.mock.calls).toEqual([
    [
      "badge",
      { parentName: "home", placement: { mode: "absolute", x: 3, y: 24 } },
    ],
  ]);
});

test("運んでいるノード自身の辺へは寄らない", () => {
  const { onReposition } = renderHarness();
  drawHomeAtOrigin();

  // 掴んだ時点の自分の左辺 x=40 からは 5px で閾値の内側だが、そこへ戻されない
  pressPointer(drawn("badge"), { x: 100, y: 100 });
  movePointer(drawn("home"), { x: 105, y: 100 });
  releasePointer(drawn("home"), { x: 105, y: 100 });

  expect(onReposition.mock.calls).toEqual([
    [
      "badge",
      { parentName: "home", placement: { mode: "absolute", x: 45, y: 24 } },
    ],
  ]);
});
