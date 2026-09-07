import type { Meta, StoryObj } from "@storybook/react-vite";
import { Option } from "@/utils/Option";
import { OverlayStage } from "../__stories__/overlay-stage";
import { SnapGuideOverlay } from "./index";

/** 揃った辺に引くガイド線（映し方は `OverlayStage` の doc を参照）。 */
const meta = {
  title: "features/canvas/ArtboardCanvas/SnapGuideOverlay",
  component: SnapGuideOverlay,
  parameters: { layout: "fullscreen" },
  decorators: [OverlayStage],
} satisfies Meta<typeof SnapGuideOverlay>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 左右の辺が揃ったとき。揃った 2 つの矩形をまたぐ縦線が立つ。 */
export const AlongSideEdges: Story = {
  name: "左右の辺が揃った",
  args: {
    guides: {
      horizontal: Option.some({ left: 159, top: 40, width: 2, height: 140 }),
      vertical: Option.none,
    },
  },
};

/** 縦横の両方で揃ったとき。軸ごとに 1 本ずつ出る。 */
export const AlongBothAxes: Story = {
  name: "縦横の両方で揃った",
  args: {
    guides: {
      horizontal: Option.some({ left: 159, top: 40, width: 2, height: 140 }),
      vertical: Option.some({ left: 60, top: 99, width: 240, height: 2 }),
    },
  },
};
