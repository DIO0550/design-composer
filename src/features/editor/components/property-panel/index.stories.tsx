import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { DesignDocument } from "@/domains/design-document";
import { SAMPLE_EDITOR_STATE } from "@/features/editor/__stories__/sample-editor-state";
import { EditorState } from "@/features/editor/domains/editor-state";
import { PropertyPanel } from "./index";

/** 帯の幅に収まらない名前。省略の見え方を視覚差分で見るためだけの状態。 */
const LONG_NODE_NAME = "very-long-node-name-that-does-not-fit-in-the-heading";

/**
 * どの prop も設定されておらず、色のトークン参照だけが実在しない名前を指す Box。
 * 既存のストーリーが持っていない状態（既定の注記が出る行・見本の出ない色の行）を
 * 視覚差分に載せる。
 */
const UNSET_EDITOR_STATE = EditorState.create(
  DesignDocument.create({
    artboards: [
      {
        name: "home",
        width: 360,
        height: 240,
        children: [
          { name: "unset-box", type: "Box", props: { background: "missing" } },
        ],
      },
    ],
  }),
);

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
  args: {
    onClearSelection: fn(),
    onEditProp: fn(),
    instance: { goToSource: fn(), detach: fn() },
  },
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

/** どの prop も未指定で、色の参照だけが宙に浮いている状態。 */
export const Unset: Story = {
  name: "未指定の prop だけの Box を選択中",
  args: { state: EditorState.select(UNSET_EDITOR_STATE, "unset-box") },
};

/** 名前が帯の幅に収まらない状態（省略されることを視覚差分で見る）。 */
export const LongName: Story = {
  name: "名前が長いノードを選択中",
  args: {
    state: EditorState.select(LONG_NAME_EDITOR_STATE, LONG_NODE_NAME),
  },
};
