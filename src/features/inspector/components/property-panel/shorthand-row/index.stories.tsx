import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, screen, userEvent } from "storybook/test";
import { MixedPadding, UniformPadding } from "../__stories__/panel-controls";
import { PanelFrame } from "../__stories__/panel-frame";
import { ShorthandLabels, ShorthandRow } from "./index";

/**
 * 4 辺を 1 行にまとめた行。
 *
 * 畳んだ 2 欄・不揃い・辺ごとの 3 つを並べるのは、半幅セルのグリッドが崩れても
 * テストでは落ちないため（happy-dom は Tailwind を解決しない）。
 */
const meta = {
  title: "features/inspector/PropertyPanel/ShorthandRow",
  component: ShorthandRow,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <PanelFrame>
        <Story />
      </PanelFrame>
    ),
  ],
  args: { onEdit: fn() },
} satisfies Meta<typeof ShorthandRow>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 4 辺が揃っているとき。畳んだ 2 欄に同じ値が出る。 */
export const Uniform: Story = {
  name: "4 辺が揃っている",
  args: { shorthand: UniformPadding },
};

/** 揃っていないとき。どちらの辺の値を出しても食い違うので、欄は空で綴りが `不揃い` になる。 */
export const Mixed: Story = {
  name: "4 辺が揃っていない",
  args: { shorthand: MixedPadding },
};

/** 切り替えは `useState` なので、押した後の 2×2 は `play` を通さないと視覚差分に載らない。 */
export const PerEdge: Story = {
  name: "辺ごとに出したとき",
  args: { shorthand: MixedPadding },
  play: async () => {
    await userEvent.click(
      screen.getByRole("button", { name: ShorthandLabels.perEdge }),
    );
    await expect(
      screen.getByRole("combobox", { name: "Padding Top" }),
    ).toBeDefined();
  },
};
