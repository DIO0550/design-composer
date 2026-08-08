import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { SAMPLE_EDITOR_STATE } from "@/features/editor/__stories__/sample-editor-state";
import { EditorState } from "@/features/editor/domains/editor-state";
import { TokenEditor } from "./index";

const meta = {
  title: "features/editor/TokenEditor",
  component: TokenEditor,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="w-72 border border-gray-300 bg-white p-3">
        <Story />
      </div>
    ),
  ],
  args: {
    onSetTokenValue: fn(),
    onRenameToken: fn(),
    onRemoveToken: fn(),
  },
} satisfies Meta<typeof TokenEditor>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "選択されていない",
  args: { state: SAMPLE_EDITOR_STATE },
};

export const ColorSelected: Story = {
  name: "色トークンを選択中",
  args: {
    state: EditorState.selectToken(SAMPLE_EDITOR_STATE, {
      kind: "colors",
      name: "primary",
    }),
  },
};

export const SpacingSelected: Story = {
  name: "間隔トークンを選択中",
  args: {
    state: EditorState.selectToken(SAMPLE_EDITOR_STATE, {
      kind: "spacing",
      name: "md",
    }),
  },
};

export const ShadowSelected: Story = {
  name: "影トークンを選択中",
  args: {
    state: EditorState.selectToken(SAMPLE_EDITOR_STATE, {
      kind: "shadows",
      name: "md",
    }),
  },
};

export const TypographySelected: Story = {
  name: "書体トークンを選択中",
  args: {
    state: EditorState.selectToken(SAMPLE_EDITOR_STATE, {
      kind: "typography",
      name: "body",
    }),
  },
};
