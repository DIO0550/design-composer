import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { CanvasView } from "@/features/editor/features/canvas/domains/canvas-view";
import { Option } from "@/utils/Option";
import { SnapGuideOverlay } from "../index";

/*
 * 揃った線（辺か中心線）に引くガイド線と、揃え先との隙間（docs/06-ui.md「キャンバス直接操作」
 * の辺のスナップ）。どこへ引くかは実測から `side-snap` が決めるので、ここが見るのは渡された
 * 矩形をそのまま線として出すかどうかと、隙間の数値をどの単位で出すか。
 */

/** 等倍の表示。画面上の長さがそのままドキュメント上の長さになる。 */
const SameSize = CanvasView.create();

/** 揃え先の左辺（250）に中心を合わせた縦の線。左右の辺（水平の組）が揃った側。 */
const VerticalLine = { left: 249, top: 150, width: 2, height: 90 };

/** 揃え先の上辺（150）に中心を合わせた横の線。上下の辺（垂直の組）が揃った側。 */
const HorizontalLine = { left: 200, top: 149, width: 120, height: 2 };

/** 縦の線に沿って測った隙間の短い線（長さ 64）。 */
const VerticalGap = { left: 259, top: 176, width: 2, height: 64 };

/** 横の線に沿って測った隙間の短い線（長さ 48）。 */
const HorizontalGap = { left: 272, top: 159, width: 48, height: 2 };

/** 揃え先と重なっていて、隙間を持たない縦の線。 */
const VerticalOnly = Option.some({
  guideLine: VerticalLine,
  gapLine: Option.none,
});

/** 揃え先と重なっていて、隙間を持たない横の線。 */
const HorizontalOnly = Option.some({
  guideLine: HorizontalLine,
  gapLine: Option.none,
});

test("揃った線の数だけガイド線が出る", () => {
  render(
    <SnapGuideOverlay
      guides={{ horizontal: VerticalOnly, vertical: HorizontalOnly }}
      view={SameSize}
    />,
  );

  expect(screen.queryAllByTestId("snap-guide")).toHaveLength(2);
});

test("縦の線は渡された矩形の位置と長さで出る", () => {
  // 幅と高さを取り違えると、縦線が横線になる
  render(
    <SnapGuideOverlay
      guides={{ horizontal: VerticalOnly, vertical: Option.none }}
      view={SameSize}
    />,
  );

  expect(
    screen.queryAllByTestId("snap-guide")[0].getAttribute("style"),
  ).toContain("left: 249px; top: 150px; width: 2px; height: 90px");
});

test("横の線は渡された矩形の位置と長さで出る", () => {
  render(
    <SnapGuideOverlay
      guides={{ horizontal: Option.none, vertical: HorizontalOnly }}
      view={SameSize}
    />,
  );

  expect(
    screen.queryAllByTestId("snap-guide")[0].getAttribute("style"),
  ).toContain("left: 200px; top: 149px; width: 120px; height: 2px");
});

test("揃った線が無ければガイド線は 1 本も出ない", () => {
  render(
    <SnapGuideOverlay
      guides={{ horizontal: Option.none, vertical: Option.none }}
      view={SameSize}
    />,
  );

  expect(screen.queryAllByTestId("snap-guide")).toHaveLength(0);
});

test("線は読み上げられない", () => {
  // 揃ったことは辺が実際に揃うことで伝わるので、読み上げでは繰り返さない
  render(
    <SnapGuideOverlay
      guides={{ horizontal: VerticalOnly, vertical: Option.none }}
      view={SameSize}
    />,
  );

  expect(
    screen.queryAllByTestId("snap-guide")[0].getAttribute("aria-hidden"),
  ).toBe("true");
});

test("縦の隙間の短い線は渡された矩形の位置と長さで出る", () => {
  render(
    <SnapGuideOverlay
      guides={{
        horizontal: Option.some({
          guideLine: VerticalLine,
          gapLine: Option.some(VerticalGap),
        }),
        vertical: Option.none,
      }}
      view={SameSize}
    />,
  );

  expect(screen.getByTestId("snap-gap").getAttribute("style")).toContain(
    "left: 259px; top: 176px; width: 2px; height: 64px",
  );
});

test("横の隙間の短い線は渡された矩形の位置と長さで出て、数値は短い線の幅になる", () => {
  // 揃いのキーを取り違えて長さを測ると、数値が線の太さ（2）になる
  render(
    <SnapGuideOverlay
      guides={{
        horizontal: Option.none,
        vertical: Option.some({
          guideLine: HorizontalLine,
          gapLine: Option.some(HorizontalGap),
        }),
      }}
      view={SameSize}
    />,
  );

  expect(screen.getByTestId("snap-gap").getAttribute("style")).toContain(
    "left: 272px; top: 159px; width: 48px; height: 2px",
  );
  expect(screen.getByTestId("snap-gap-label").textContent).toBe("48");
});

test("隙間の数値は、倍率で割り戻したドキュメント上の px で出る", () => {
  // 画面上は 64。割り戻さない実装だと 64 のまま出る
  render(
    <SnapGuideOverlay
      guides={{
        horizontal: Option.some({
          guideLine: VerticalLine,
          gapLine: Option.some(VerticalGap),
        }),
        vertical: Option.none,
      }}
      view={{ ...SameSize, scale: 2 }}
    />,
  );

  expect(screen.getByTestId("snap-gap-label").textContent).toBe("32");
});

test("揃え先との隙間が無いときは、ガイド線だけが出て隙間の線も数値も出ない", () => {
  // ガイド線が出ていることを対照に置き、隙間の側だけが消えることを見る
  render(
    <SnapGuideOverlay
      guides={{ horizontal: VerticalOnly, vertical: Option.none }}
      view={SameSize}
    />,
  );

  expect(screen.getAllByTestId("snap-guide")).toHaveLength(1);
  expect(screen.queryAllByTestId("snap-gap")).toHaveLength(0);
});

test("隙間の線と数値は読み上げられない", () => {
  // 数値は運んでいる最中にだけ一瞬出る手がかりで、離した結果は座標の欄で読める
  render(
    <SnapGuideOverlay
      guides={{
        horizontal: Option.some({
          guideLine: VerticalLine,
          gapLine: Option.some(VerticalGap),
        }),
        vertical: Option.none,
      }}
      view={SameSize}
    />,
  );

  expect(screen.getByTestId("snap-gap").getAttribute("aria-hidden")).toBe(
    "true",
  );
});
