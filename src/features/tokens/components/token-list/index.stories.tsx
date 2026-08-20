import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import {
  NoTokenSelection,
  sampleTokenSelection,
} from "@/features/tokens/__stories__/sample-token-document";
import { TokenList } from "./index";

const meta = {
  title: "features/tokens/TokenList",
  component: TokenList,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="w-64 border border-gray-300 bg-white">
        <Story />
      </div>
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
