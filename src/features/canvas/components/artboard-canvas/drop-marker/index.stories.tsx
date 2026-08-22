import type { Meta, StoryObj } from "@storybook/react-vite";
import { DropMarker } from "./index";

/**
 * ドロップ先を示す線。
 *
 * **キャンバスのストーリーには出てこない。** 運んでいる最中の姿を映すには
 * ポインタを押し下げたままにする必要があり、`ArtboardCanvas` のストーリーは
 * 静止した状態しか撮れないため。線の太さ・色を確かめる手段はここだけになる。
 *
 * 本番は `position: fixed` で実測した client 座標へ置くので、器は与えず
 * ビューポートの座標をそのまま使う。
 */
const meta = {
  title: "features/canvas/ArtboardCanvas/DropMarker",
  component: DropMarker,
  parameters: { layout: "fullscreen" },
  decorators: [
    // 線は白地だと見えるが、実画面はキャンバスの灰色の上に出る
    (Story) => (
      <div className="h-64 w-full bg-gray-100">
        <Story />
      </div>
    ),
  ],
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
