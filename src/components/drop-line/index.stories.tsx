import type { Meta, StoryObj } from "@storybook/react-vite";
import { DropLine, ListOrientations } from "./index";

/**
 * 並べ替えで落ちる先を示す線。
 *
 * 左ペインやタブ列のストーリーは掴んでいない状態しか描かないので、線の見た目を視覚差分で
 * 守るのはこのストーリーだけ。
 *
 * 本番は行やタブの枠（`position: relative`）へ重ねるので、器としてその枠を模したものを
 * 与える。縦に積む並びは行、横に並べる並びはタブの大きさにする。
 */
const meta = {
  title: "components/DropLine",
  component: DropLine,
  parameters: { layout: "padded" },
  decorators: [
    (Story, { args }) =>
      args.listOrientation === ListOrientations.Vertical ? (
        <div className="relative flex h-8 w-56 items-center rounded bg-white px-2 text-sm">
          行
          <Story />
        </div>
      ) : (
        <div className="relative flex h-8 w-28 items-center bg-[#f0f0f0] px-[10px] text-[11px]">
          タブ
          <Story />
        </div>
      ),
  ],
  args: { listOrientation: ListOrientations.Vertical },
} satisfies Meta<typeof DropLine>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 前へ動かしているとき。入った行の手前に落ちるので、線は上の縁に出る。 */
export const Before: Story = {
  name: "前へ動かしている",
  args: { side: "before" },
};

/** 後ろへ動かしているとき。入った行の後ろに落ちるので、線は下の縁に出る。 */
export const After: Story = {
  name: "後ろへ動かしている",
  args: { side: "after" },
};

/** 横に並べる並びで前へ動かしているとき。入ったタブの左の縁に出る。 */
export const HorizontalBefore: Story = {
  name: "横並びで前へ動かしている",
  args: { side: "before", listOrientation: ListOrientations.Horizontal },
};

/** 横に並べる並びで後ろへ動かしているとき。入ったタブの右の縁に出る。 */
export const HorizontalAfter: Story = {
  name: "横並びで後ろへ動かしている",
  args: { side: "after", listOrientation: ListOrientations.Horizontal },
};
