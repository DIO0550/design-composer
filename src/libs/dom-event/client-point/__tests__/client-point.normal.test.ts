import { expect, test } from "vitest";
import { ClientPoint } from "../index";

test("イベントの窓の座標が、そのまま位置になる", () => {
  expect(ClientPoint.fromEvent({ clientX: 40, clientY: 120 })).toEqual({
    x: 40,
    y: 120,
  });
});
