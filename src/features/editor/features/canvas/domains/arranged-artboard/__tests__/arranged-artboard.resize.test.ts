import { expect, test } from "vitest";
import { ArrangedArtboard } from "../index";
import { compiledArtboard } from "./setup";

/**
 * 座標を持たない `intro` / `home` / `about` と、座標を持つ `settings` の並び。
 *
 * @returns 4 枚の artboard の並び
 */
function setupArtboards() {
  return [
    compiledArtboard("intro", { width: 200, height: 100 }),
    compiledArtboard("home", { width: 200, height: 100 }),
    compiledArtboard("settings", { width: 200, height: 100 }, { x: 900, y: 0 }),
    compiledArtboard("about", { width: 200, height: 100 }),
  ];
}

test("後ろにある座標を持たない artboard は、幅につられて動く", () => {
  expect(
    ArrangedArtboard.isShiftedByWidth(setupArtboards(), {
      resized: 1,
      other: 3,
    }),
  ).toBe(true);
});

test("後ろにあっても座標を持つ artboard は、幅につられて動かない", () => {
  expect(
    ArrangedArtboard.isShiftedByWidth(setupArtboards(), {
      resized: 1,
      other: 2,
    }),
  ).toBe(false);
});

test("前にある座標を持たない artboard は、幅につられて動かない", () => {
  expect(
    ArrangedArtboard.isShiftedByWidth(setupArtboards(), {
      resized: 1,
      other: 0,
    }),
  ).toBe(false);
});
