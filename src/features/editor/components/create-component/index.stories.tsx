import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { SAMPLE_EDITOR_STATE } from "@/features/editor/__stories__/sample-editor-state";
import { EditorState } from "@/features/editor/domains/editor-state";
import { CreateComponent } from "./index";

const meta = {
  title: "features/editor/CreateComponent",
  component: CreateComponent,
  parameters: { layout: "padded" },
  args: {
    state: EditorState.select(SAMPLE_EDITOR_STATE, "home-title"),
    onCreate: fn(),
  },
  // 実際の幅（248px のパネル）で見ないと、ボタンと 1 行の収まり方が分からない。
  decorators: [
    (Story) => (
      <div className="w-62 border border-gray-300 bg-white">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CreateComponent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Ready: Story = {
  name: "ノードを選んでいる",
};

export const InstanceSelected: Story = {
  name: "インスタンスを選んでいる",
  args: { state: EditorState.select(SAMPLE_EDITOR_STATE, "home-login") },
};

export const ArtboardSelected: Story = {
  name: "artboard を選んでいる",
  args: { state: EditorState.select(SAMPLE_EDITOR_STATE, "home") },
};

export const Unselected: Story = {
  name: "何も選んでいない",
  args: { state: SAMPLE_EDITOR_STATE },
};
