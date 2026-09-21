import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { sampleRenameActions } from "@/features/editor/features/sidebar/__stories__/sample-rename-actions";
import { sampleSidebarSelection } from "@/features/editor/features/sidebar/__stories__/sample-sidebar-document";
import { LayersPanel } from "@/features/editor/features/sidebar/components/layers-panel";
import {
  type LeftPaneView,
  LeftPaneViews,
} from "@/features/editor/features/sidebar/components/left-pane-rail";
import type { LeftPaneArtboardActions } from "@/features/editor/features/sidebar/types/LeftPaneArtboardActions";
import type { LeftPaneNodeActions } from "@/features/editor/features/sidebar/types/LeftPaneNodeActions";
import type { LeftPaneViewContent } from "@/features/editor/features/sidebar/types/LeftPaneViewContent";
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

const SampleArtboardActions: LeftPaneArtboardActions = {
  add: fn(),
  reorder: fn(),
};

/**
 * `Layers` の行き先。選んでいるノードだけを差し替えられるようにして、ストーリーごとに
 * 同じ組み立てを書き写さない。
 *
 * @param selected 選択させるノードの名前。省くと何も選んでいない状態
 * @returns レールで `Layers` を選んだときに出す中身
 */
function layersView(...selected: readonly string[]): LeftPaneViewContent {
  return {
    kind: "searchable",
    searchLabel: "Search layers",
    footer: Option.none,
    render: (query) => (
      <LayersPanel
        query={query}
        selection={sampleSidebarSelection(...selected)}
        renaming={Option.none}
        artboard={SampleArtboardActions}
        node={SampleNodeActions}
        rename={sampleRenameActions()}
      />
    ),
  };
}

/**
 * 差し込まれる側の見本。**器が出し分けるもの**（見出し・検索欄の有無・フッターの有無）が
 * 分かればよいので、他の子 feature の部品は持ち込まない
 * （`rules/consistency.md`「兄弟参照を禁止する理由」）。Assets / Tokens の実物を組み合わせ
 * た様子は `OpenedDocumentEditor` のストーリーが見せる。
 */
function sampleViews(): Readonly<Record<LeftPaneView, LeftPaneViewContent>> {
  return {
    [LeftPaneViews.Layers]: layersView(),
    [LeftPaneViews.Assets]: {
      kind: "searchable",
      searchLabel: "Search assets",
      footer: Option.some(
        <p className="border-gray-300 border-t p-3 text-gray-400 text-xs">
          差し込まれたフッター
        </p>,
      ),
      render: (query) => (
        <p className="text-gray-400 text-xs">
          差し込まれた中身（検索語: {query === "" ? "なし" : query}）
        </p>
      ),
    },
    [LeftPaneViews.Tokens]: {
      kind: "plain",
      footer: Option.none,
      render: () => (
        <p className="text-gray-400 text-xs">検索欄を持たない行き先</p>
      ),
    },
  };
}

const meta = {
  title: "features/editor/features/sidebar/LeftPane",
  component: LeftPane,
  parameters: { layout: "fullscreen" },
  args: {
    onSelectView: fn(),
    views: sampleViews(),
    isFrozen: false,
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

/** フッターを持つ行き先。パネルの下端に差し込まれたものが固定される。 */
export const Assets: Story = {
  name: "Assets（フッターを持つ行き先）",
  args: { view: LeftPaneViews.Assets },
};

/** 検索欄を持たない行き先。見出しの直下に欄が出ない。 */
export const Tokens: Story = {
  name: "Tokens（検索欄を持たない行き先）",
  args: { view: LeftPaneViews.Tokens },
};

/**
 * ノードを選んだ状態の `Layers`。行の選択が見える。
 */
export const LayersSelected: Story = {
  name: "Layers（ノードを選択中）",
  args: {
    view: LeftPaneViews.Layers,
    views: {
      ...sampleViews(),
      [LeftPaneViews.Layers]: layersView("home-title"),
    },
  },
};

/**
 * 外部編集でファイルが壊れているときの `Layers`。見出しの右端が `凍結中` になる。淡色と操
 * 作不可は器（`EditorLayout.LeftPane`）が持つので、ここには出ない。
 */
export const LayersFrozen: Story = {
  name: "Layers（凍結中）",
  args: {
    view: LeftPaneViews.Layers,
    isFrozen: true,
  },
};
