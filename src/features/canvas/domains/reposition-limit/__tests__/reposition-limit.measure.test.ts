import { expect, test } from "vitest";
import { measuredAs } from "@/features/canvas/__tests__/canvas-measure";
import { Option } from "@/utils/Option";
import { RepositionLimit } from "../index";

/**
 * 親の中に置かれたノード。どちらも描かれた大きさを持たせる。
 *
 * @param size 親とノードの、描かれていることにする大きさ
 * @returns 親に入った状態のノードの要素
 */
function drawnInside(
  size: Readonly<{
    parent: Readonly<{ width: number; height: number }>;
    node: Readonly<{ width: number; height: number }>;
  }>,
): Element {
  const parent = measuredAs(document.createElement("div"), size.parent);
  const node = measuredAs(document.createElement("div"), size.node);
  parent.appendChild(node);
  return node;
}

test("上限は、親の内側から自分の大きさを引いた値になる", () => {
  const limit = RepositionLimit.fromElement(
    drawnInside({
      parent: { width: 360, height: 240 },
      node: { width: 44, height: 24 },
    }),
  );

  expect(Option.unwrap(limit)).toEqual({ maxX: 316, maxY: 216 });
});

test("自分のほうが親より大きい軸の上限は 0 になる", () => {
  // 横だけ親より大きくして、縦がその巻き添えにならないことも見る
  const limit = RepositionLimit.fromElement(
    drawnInside({
      parent: { width: 100, height: 240 },
      node: { width: 140, height: 24 },
    }),
  );

  expect(Option.unwrap(limit)).toEqual({ maxX: 0, maxY: 216 });
});

test("木から外れている要素は上限が決まらない", () => {
  const detached = measuredAs(document.createElement("div"), {
    width: 44,
    height: 24,
  });

  expect(RepositionLimit.fromElement(detached).some).toBe(false);
});

test("親の内側に大きさが無いときは上限が決まらない", () => {
  // ここで 0 を上限として答えると、収める側がノードを必ず親の左上へ張り付ける
  const limit = RepositionLimit.fromElement(
    drawnInside({
      parent: { width: 0, height: 0 },
      node: { width: 44, height: 24 },
    }),
  );

  expect(limit.some).toBe(false);
});
