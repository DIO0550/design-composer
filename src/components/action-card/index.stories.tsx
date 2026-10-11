import type { Meta, StoryObj } from "@storybook/react-vite";
import { ExportFace, ImportFace } from "./__stories__/sample-faces";
import { ActionCard } from "./index";

/**
 * 押せるカード。配色の種類ごとと、押せないときを並べる。
 *
 * `<button>` は幅が auto だと中身の幅に縮むので、器はグリッドにして子を横へ引き伸ばす
 * （開始画面も 2 列のグリッドに置いている）。194px は開始画面でのカード 1 枚の幅。
 */
const meta = {
  title: "components/ActionCard",
  component: ActionCard,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="grid w-[194px]">
        <Story />
      </div>
    ),
  ],
  args: {
    face: ExportFace,
    onClick: () => {},
    disabled: false,
  },
} satisfies Meta<typeof ActionCard>;

export default meta;

type Story = StoryObj<typeof meta>;

/** いちばん勧めたい操作のカード。 */
export const Primary: Story = {
  name: "プライマリ",
  args: {
    face: ImportFace,
  },
};

/** 勧め分けをしない操作のカード。 */
export const Normal: Story = {
  name: "ノーマル",
};

/** 押させたくないとき。カード全体が薄くなる。 */
export const Disabled: Story = {
  name: "押せない",
  args: { disabled: true },
};
