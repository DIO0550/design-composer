import type { Meta, StoryObj } from "@storybook/react-vite";
import { OverlayStage } from "../__stories__/overlay-stage";
import { RangeSelectOverlay } from "./index";

/**
 * 空き領域から引いている選択の範囲（映し方は `OverlayStage` の doc を参照）。
 * 引いている最中にしか出ないので、線の太さ・色・塗りの濃さを確かめる手段はここだけ。
 */
const meta = {
  title: "features/canvas/ArtboardCanvas/RangeSelectOverlay",
  component: RangeSelectOverlay,
  parameters: { layout: "fullscreen" },
  decorators: [OverlayStage],
} satisfies Meta<typeof RangeSelectOverlay>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 右下へ引いている途中。 */
export const Drawing: Story = {
  name: "範囲を引いている",
  args: { bounds: { left: 40, top: 30, width: 240, height: 140 } },
};

/** 細く引いたとき。塗りが薄いので、線が無いと辺を見失う。 */
export const Narrow: Story = {
  name: "細く引いている",
  args: { bounds: { left: 40, top: 30, width: 320, height: 24 } },
};
