import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { LeftPaneShell } from "@/components/__stories__/left-pane-shell";
import { SearchField } from "./index";

const meta = {
  title: "components/SearchField",
  component: SearchField,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <LeftPaneShell>
        <div className="p-3">
          <Story />
        </div>
      </LeftPaneShell>
    ),
  ],
  args: { label: "Search layers", onChange: fn() },
} satisfies Meta<typeof SearchField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  name: "語が入っていない",
  args: { value: "" },
};

/**
 * 語が入った状態。打った語を消すしるしは欄自身が出すので、ここには描いていない
 * （docs/06-ui.md「絞り込み」）。
 */
export const Filled: Story = {
  name: "語が入っている",
  args: { value: "login" },
};
