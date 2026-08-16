import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { SampleEditorState } from "@/features/editor/__stories__/sample-editor-state";
import { EditorState } from "@/features/editor/domains/editor-state";
import { TokenList } from "./index";

const meta = {
  title: "features/editor/TokenList",
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
  args: { state: SampleEditorState },
};

export const ColorSelected: Story = {
  name: "色トークンを選択中",
  args: {
    state: EditorState.selectToken(SampleEditorState, {
      kind: "colors",
      name: "primary",
    }),
  },
};
