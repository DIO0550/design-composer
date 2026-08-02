import type { Meta, StoryObj } from "@storybook/react-vite";
import { EditorLayout } from "./index";

const meta = {
  title: "features/editor/EditorLayout",
  component: EditorLayout,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof EditorLayout>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "3ペインに中身を差し込む",
  args: {
    children: (
      <>
        <EditorLayout.LeftPane>ツリービュー・部品一覧</EditorLayout.LeftPane>
        <EditorLayout.CenterPane>キャンバス</EditorLayout.CenterPane>
        <EditorLayout.RightPane>プロパティパネル</EditorLayout.RightPane>
      </>
    ),
  },
};
