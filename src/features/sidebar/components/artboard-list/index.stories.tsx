import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { LeftPaneShell } from "@/components/__stories__/left-pane-shell";
import { sampleRenameActions } from "@/features/sidebar/__stories__/sample-rename-actions";
import {
  EmptySidebarSelection,
  sampleSidebarSelection,
} from "@/features/sidebar/__stories__/sample-sidebar-document";
import { Option } from "@/utils/Option";
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
  args: {
    onSelect: fn(),
    artboardActions: { add: fn(), reorder: fn() },
    renaming: Option.none,
    renameActions: sampleRenameActions(),
  },
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

/**
 * artboard の行の名前を編集中の状態（docs/06-ui.md「名前の変更」）。入力欄の見た目は
 * UI 案が描いていないので、行の高さと名前の左端が編集前と変わらないことを視覚差分で見る。
 */
export const Renaming: Story = {
  name: "行の名前を編集中",
  args: {
    selection: sampleSidebarSelection(),
    renaming: Option.some("home"),
  },
};
