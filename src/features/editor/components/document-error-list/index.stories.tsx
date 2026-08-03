import type { Meta, StoryObj } from "@storybook/react-vite";
import { DocumentErrorList } from "./index";

const meta = {
  title: "features/editor/DocumentErrorList",
  component: DocumentErrorList,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      // 中央ペインと同じく、重ね合わせの基準を持つ器に入れて確認する。
      <div className="relative h-96 w-full bg-gray-100 p-4 text-gray-500 text-sm">
        最後に正常だったレンダリング
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof DocumentErrorList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const BrokenJson: Story = {
  name: "JSON が壊れている",
  args: {
    errors: [
      {
        kind: "syntax-error",
        message: "expected ',' or '}'",
        location: { kind: "text-position", position: 142 },
      },
    ],
  },
};

export const SchemaErrors: Story = {
  name: "スキーマ違反が複数",
  args: {
    errors: [
      {
        kind: "unknown-prop",
        message: 'unknown prop "colour"',
        location: { kind: "node", nodeName: "home-title", prop: "colour" },
      },
      {
        kind: "dangling-ref",
        message: 'unknown component "missing-button"',
        location: { kind: "node", nodeName: "home-login" },
      },
      {
        kind: "invalid-type",
        message: "expected number but got string",
        location: { kind: "document-path", path: "artboards[0].width" },
      },
      {
        kind: "unsupported-format-version",
        message:
          "file format version 99.0 is newer than this app (1.0); update the app to open this file",
        location: { kind: "whole-document" },
      },
    ],
  },
};

export const NoErrors: Story = {
  name: "エラーがない",
  args: { errors: [] },
};
