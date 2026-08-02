import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import {
  EMPTY_EDITOR_STATE,
  SAMPLE_EDITOR_STATE,
} from "@/features/editor/__stories__/sample-editor-state";
import { EditorState } from "@/features/editor/domains/editor-state";
import { DocumentTree } from "./index";

const meta = {
  title: "features/editor/DocumentTree",
  component: DocumentTree,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="w-64 border border-gray-300 bg-white p-3">
        <Story />
      </div>
    ),
  ],
  args: { onSelect: fn() },
} satisfies Meta<typeof DocumentTree>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "選択なし",
  args: { state: SAMPLE_EDITOR_STATE },
};

export const Selected: Story = {
  name: "artboard を選択中",
  args: { state: EditorState.select(SAMPLE_EDITOR_STATE, "home") },
};

export const Empty: Story = {
  name: "artboard がない",
  args: { state: EMPTY_EDITOR_STATE },
};
