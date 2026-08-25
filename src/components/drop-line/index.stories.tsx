import type { Meta, StoryObj } from "@storybook/react-vite";
import { DropLine } from "./index";

/**
 * 並べ替えで落ちる先を示す線。
 *
 * **左ペインのストーリーには出てこない。** 運んでいる最中の姿を映すにはポインタを
 * 押し下げたままにする必要があり、`ArtboardList` / `DocumentTree` のストーリーは
 * 静止した状態しか撮れないため。線の太さ・色を確かめる手段はここだけになる
 * （キャンバスの `DropMarker` が同じ理由で自分のストーリーを持っているのと同じ形）。
 *
 * 本番は行の枠（`position: relative`）へ重ねるので、器として行を模した枠を与える。
 */
const meta = {
  title: "components/DropLine",
  component: DropLine,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="relative flex h-8 w-56 items-center rounded bg-white px-2 text-sm">
        行
        <Story />
      </div>
    ),
  ],
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
