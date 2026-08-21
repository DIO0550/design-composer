import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import {
  grabbingComponent,
  IdleGrab,
} from "@/features/assets/__stories__/asset-grab";
import {
  FileInvalidEditorState,
  SampleEditorState,
} from "@/features/editor/__stories__/sample-editor-state";
import { LeftPaneViews } from "@/features/editor/components/left-pane-rail";
import { EditorState } from "@/features/editor/domains/editor-state";
import type { NodeActions } from "@/features/editor/hooks/use-node-actions";
import type { TokenActions } from "@/features/editor/hooks/use-token-actions";
import { LeftPane } from "./index";

/**
 * 操作の受け口。ここでは押せることだけ分かればよいので、届いた先での編集は行わない
 * （編集まで通した様子は `OpenedDocumentEditor` のストーリーで見る）。
 */
const SampleNodeActions: NodeActions = {
  select: fn(),
  selectAt: fn(),
  clearSelection: fn(),
  reveal: fn(),
  reorder: fn(),
  move: fn(),
  resize: fn(),
  editProp: fn(),
  insert: fn(),
  insertAt: fn(),
  detachInstance: fn(),
  selectAllInstances: fn(),
  createComponent: fn(),
  isInsertEnabled: true,
};

const SampleTokenActions: TokenActions = {
  select: fn(),
  add: fn(),
  setValue: fn(),
  rename: fn(),
  remove: fn(),
};

const meta = {
  title: "features/editor/LeftPane",
  component: LeftPane,
  parameters: { layout: "fullscreen" },
  args: {
    onSelectView: fn(),
    state: SampleEditorState,
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
    state: EditorState.select(SampleEditorState, "home"),
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
    state: FileInvalidEditorState,
  },
};
