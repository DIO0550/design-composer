import type { Meta, StoryObj } from "@storybook/react-vite";
import { SAMPLE_EDITOR_STATE } from "@/features/editor/__stories__/sample-editor-state";
import { EditorState } from "@/features/editor/domains/editor-state";
import { TokenUsedBy } from "./index";

const meta = {
  title: "features/editor/TokenUsedBy",
  component: TokenUsedBy,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="w-72 border border-gray-300 bg-white p-3">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TokenUsedBy>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 雛形の `danger` はどこからも参照されていないので 0 件になる。 */
export const Unused: Story = {
  name: "参照されていない",
  args: {
    state: EditorState.selectToken(SAMPLE_EDITOR_STATE, {
      kind: "colors",
      name: "danger",
    }),
  },
};

/** `primary` は Box の背景と `primary-button` の定義から参照されている（上限内）。 */
export const WithinLimit: Story = {
  name: "上限内の件数",
  args: {
    state: EditorState.selectToken(SAMPLE_EDITOR_STATE, {
      kind: "colors",
      name: "primary",
    }),
  },
};

/** `md` は artboard の余白・間隔と初期部品の余白から参照されており、上限を超える。 */
export const OverLimit: Story = {
  name: "上限を超える件数",
  args: {
    state: EditorState.selectToken(SAMPLE_EDITOR_STATE, {
      kind: "spacing",
      name: "md",
    }),
  },
};
