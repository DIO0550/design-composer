import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { SAMPLE_EDITOR_STATE } from "@/features/editor/__stories__/sample-editor-state";
import { EditorState } from "@/features/editor/domains/editor-state";
import { PropertyPanel } from "./index";

const meta = {
  title: "features/editor/PropertyPanel",
  component: PropertyPanel,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="w-72 border border-gray-300 bg-white p-3">
        <Story />
      </div>
    ),
  ],
  args: { onClearSelection: fn() },
} satisfies Meta<typeof PropertyPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "選択されていない",
  args: { state: SAMPLE_EDITOR_STATE },
};

export const Selected: Story = {
  name: "artboard を選択中",
  args: { state: EditorState.select(SAMPLE_EDITOR_STATE, "home") },
};
