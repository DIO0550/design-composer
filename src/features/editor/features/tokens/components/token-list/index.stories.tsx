import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, screen, userEvent } from "storybook/test";
import { LeftPaneShell } from "@/components/__stories__/left-pane-shell";
import {
  NoTokenSelection,
  sampleTokenSelection,
} from "@/features/editor/features/tokens/__stories__/sample-token-document";
import { TokenList } from "./index";

const meta = {
  title: "features/editor/features/tokens/TokenList",
  component: TokenList,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <LeftPaneShell>
        <Story />
      </LeftPaneShell>
    ),
  ],
  args: { onSelectToken: fn(), onAddToken: fn() },
} satisfies Meta<typeof TokenList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "colors だけが開いている",
  args: { selection: NoTokenSelection },
};

export const ColorSelected: Story = {
  name: "色トークンを選択中",
  args: {
    selection: sampleTokenSelection({ kind: "colors", name: "primary" }),
  },
};

/**
 * 開いた直後は colors しか開かないので、グラデーションの見本と、値が名前を押し出さない
 * ことは `play` を通さないと視覚差分に載らない。
 */
export const GradientsOpen: Story = {
  name: "gradients を開いている",
  args: { selection: NoTokenSelection },
  play: async () => {
    await userEvent.click(
      screen.getByRole("button", { name: /gradients/, expanded: false }),
    );
    await expect(screen.getByRole("button", { name: /brand/ })).toBeDefined();
  },
};
