import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { LeftPaneShell } from "@/components/__stories__/left-pane-shell";
import { DesignDocument, DocumentTemplate } from "@/domains/design-document";
import { DocumentSelection } from "@/domains/document-selection";
import { sampleSidebarSelection } from "@/features/sidebar/__stories__/sample-sidebar-document";
import { DocumentTree } from "./index";

const meta = {
  title: "features/sidebar/DocumentTree",
  component: DocumentTree,
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
  args: { onSelect: fn(), onReorder: fn() },
} satisfies Meta<typeof DocumentTree>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "選択なし",
  args: { selection: sampleSidebarSelection() },
};

export const OtherArtboard: Story = {
  name: "別の artboard を選択中",
  args: { selection: sampleSidebarSelection("settings") },
};

export const NodeSelected: Story = {
  name: "artboard 配下のノードを選択中",
  args: { selection: sampleSidebarSelection("home-title") },
};

/**
 * 入れ子の深さと並べ替えボタンの出方（先頭には「上へ」、末尾には「下へ」が出ない）を
 * 1 枚で見るための対。共有のサンプルは 3 つの行き先を揃えるためのものなので、
 * ツリー都合の構造はここに閉じる。
 */
const NestedSelection = DocumentSelection.fromNames(
  DesignDocument.create({
    tokens: DocumentTemplate.Default.tokens,
    components: DocumentTemplate.Default.components,
    artboards: [
      {
        name: "nested",
        width: 360,
        height: 240,
        props: {
          direction: "column",
          gap: "md",
          paddingRight: "lg",
          paddingLeft: "lg",
        },
        children: [
          {
            name: "header",
            type: "Text",
            props: { content: "見出し", typography: "heading" },
          },
          {
            name: "body",
            type: "Box",
            props: { direction: "column", gap: "sm" },
            children: [
              { name: "body-text", type: "Text", props: { content: "本文" } },
              {
                name: "body-action",
                ref: "primary-button",
                overrides: { label: "送信" },
              },
            ],
          },
          { name: "footer", type: "Text", props: { content: "脚注" } },
        ],
      },
    ],
  }),
  [],
);

export const Nested: Story = {
  name: "入れ子のノードと並べ替え",
  args: { selection: NestedSelection },
};
