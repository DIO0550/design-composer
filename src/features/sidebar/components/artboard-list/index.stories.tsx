import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { LeftPaneShell } from "@/components/__stories__/left-pane-shell";
import type { DocumentSelection } from "@/domains/session/document-selection";
import { sampleRenameActions } from "@/features/sidebar/__stories__/sample-rename-actions";
import {
  EmptySidebarSelection,
  sampleSidebarSelection,
} from "@/features/sidebar/__stories__/sample-sidebar-document";
import { Option } from "@/utils/Option";
import { ArtboardList, ArtboardListing } from "./index";

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

/**
 * その対が映しているドキュメントの、絞っていない一覧。
 *
 * @param selection 一覧の元になる対
 * @returns 全部を出し、掴んで並べ替えられる内容
 */
function fullListing(selection: DocumentSelection): ArtboardListing {
  return ArtboardListing.full(selection.document.artboards);
}

const DefaultSelection = sampleSidebarSelection();

export const Default: Story = {
  name: "選択なし（先頭が今の 1 枚）",
  args: {
    selection: DefaultSelection,
    listing: fullListing(DefaultSelection),
  },
};

const SettingsSelection = sampleSidebarSelection("settings");

export const Selected: Story = {
  name: "別の artboard を選択中",
  args: {
    selection: SettingsSelection,
    listing: fullListing(SettingsSelection),
  },
};

/** 配下のノードを選んでいる状態。それを載せている artboard が今の 1 枚として出る。 */
const NodeSelection = sampleSidebarSelection("settings-card");

export const NodeSelected: Story = {
  name: "artboard 配下のノードを選択中",
  args: {
    selection: NodeSelection,
    listing: fullListing(NodeSelection),
  },
};

export const Empty: Story = {
  name: "artboard がない",
  args: {
    selection: EmptySidebarSelection,
    listing: fullListing(EmptySidebarSelection),
  },
};

/**
 * 絞り込みで 1 枚だけ残った状態（docs/06-ui.md「絞り込み」）。行の見た目は絞っていない
 * ときと変わらず、掴む口だけが配られない。
 */
export const Filtered: Story = {
  name: "絞り込みで 1 枚だけ残っている",
  args: {
    selection: DefaultSelection,
    listing: ArtboardListing.filtered(
      DefaultSelection.document.artboards.slice(0, 1),
    ),
  },
};

/** どこにも一致が無い状態。見出しと `+` は残り、行の場所に知らせが出る。 */
export const NoMatch: Story = {
  name: "一致するものがない",
  args: {
    selection: DefaultSelection,
    listing: ArtboardListing.filtered([]),
  },
};

/**
 * artboard の行の名前を編集中の状態（docs/06-ui.md「名前の変更」）。入力欄の見た目は
 * UI 案が描いていないので、行の高さと名前の左端が編集前と変わらないことを視覚差分で見る。
 */
export const Renaming: Story = {
  name: "行の名前を編集中",
  args: {
    selection: DefaultSelection,
    listing: fullListing(DefaultSelection),
    renaming: Option.some("home"),
  },
};
