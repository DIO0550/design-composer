import { afterEach, expect, test } from "vitest";
import {
  clearDrawn,
  drawNamed,
} from "@/features/editor/features/canvas/__tests__/canvas-measure";
import { Option } from "@/utils/Option";
import { DrawnBounds } from "../DrawnBounds";

/* 測定の差し替え方と後片付けが要る理由は `canvas-measure` の doc を見る。 */
afterEach(clearDrawn);

test("描かれている名前を指すと、その要素の矩形が返る", () => {
  drawNamed("home", { left: 12, top: 34, width: 200, height: 100 });

  expect(DrawnBounds.measure("home")).toEqual(
    Option.some({ left: 12, top: 34, width: 200, height: 100 }),
  );
});

test("複数の名前を指すと、すべてを含む最小の矩形が返る", () => {
  drawNamed("home", { left: 10, top: 20, width: 100, height: 50 });
  drawNamed("about", { left: 200, top: 300, width: 40, height: 60 });

  expect(DrawnBounds.enclosing(["home", "about"])).toEqual(
    Option.some({ left: 10, top: 20, width: 230, height: 340 }),
  );
});

test("矩形に重なって描かれているものだけを拾う", () => {
  drawNamed("home", { left: 0, top: 0, width: 100, height: 100 });
  drawNamed("about", { left: 500, top: 500, width: 100, height: 100 });

  const overlapping = DrawnBounds.collectOverlappingNames(["home", "about"], {
    left: 50,
    top: 50,
    width: 100,
    height: 100,
  });

  expect(overlapping).toEqual(["home"]);
});

test("拾った名前は渡された並びの順のまま返る", () => {
  // 文書順を返す実装と差が出るよう、DOM へ足す順を名前の並びと逆にする
  drawNamed("about", { left: 0, top: 0, width: 100, height: 100 });
  drawNamed("home", { left: 0, top: 0, width: 100, height: 100 });

  const overlapping = DrawnBounds.collectOverlappingNames(["home", "about"], {
    left: 0,
    top: 0,
    width: 100,
    height: 100,
  });

  expect(overlapping).toEqual(["home", "about"]);
});
