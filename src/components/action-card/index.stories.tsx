import type { Meta, StoryObj } from "@storybook/react-vite";
import { ExportContent, ImportContent } from "./__stories__/sample-contents";
import { ActionCard } from "./index";

/**
 * 押せるカード。配色の種類ごとと、押せないときを並べる。
 *
 * `<button>` は幅が auto だと中身の幅に縮むので、器はグリッドにして子を横へ引き伸ばす
 * （開始画面も 2 列のグリッドに置いている）。194px は汎用の部品としてカードを置く代表的な幅。
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
    content: ExportContent,
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
    content: ImportContent,
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
