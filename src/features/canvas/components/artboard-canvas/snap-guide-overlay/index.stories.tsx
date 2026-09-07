import type { Meta, StoryObj } from "@storybook/react-vite";
import { SnapGuideOverlay } from "./index";

/**
 * 揃った辺に引くガイド線。
 *
 * **キャンバスのストーリーには出てこない。** 運んでいる最中の姿を映すにはポインタを
 * 押し下げたままにする必要があり、`ArtboardCanvas` のストーリーは静止した状態しか
 * 撮れないため。線の太さ・色を確かめる手段はここだけになる（`DropMarker` と同じ）。
 *
 * 本番は `position: fixed` で実測した client 座標へ置くので、器は与えず
 * ビューポートの座標をそのまま使う。
 */
const meta = {
  title: "features/canvas/ArtboardCanvas/SnapGuideOverlay",
  component: SnapGuideOverlay,
  parameters: { layout: "fullscreen" },
  decorators: [
    // 線は白地だと見えるが、実画面はキャンバスの灰色の上に出る
    (Story) => (
      <div className="h-64 w-full bg-gray-100">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SnapGuideOverlay>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 左右の辺が揃ったとき。揃った 2 つの矩形をまたぐ縦線が立つ。 */
export const AlongSideEdges: Story = {
  name: "左右の辺が揃った",
  args: { guides: [{ left: 159, top: 40, width: 2, height: 140 }] },
};

/** 縦横の両方で揃ったとき。軸ごとに 1 本ずつ出る。 */
export const AlongBothAxes: Story = {
  name: "縦横の両方で揃った",
  args: {
    guides: [
      { left: 159, top: 40, width: 2, height: 140 },
      { left: 60, top: 99, width: 240, height: 2 },
    ],
  },
};
