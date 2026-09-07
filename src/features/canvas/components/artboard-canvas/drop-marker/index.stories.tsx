import type { Meta, StoryObj } from "@storybook/react-vite";
import { OverlayStage } from "../__stories__/overlay-stage";
import { DropMarker } from "./index";

/** ドロップ先を示す線（映し方は `OverlayStage` の doc を参照）。 */
const meta = {
  title: "features/canvas/ArtboardCanvas/DropMarker",
  component: DropMarker,
  parameters: { layout: "fullscreen" },
  decorators: [OverlayStage],
} satisfies Meta<typeof DropMarker>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 子が横に並ぶ親（`row`）へ落とすときの線。子と子の隙間に縦線が立つ。 */
export const BetweenColumns: Story = {
  name: "横並びの子の間",
  args: { bounds: { left: 160, top: 40, width: 2, height: 120 } },
};

/** 子が縦に並ぶ親（`column`）へ落とすときの線。 */
export const BetweenRows: Story = {
  name: "縦並びの子の間",
  args: { bounds: { left: 60, top: 100, width: 240, height: 2 } },
};
