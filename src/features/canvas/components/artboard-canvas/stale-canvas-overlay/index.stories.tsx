import type { Meta, StoryObj } from "@storybook/react-vite";
import { StaleCanvasOverlay } from "./index";

/**
 * ファイルが不正な間キャンバスへ重ねるもの（#135）。
 *
 * `ArtboardCanvas` の「ファイルが不正」ストーリーにも出るが、そちらでは artboard の
 * 上に薄く掛かるだけで斜線の間隔・角度を読み取れない。**斜線を落としてもバッジは残り、
 * テストは 1 件も落ちない**ので、斜線そのものを見る手段はこのストーリーになる。
 */
const meta = {
  title: "features/canvas/ArtboardCanvas/StaleCanvasOverlay",
  component: StaleCanvasOverlay,
  parameters: { layout: "fullscreen" },
  decorators: [
    // 本番はキャンバス（`relative`）の全面を覆うので、器にも基準を与える
    (Story) => (
      <div className="relative h-64 w-full bg-white">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StaleCanvasOverlay>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "斜線とバッジ",
};

/**
 * 下に中身がある状態。斜線が中身を覆っても読めることと、バッジが右上で浮くことを見る。
 */
export const OverContent: Story = {
  name: "キャンバスの中身に重なる",
  decorators: [
    (Story) => (
      <div className="relative h-64 w-full bg-gray-100 p-8">
        <div className="h-40 w-64 bg-white shadow-sm outline outline-gray-300" />
        <Story />
      </div>
    ),
  ],
};
