import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactElement } from "react";
import { PaneBody } from "./index";

/**
 * ペインの殻の代わり。高さを固定するのは、本文が `flex-1 min-h-0` で縦スクロールを
 * 受けていることを視覚差分に載せるため（高さの決まらない親では本文が伸び続ける）。
 * 殻が余白を持たないのも実画面と同じで、余白は本文が内側に持つ。
 *
 * @returns 受け取った本文を、高さの決まった縦並びの枠に入れたもの
 */
function PaneFrame({ children }: Readonly<{ children: ReactElement }>) {
  return (
    <div className="flex h-64 w-72 flex-col border border-gray-300 bg-white">
      {children}
    </div>
  );
}

/** 枠より確実に高くするための行。中身は問わないので通し番号にする。 */
const OverflowingRows = Array.from(
  { length: 20 },
  (_, index) => `行 ${index + 1}`,
);

/** 帯の下の本文。中身が枠に収まるかどうかで見え方が変わる。 */
const meta = {
  title: "components/PaneBody",
  component: PaneBody,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <PaneFrame>
        <Story />
      </PaneFrame>
    ),
  ],
} satisfies Meta<typeof PaneBody>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 収まっているとき。四辺の余白だけが見える。 */
export const Default: Story = {
  name: "中身が枠に収まる",
  args: { children: <p className="text-gray-900 text-sm">プロパティの中身</p> },
};

/** 収まらないとき。スクロールバーが出て、はみ出した分は枠の外へ出ない。 */
export const Overflowing: Story = {
  name: "中身が枠に収まらない",
  args: {
    children: (
      <ol className="flex flex-col gap-3 text-gray-900 text-sm">
        {OverflowingRows.map((row) => (
          <li key={row}>{row}</li>
        ))}
      </ol>
    ),
  },
};
