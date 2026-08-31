import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import type { CompiledArtboard } from "@/domains/compiled/compiled-artboard";
import { BoxElement } from "@/domains/compiled/compiled-element";
import { ArtboardLabel } from "../index";

/*
 * artboard の見出し（UI 案 docs/Design Composer.html の `login 720 × 900`）。
 * 今見ている 1 枚かどうかの色の差は Tailwind の class にしか出ないので、
 * ここが持てるのは何が並ぶかまで（色は index.stories.tsx の視覚差分が見る）。
 */

function setupArtboard(): CompiledArtboard {
  return {
    element: BoxElement.create("login", [], []),
    width: 720,
    height: 900,
  };
}

test("見出しには artboard の名前が出る", () => {
  render(
    <ArtboardLabel
      artboard={setupArtboard()}
      isCurrent={false}
      onGrab={() => {}}
    />,
  );

  expect(screen.getByText("login")).toBeDefined();
});

test("名前の右に大きさが並ぶ", () => {
  // UI 案はキャンバス側だけ `720 × 900` と空白を入れる（ツリー側は `720×900`）
  render(
    <ArtboardLabel
      artboard={setupArtboard()}
      isCurrent={false}
      onGrab={() => {}}
    />,
  );

  expect(screen.getByText("720 × 900")).toBeDefined();
});

test("今見ている 1 枚かどうかで名前の姿が変わる", () => {
  /*
   * 色そのものは Tailwind の class でしか表れず happy-dom では読めないので、
   * 確かめるのは 2 つの入力で姿が変わることまで。
   */
  const { unmount } = render(
    <ArtboardLabel artboard={setupArtboard()} isCurrent onGrab={() => {}} />,
  );
  const current = screen.getByText("login").className;
  unmount();
  render(
    <ArtboardLabel
      artboard={setupArtboard()}
      isCurrent={false}
      onGrab={() => {}}
    />,
  );

  expect(screen.getByText("login").className).not.toBe(current);
});

test("大きさの姿は今見ている 1 枚かどうかで変わらない", () => {
  // UI 案は選択中でも大きさの font-weight を明示している（太くしない）
  const { unmount } = render(
    <ArtboardLabel artboard={setupArtboard()} isCurrent onGrab={() => {}} />,
  );
  const current = screen.getByText("720 × 900").className;
  unmount();
  render(
    <ArtboardLabel
      artboard={setupArtboard()}
      isCurrent={false}
      onGrab={() => {}}
    />,
  );

  expect(screen.getByText("720 × 900").className).toBe(current);
});
