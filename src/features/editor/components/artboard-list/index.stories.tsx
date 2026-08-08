import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import {
  EMPTY_EDITOR_STATE,
  SAMPLE_EDITOR_STATE,
} from "@/features/editor/__stories__/sample-editor-state";
import { EditorState } from "@/features/editor/domains/editor-state";
import { ArtboardList } from "./index";

const meta = {
  title: "features/editor/ArtboardList",
  component: ArtboardList,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="w-64 border border-gray-300 bg-white p-3">
        <Story />
      </div>
    ),
  ],
  args: { onSelect: fn() },
} satisfies Meta<typeof ArtboardList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "選択なし（先頭が今の 1 枚）",
  args: { state: SAMPLE_EDITOR_STATE },
};

export const Selected: Story = {
  name: "別の artboard を選択中",
  args: { state: EditorState.select(SAMPLE_EDITOR_STATE, "settings") },
};

/** 配下のノードを選んでいる状態。それを載せている artboard が今の 1 枚として出る。 */
export const NodeSelected: Story = {
  name: "artboard 配下のノードを選択中",
  args: { state: EditorState.select(SAMPLE_EDITOR_STATE, "settings-card") },
};

export const Empty: Story = {
  name: "artboard がない",
  args: { state: EMPTY_EDITOR_STATE },
};
