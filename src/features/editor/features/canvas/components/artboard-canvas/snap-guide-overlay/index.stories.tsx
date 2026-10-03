import type { Meta, StoryObj } from "@storybook/react-vite";
import { CanvasView } from "@/features/editor/features/canvas/domains/canvas-view";
import { Option } from "@/utils/Option";
import { OverlayStage } from "../__stories__/overlay-stage";
import { SnapGuideOverlay } from "./index";

/** 揃った線（辺か中心線）に引くガイド線と、揃え先との隙間（映し方は `OverlayStage` の doc を参照）。 */
const meta = {
  title: "features/editor/features/canvas/ArtboardCanvas/SnapGuideOverlay",
  component: SnapGuideOverlay,
  parameters: { layout: "fullscreen" },
  decorators: [OverlayStage],
} satisfies Meta<typeof SnapGuideOverlay>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 左右の辺が揃ったとき。揃った 2 つの矩形をまたぐ縦線が立つ。揃え先とは重なっている。 */
export const AlongSideEdges: Story = {
  name: "左右の辺が揃った",
  args: {
    guides: {
      horizontal: Option.some({
        guideLine: { left: 159, top: 40, width: 2, height: 140 },
        gapLine: Option.none,
      }),
      vertical: Option.none,
    },
    view: CanvasView.create(),
  },
};

/** 縦横の両方で揃ったとき。軸ごとに 1 本ずつ出る。揃え先とはどちらも重なっている。 */
export const AlongBothAxes: Story = {
  name: "縦横の両方で揃った",
  args: {
    guides: {
      horizontal: Option.some({
        guideLine: { left: 159, top: 40, width: 2, height: 140 },
        gapLine: Option.none,
      }),
      vertical: Option.some({
        guideLine: { left: 60, top: 99, width: 240, height: 2 },
        gapLine: Option.none,
      }),
    },
    view: CanvasView.create(),
  },
};

/**
 * 揃え先と縦横それぞれに離れているとき。隙間に短い線が引かれ、その中点に隙間の数値が出る。
 * 縦の隙間は向かい合う範囲の中央（ガイド線とは別の位置）、横の隙間はガイド線に重なる位置。
 */
export const WithGaps: Story = {
  name: "揃え先との隙間の数値",
  args: {
    guides: {
      horizontal: Option.some({
        guideLine: { left: 159, top: 40, width: 2, height: 160 },
        gapLine: Option.some({ left: 179, top: 80, width: 2, height: 64 }),
      }),
      vertical: Option.some({
        guideLine: { left: 60, top: 199, width: 280, height: 2 },
        gapLine: Option.some({ left: 200, top: 199, width: 100, height: 2 }),
      }),
    },
    view: CanvasView.create(),
  },
};
