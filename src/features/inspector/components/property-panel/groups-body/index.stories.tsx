import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { BoxSections } from "../__stories__/panel-controls";
import { PanelFrame } from "../__stories__/panel-frame";
import { GroupsBody } from "./index";

/** 見出しでまとめた prop の並び。節の区切り（罫線）と行の間隔を見る。 */
const meta = {
  title: "features/inspector/PropertyPanel/GroupsBody",
  component: GroupsBody,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <PanelFrame>
        <Story />
      </PanelFrame>
    ),
  ],
  args: { onEdit: fn() },
} satisfies Meta<typeof GroupsBody>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 3 つの節（Layout / Size / Appearance）。1 prop の行・束ねた行・条件付きの行が入る。 */
export const Default: Story = {
  name: "節が並んでいる",
  args: { sections: BoxSections },
};

/** 編集できる prop が 1 つも無いとき。節ではなくその旨の 1 行になる。 */
export const Empty: Story = {
  name: "編集できる prop が無い",
  args: { sections: [] },
};
