import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { LeftPaneShell } from "@/components/__stories__/left-pane-shell";
import { SampleAssetsDocument } from "@/features/assets/__stories__/sample-assets-document";
import { Option } from "@/utils/Option";
import { CreateComponent } from "./index";

const meta = {
  title: "features/assets/CreateComponent",
  component: CreateComponent,
  parameters: { layout: "padded" },
  args: {
    document: SampleAssetsDocument,
    singleName: Option.some("home-title"),
    isFrozen: false,
    onCreate: fn(),
  },
  // 実際の幅（248px のパネル）で見ないと、ボタンと 1 行の収まり方が分からない。
  // パネル下端に固定されるフッターなので、本文の余白（p-3）は持たせない。
  decorators: [
    (Story) => (
      <LeftPaneShell>
        <Story />
      </LeftPaneShell>
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
