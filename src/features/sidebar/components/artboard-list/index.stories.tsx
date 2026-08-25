import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { LeftPaneShell } from "@/components/__stories__/left-pane-shell";
import {
  EmptySidebarSelection,
  sampleSidebarSelection,
} from "@/features/sidebar/__stories__/sample-sidebar-document";
import { ArtboardList } from "./index";

const meta = {
  title: "features/sidebar/ArtboardList",
  component: ArtboardList,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <LeftPaneShell>
        <div className="p-3">
          <Story />
        </div>
      </LeftPaneShell>
    ),
  ],
  args: { onSelect: fn(), artboardActions: { add: fn(), reorder: fn() } },
} satisfies Meta<typeof ArtboardList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "選択なし（先頭が今の 1 枚）",
  args: { selection: sampleSidebarSelection() },
};

export const Selected: Story = {
  name: "別の artboard を選択中",
  args: { selection: sampleSidebarSelection("settings") },
};

/** 配下のノードを選んでいる状態。それを載せている artboard が今の 1 枚として出る。 */
export const NodeSelected: Story = {
  name: "artboard 配下のノードを選択中",
  args: { selection: sampleSidebarSelection("settings-card") },
};

export const Empty: Story = {
  name: "artboard がない",
  args: { selection: EmptySidebarSelection },
};
