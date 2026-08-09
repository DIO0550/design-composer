import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { SAMPLE_EDITOR_STATE } from "@/features/editor/__stories__/sample-editor-state";
import { LEFT_PANE_VIEWS } from "@/features/editor/components/left-pane-rail";
import { EditorState } from "@/features/editor/domains/editor-state";
import type { NodeActions } from "@/features/editor/hooks/use-node-actions";
import type { TokenActions } from "@/features/editor/hooks/use-token-actions";
import { LeftPane } from "./index";

/**
 * 操作の受け口。ここでは押せることだけ分かればよいので、届いた先での編集は行わない
 * （編集まで通した様子は `OpenedDocumentEditor` のストーリーで見る）。
 */
const NODE_ACTIONS: NodeActions = {
  select: fn(),
  selectAt: fn(),
  clearSelection: fn(),
  reorder: fn(),
  move: fn(),
  resize: fn(),
  editProp: fn(),
  insert: fn(),
  insertInstance: fn(),
  isInsertEnabled: true,
};

const TOKEN_ACTIONS: TokenActions = {
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
    state: SAMPLE_EDITOR_STATE,
    node: NODE_ACTIONS,
    token: TOKEN_ACTIONS,
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
  args: { view: LEFT_PANE_VIEWS.layers },
};

export const Assets: Story = {
  name: "Assets（部品のパレット）",
  args: { view: LEFT_PANE_VIEWS.assets },
};

export const Tokens: Story = {
  name: "Tokens（トークン一覧）",
  args: { view: LEFT_PANE_VIEWS.tokens },
};

/**
 * 挿せる位置が無いときの `Assets`。部品の行の挿入ボタンが押せなくなる。
 */
export const AssetsInsertDisabled: Story = {
  name: "Assets（挿せる位置が無い）",
  args: {
    view: LEFT_PANE_VIEWS.assets,
    node: { ...NODE_ACTIONS, isInsertEnabled: false },
  },
};

/**
 * ノードを選んだ状態の `Layers`。行の選択が見える。
 */
export const LayersSelected: Story = {
  name: "Layers（ノードを選択中）",
  args: {
    view: LEFT_PANE_VIEWS.layers,
    state: EditorState.select(SAMPLE_EDITOR_STATE, "home"),
  },
};
