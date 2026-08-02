import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { DesignDocument, DocumentTemplate } from "@/domains/design-document";
import {
  EMPTY_EDITOR_STATE,
  SAMPLE_EDITOR_STATE,
} from "@/features/editor/__stories__/sample-editor-state";
import { EditorState } from "@/features/editor/domains/editor-state";
import { DocumentTree } from "./index";

const meta = {
  title: "features/editor/DocumentTree",
  component: DocumentTree,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="w-64 border border-gray-300 bg-white p-3">
        <Story />
      </div>
    ),
  ],
  args: { onSelect: fn(), onReorder: fn() },
} satisfies Meta<typeof DocumentTree>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "選択なし",
  args: { state: SAMPLE_EDITOR_STATE },
};

export const Selected: Story = {
  name: "artboard を選択中",
  args: { state: EditorState.select(SAMPLE_EDITOR_STATE, "home") },
};

export const NodeSelected: Story = {
  name: "artboard 配下のノードを選択中",
  args: { state: EditorState.select(SAMPLE_EDITOR_STATE, "home-title") },
};

export const Empty: Story = {
  name: "artboard がない",
  args: { state: EMPTY_EDITOR_STATE },
};

/**
 * 入れ子の深さと並べ替えボタンの出方（先頭には「上へ」、末尾には「下へ」が出ない）を
 * 1 枚で見るための状態。共有のサンプル状態はキャンバスのストーリーも使うため、
 * ツリー都合の構造はここに閉じる。
 */
const NESTED_EDITOR_STATE = EditorState.create(
  DesignDocument.create({
    tokens: DocumentTemplate.DEFAULT.tokens,
    components: DocumentTemplate.DEFAULT.components,
    artboards: [
      {
        name: "nested",
        width: 360,
        height: 240,
        props: { direction: "column", gap: "md", paddingX: "lg" },
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
);

export const Nested: Story = {
  name: "入れ子のノードと並べ替え",
  args: { state: NESTED_EDITOR_STATE },
};
