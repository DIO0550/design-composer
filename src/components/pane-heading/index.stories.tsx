import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactElement } from "react";
import { PaneHeading } from "./index";

/**
 * ペインの殻の代わり。幅だけを与え、余白は持たない（帯の下線がペインの両端まで
 * 届くことを視覚差分に載せるため）。
 *
 * @returns 受け取った帯を、ペインの幅の枠に入れたもの
 */
function PaneFrame({ children }: Readonly<{ children: ReactElement }>) {
  return <div className="w-72 border border-gray-300 bg-white">{children}</div>;
}

/** ペインの見出しの帯。中身の有無で 2 通りある。 */
const meta = {
  title: "components/PaneHeading",
  component: PaneHeading,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <PaneFrame>
        <Story />
      </PaneFrame>
    ),
  ],
} satisfies Meta<typeof PaneHeading>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 中身が並ぶとき。要素の間隔と左右の余白が見える。 */
export const Default: Story = {
  name: "中身が並ぶ",
  args: {
    children: (
      <>
        <span className="text-[#00a0a0]">□</span>
        <span className="min-w-0 flex-1 truncate font-semibold text-gray-900 text-sm">
          login-form
        </span>
        <span className="text-gray-400 text-xs">Box</span>
      </>
    ),
  },
};

/**
 * 中身が空のとき。何も選んでいない状態がこれで、帯だけが高さを保って残る
 * （消すと選択のたびに本文の位置が帯のぶん動く）。
 */
export const Empty: Story = {
  name: "中身が空",
  args: { children: null },
};
