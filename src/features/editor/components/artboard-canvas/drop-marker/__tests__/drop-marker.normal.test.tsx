import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { DropMarker } from "../index";

/*
 * 挿入位置に引く線（docs/06-ui.md「ドロップ先は『どの Box の何番目の子になるか』を
 * ハイライトで提示する」）。線をどこへ引くかは実測した矩形がそのまま決める。
 */

/** 縦横で長さの違う矩形。正方形だと幅と高さを取り違えても気づけない。 */
const VerticalMarker = { left: 160, top: 40, width: 2, height: 120 };

function marker(): Element {
  return screen.getByTestId("drop-marker");
}

test("線は渡された矩形の位置へ置かれる", () => {
  render(<DropMarker bounds={VerticalMarker} />);

  expect(marker().getAttribute("style")).toContain("left: 160px");
});

test("線の太さと長さは渡された矩形のまま出る", () => {
  // 幅と高さを取り違えると、縦線が横線になる
  render(<DropMarker bounds={VerticalMarker} />);

  expect(marker().getAttribute("style")).toContain("width: 2px; height: 120px");
});

test("線は読み上げられない", () => {
  // 落ちる位置はラベル（`DropPositionLabel`）が文で伝えるので、線は繰り返さない
  render(<DropMarker bounds={VerticalMarker} />);

  expect(marker().getAttribute("aria-hidden")).toBe("true");
});
