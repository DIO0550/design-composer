import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { TokenSelection } from "@/domains/token-selection";
// 掴む口のサンプルは掴まれる側（features/assets）が持つ。ストーリー専用の値なので
// features/assets/index.ts（本番の公開 API）には出さず、ここから直接読む。
import {
  grabbingComponent,
  IdleGrab,
} from "@/features/assets/__stories__/asset-grab";
import {
  SampleSidebarDocument,
  sampleSidebarSelection,
} from "@/features/sidebar/__stories__/sample-sidebar-document";
import { LeftPaneViews } from "@/features/sidebar/components/left-pane-rail";
import type { LeftPaneNodeActions } from "@/features/sidebar/types/LeftPaneNodeActions";
import type { LeftPaneTokenActions } from "@/features/sidebar/types/LeftPaneTokenActions";
import { Option } from "@/utils/Option";
import { LeftPane } from "./index";

/**
 * 操作の受け口。ここでは押せることだけ分かればよいので、届いた先での編集は行わない
 * （編集まで通した様子は `OpenedDocumentEditor` のストーリーで見る）。
 */
const SampleNodeActions: LeftPaneNodeActions = {
  select: fn(),
  reorder: fn(),
  createComponent: fn(),
};

const SampleTokenActions: LeftPaneTokenActions = {
  select: fn(),
  add: fn(),
};

const meta = {
  title: "features/sidebar/LeftPane",
  component: LeftPane,
  parameters: { layout: "fullscreen" },
  args: {
    onSelectView: fn(),
    selection: sampleSidebarSelection(),
    tokenSelection: TokenSelection.create(SampleSidebarDocument, Option.none),
    isFrozen: false,
    node: SampleNodeActions,
    token: SampleTokenActions,
    grab: IdleGrab,
  },
  // 実際の幅（レール 56px + パネル 248px）と高さで見ないと、行の詰まり方が分からない。
  decorators: [
    (Story) => (
      <div className="flex h-[36rem] w-76 border-gray-300 border-r bg-white">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LeftPane>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Layers: Story = {
  name: "Layers（ツリー）",
  args: { view: LeftPaneViews.Layers },
};

export const Assets: Story = {
  name: "Assets（部品のパレット）",
  args: { view: LeftPaneViews.Assets },
};

export const Tokens: Story = {
  name: "Tokens（トークン一覧）",
  args: { view: LeftPaneViews.Tokens },
};

/**
 * パレットの行を掴んでキャンバスへ運んでいる `Assets`（#203）。
 * 掴んでいる行だけが青くなる。
 */
export const AssetsGrabbed: Story = {
  name: "Assets（行を掴んで運んでいる）",
  args: {
    view: LeftPaneViews.Assets,
    grab: grabbingComponent("primary-button"),
  },
};

/**
 * ノードを選んだ状態の `Layers`。行の選択が見える。
 */
export const LayersSelected: Story = {
  name: "Layers（ノードを選択中）",
  args: {
    view: LeftPaneViews.Layers,
    selection: sampleSidebarSelection("home-title"),
  },
};

/**
 * 外部編集でファイルが壊れているときの `Layers`（#135）。見出しの右端が `凍結中` に
 * なる。淡色と操作不可は器（`EditorLayout.LeftPane`）が持つので、ここには出ない。
 */
export const LayersFrozen: Story = {
  name: "Layers（凍結中）",
  args: {
    view: LeftPaneViews.Layers,
    isFrozen: true,
  },
};
