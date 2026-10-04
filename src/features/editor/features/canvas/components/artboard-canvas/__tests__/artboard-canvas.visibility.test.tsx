import { within } from "@testing-library/react";
import { expect, test } from "vitest";
import {
  artboardFrameContainer,
  artboardHandle,
  canvasContent,
  hasArtboardHandle,
} from "@/features/editor/features/canvas/__tests__/canvas-elements";
import { renderCanvas, selectionFromArtboards } from "./setup";

/**
 * 表示の `home`、非表示の `draft`、その後ろに座標を持たない `about` を並べる。
 *
 * @returns その並びを持つドキュメントと、`draft` を選んだ対
 */
function setupWithHiddenArtboard() {
  return selectionFromArtboards(
    [
      { name: "home", width: 360, height: 240, children: [] },
      {
        name: "draft",
        width: 360,
        height: 240,
        props: { visibility: "hidden" },
        children: [],
      },
      { name: "about", width: 360, height: 240, children: [] },
    ],
    ["draft"],
  );
}

test("非表示の artboard は、選んでいても枠がキャンバスに描かれない", () => {
  renderCanvas({ selection: setupWithHiddenArtboard() });

  // 対照: 同じ画面の表示の artboard は描かれている
  within(canvasContent()).getByRole("button", { name: "home" });
  expect(
    within(canvasContent()).queryByRole("button", { name: "draft" }),
  ).toBeNull();
});

test("非表示の artboard は、見出しもキャンバスに描かれない", () => {
  renderCanvas({ selection: setupWithHiddenArtboard() });

  // 対照: 同じ画面の表示の artboard の見出しは描かれている
  artboardHandle("home");
  expect(hasArtboardHandle("draft")).toBe(false);
});

test("非表示の artboard の後ろの自動配置の artboard は、隠す前と同じ位置に描かれる", () => {
  renderCanvas({ selection: setupWithHiddenArtboard() });

  // 360 + 32 + 360 + 32（隠した artboard の幅と間隔も数える）
  expect(artboardFrameContainer(canvasContent(), "about").style.left).toBe(
    "784px",
  );
});

test("いちばん右下の artboard を隠すと、座標平面は表示の artboard だけを囲む大きさになる", () => {
  const selection = selectionFromArtboards([
    { name: "home", width: 360, height: 240, children: [] },
    {
      name: "placed",
      width: 360,
      height: 240,
      canvasPosition: { x: 900, y: 300 },
      props: { visibility: "hidden" },
      children: [],
    },
  ]);

  renderCanvas({ selection });

  const plane = artboardFrameContainer(canvasContent(), "home").parentElement;
  expect([plane?.style.width, plane?.style.height]).toEqual(["360px", "240px"]);
});
