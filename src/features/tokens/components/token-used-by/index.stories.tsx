import type { Meta, StoryObj } from "@storybook/react-vite";
import { RightPaneShell } from "@/components/__stories__/right-pane-shell";
import { PaneBody } from "@/components/pane-body";
import { sampleTokenSelection } from "@/features/tokens/__stories__/sample-token-document";
import { TokenUsedBy } from "./index";

const meta = {
  title: "features/tokens/TokenUsedBy",
  component: TokenUsedBy,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <RightPaneShell height="content">
        <PaneBody>
          <Story />
        </PaneBody>
      </RightPaneShell>
    ),
  ],
} satisfies Meta<typeof TokenUsedBy>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 雛形の `danger` はどこからも参照されていないので 0 件になる。 */
export const Unused: Story = {
  name: "参照されていない",
  args: {
    selection: sampleTokenSelection({ kind: "colors", name: "danger" }),
  },
};

/** `primary` は Box の背景と `primary-button` の定義から参照されている（上限内）。 */
export const WithinLimit: Story = {
  name: "上限内の件数",
  args: {
    selection: sampleTokenSelection({ kind: "colors", name: "primary" }),
  },
};

/** `md` は artboard の間隔と初期部品の余白・角丸から参照されており、上限を超える。 */
export const OverLimit: Story = {
  name: "上限を超える件数",
  args: {
    selection: sampleTokenSelection({ kind: "spacing", name: "md" }),
  },
};
