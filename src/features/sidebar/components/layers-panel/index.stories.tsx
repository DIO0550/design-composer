import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { LeftPaneShell } from "@/components/__stories__/left-pane-shell";
import { sampleRenameActions } from "@/features/sidebar/__stories__/sample-rename-actions";
import { sampleSidebarSelection } from "@/features/sidebar/__stories__/sample-sidebar-document";
import { Option } from "@/utils/Option";
import { LayersPanel } from "./index";

const meta = {
  title: "features/sidebar/LayersPanel",
  component: LayersPanel,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <LeftPaneShell>
        <div className="flex flex-col gap-4 p-3">
          <Story />
        </div>
      </LeftPaneShell>
    ),
  ],
  args: {
    selection: sampleSidebarSelection(),
    renaming: Option.none,
    artboard: { add: fn(), reorder: fn() },
    node: { select: fn(), reorder: fn(), createComponent: fn() },
    rename: sampleRenameActions(),
  },
} satisfies Meta<typeof LayersPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "絞り込んでいない",
  args: { query: "" },
};

/** 一致した artboard と、今見ている 1 枚だけが残った状態。 */
export const Filtered: Story = {
  name: "絞り込んでいる",
  args: { query: "settings" },
};

/**
 * どこにも一致が無い状態。`Artboards` の見出しと `+` を残して知らせに置き換わり、ツリーは
 * 出なくなる（docs/06-ui.md「絞り込み」）。2 つの節がまとめてこうなることは、この組み合わせ
 * でしか絵に出ない。
 */
export const NoMatch: Story = {
  name: "一致するものがない",
  args: { query: "zzz" },
};
