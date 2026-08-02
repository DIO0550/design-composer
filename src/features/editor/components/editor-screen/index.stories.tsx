import type { Meta, StoryObj } from "@storybook/react-vite";
import { EditorScreen } from "./index";

const meta = {
  title: "features/editor/EditorScreen",
  component: EditorScreen,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof EditorScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * 3 ペインを組み立てた画面。EditorProvider を内側に持つため、
 * ツリービューとキャンバスの選択が連動する様子をここで操作して確認できる。
 */
export const Default: Story = {
  name: "エディタ画面",
};
