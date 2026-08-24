import type { Meta, StoryObj } from "@storybook/react-vite";
import { RightPaneShell } from "@/components/__stories__/right-pane-shell";
import { PaneBody } from "./index";

/**
 * 枠より確実に高くするための行。中身は問わないので通し番号にする。
 * 20 行で 32rem（`RightPaneShell` の `pane`）に収まらない。
 */
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
      <RightPaneShell height="pane">
        <Story />
      </RightPaneShell>
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
