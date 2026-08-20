import type { Meta, StoryObj } from "@storybook/react-vite";
import { sampleTokenSelection } from "@/features/tokens/__stories__/sample-token-document";
import { TokenDashedNodes } from "./index";

/**
 * 帯は灰色のキャンバス面に影付きで浮く部品なので、decorator で面と余白を与える。
 * 白地に置くと影と角丸が沈み、実画面と違うものが視覚差分の基準になる。
 */
const meta = {
  title: "features/tokens/TokenDashedNodes",
  component: TokenDashedNodes,
  decorators: [
    (Story) => (
      <div className="flex bg-gray-100 p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TokenDashedNodes>;

export default meta;

type Story = StoryObj<typeof meta>;

/** キャンバス上で `primary` を指しているのは `home-panel` の 1 件だけ（単数形が出る）。 */
export const Single: Story = {
  name: "参照が1件",
  args: {
    selection: sampleTokenSelection({ kind: "colors", name: "primary" }),
  },
};

/** `gray-900` は 2 つの Text から指されている（複数形が出る）。 */
export const Multiple: Story = {
  name: "参照が複数",
  args: {
    selection: sampleTokenSelection({ kind: "colors", name: "gray-900" }),
  },
};

/** 色以外は見本を持たない（`token-editor` の見出しと同じ扱い）。 */
export const NonColor: Story = {
  name: "色以外のトークン",
  args: {
    selection: sampleTokenSelection({ kind: "typography", name: "heading" }),
  },
};
