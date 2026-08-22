import type { Meta, StoryObj } from "@storybook/react-vite";
import { AxisLength } from "@/domains/axis-length";
import { ElementNameAttribute } from "@/domains/compiled-element";
import { ResizeHandleStyle } from "./index";

/**
 * 選択中の要素に出すリサイズハンドル（docs/06-ui.md「リサイズハンドル」）。
 *
 * ハンドルは擬似要素なので `<style>` を差し込むだけで、この部品自身は何も描かない。
 * **当たった相手**を見るために、キャンバスの中身と同じ形（名前の属性を持つ div）を
 * 器として敷いている。
 *
 * `ArtboardCanvas` の「artboard を選択中」でも見えるが、そちらは倍率 1 のみ。
 * 帯の太さを倍率で割り戻していることは、倍率違いを並べないと確かめられない。
 */
const meta = {
  title: "features/canvas/ArtboardCanvas/ResizeHandleStyle",
  component: ResizeHandleStyle,
  parameters: { layout: "fullscreen" },
  args: { name: "home" },
  decorators: [
    (Story) => (
      <div className="h-56 bg-gray-100 p-8">
        <div
          {...{ [ElementNameAttribute]: "home" }}
          className="h-32 w-56 bg-white shadow-sm outline-2 outline-blue-500"
        />
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ResizeHandleStyle>;

export default meta;

type Story = StoryObj<typeof meta>;

/** artboard は 2 軸とも fixed なので、右辺と下辺の両方に帯が出る。 */
export const BothAxes: Story = {
  name: "幅と高さの両方",
  args: {
    handles: [
      AxisLength.create("width", 224),
      AxisLength.create("height", 128),
    ],
    scale: 1,
  },
};

/** 幅だけが fixed のノード。右辺にだけ帯が出る。 */
export const WidthOnly: Story = {
  name: "幅だけ",
  args: { handles: [AxisLength.create("width", 224)], scale: 1 },
};

/**
 * 倍率を上げた状態。
 *
 * 帯の太さは倍率で割り戻すので、**中身が 2 倍に描かれても帯は見た目で同じ太さ**になる
 * （掴める帯は画面上の px で当たるため）。器は倍率を掛けていないので、ここでは
 * 帯が半分の太さで出るのが正しい姿。
 */
export const Zoomed: Story = {
  name: "倍率 2 倍",
  args: {
    handles: [
      AxisLength.create("width", 224),
      AxisLength.create("height", 128),
    ],
    scale: 2,
  },
};
