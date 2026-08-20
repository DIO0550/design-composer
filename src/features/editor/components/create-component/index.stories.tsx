import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { SampleEditorState } from "@/features/editor/__stories__/sample-editor-state";
import { EditorState } from "@/features/editor/domains/editor-state";
import { Option } from "@/utils/Option";
import { CreateComponent } from "./index";

const SampleDocument = EditorState.document(SampleEditorState);

const meta = {
  title: "features/editor/CreateComponent",
  component: CreateComponent,
  parameters: { layout: "padded" },
  args: {
    document: SampleDocument,
    singleName: Option.some("home-title"),
    isFrozen: false,
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
  args: { singleName: Option.some("home-login") },
};

export const ArtboardSelected: Story = {
  name: "artboard を選んでいる",
  args: { singleName: Option.some("home") },
};

export const Unselected: Story = {
  name: "何も選んでいない",
  args: { singleName: Option.none },
};
