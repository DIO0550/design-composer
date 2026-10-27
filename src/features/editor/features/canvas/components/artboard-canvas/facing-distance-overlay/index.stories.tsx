import type { Meta, StoryObj } from "@storybook/react-vite";
import { SidePairs } from "@/domains/unit/side";
import { CanvasView } from "@/features/editor/features/canvas/domains/canvas-view";
import { Option } from "@/utils/Option";
import { OverlayStage } from "../__stories__/overlay-stage";
import { FacingDistanceOverlay } from "./index";

/** 運んでいる間の Alt / Option の距離（映し方は `OverlayStage` の doc を参照）。 */
const meta = {
  title: "features/editor/features/canvas/ArtboardCanvas/FacingDistanceOverlay",
  component: FacingDistanceOverlay,
  parameters: { layout: "fullscreen" },
  decorators: [OverlayStage],
} satisfies Meta<typeof FacingDistanceOverlay>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * 運んでいるもの（左右 150〜190・上下 100〜130）から、上・左・右の 3 向きに相手がいるとき。
 * 下は相手に接している。
 */
export const ThreeSides: Story = {
  name: "上・左・右の距離",
  args: {
    distances: {
      horizontal: {
        start: Option.some({
          along: SidePairs.Horizontal,
          at: 115,
          span: { min: 40, max: 150 },
        }),
        end: Option.some({
          along: SidePairs.Horizontal,
          at: 115,
          span: { min: 190, max: 360 },
        }),
      },
      vertical: {
        start: Option.some({
          along: SidePairs.Vertical,
          at: 170,
          span: { min: 20, max: 100 },
        }),
        end: Option.none,
      },
    },
    view: CanvasView.create(),
  },
};
