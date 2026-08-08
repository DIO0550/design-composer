import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { DesignDocument } from "@/domains/design-document";
import { SAMPLE_EDITOR_STATE } from "@/features/editor/__stories__/sample-editor-state";
import { EditorState } from "@/features/editor/domains/editor-state";
import { PropertyPanel } from "./index";

/** 帯の幅に収まらない名前。省略の見え方を視覚差分で見るためだけの状態。 */
const LONG_NODE_NAME = "very-long-node-name-that-does-not-fit-in-the-heading";

const LONG_NAME_EDITOR_STATE = EditorState.create(
  DesignDocument.create({
    artboards: [
      {
        name: "home",
        width: 360,
        height: 240,
        children: [{ name: LONG_NODE_NAME, type: "Box" }],
      },
    ],
  }),
);

const meta = {
  title: "features/editor/PropertyPanel",
  component: PropertyPanel,
  parameters: { layout: "padded" },
  /*
   * 実際の右ペインと同じ器で見る。帯は器の両端まで届くので、
   * 余白は器ではなく帯と本文がそれぞれ内側に持つ（`EditorLayout.RightPane` と同じ形）。
   */
  decorators: [
    (Story) => (
      <div className="flex h-[32rem] w-72 flex-col border border-gray-300 bg-white">
        <Story />
      </div>
    ),
  ],
  args: { onClearSelection: fn(), onEditProp: fn() },
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

export const TextSelected: Story = {
  name: "Text ノードを選択中",
  args: { state: EditorState.select(SAMPLE_EDITOR_STATE, "home-title") },
};

export const InstanceSelected: Story = {
  name: "インスタンスを選択中（publicProps から生成）",
  args: { state: EditorState.select(SAMPLE_EDITOR_STATE, "home-login") },
};

export const BoxSelected: Story = {
  name: "Box ノードを選択中",
  args: { state: EditorState.select(SAMPLE_EDITOR_STATE, "overflow-wide") },
};

/** 名前が帯の幅に収まらない状態（省略されることを視覚差分で見る）。 */
export const LongName: Story = {
  name: "名前が長いノードを選択中",
  args: {
    state: EditorState.select(LONG_NAME_EDITOR_STATE, LONG_NODE_NAME),
  },
};
