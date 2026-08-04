import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import {
  EMPTY_EDITOR_STATE,
  SAMPLE_EDITOR_STATE,
} from "@/features/editor/__stories__/sample-editor-state";
import { EditorState } from "@/features/editor/domains/editor-state";
import { ArtboardCanvas } from "./index";

const meta = {
  title: "features/editor/ArtboardCanvas",
  component: ArtboardCanvas,
  // キャンバスは中央ペインの高さいっぱいに広がるので、ペインと同じ高さの器に入れる
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="h-screen bg-gray-100">
        <Story />
      </div>
    ),
  ],
  args: {
    onSelect: fn(),
    onMoveNode: fn(),
    onResize: fn(),
    onEditProp: fn(),
  },
} satisfies Meta<typeof ArtboardCanvas>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "選択なし",
  args: { state: SAMPLE_EDITOR_STATE },
};

/** artboard は 2 軸とも fixed なので、選択するとリサイズハンドルも出る（docs/06-ui.md）。 */
export const Selected: Story = {
  name: "artboard を選択中",
  args: { state: EditorState.select(SAMPLE_EDITOR_STATE, "settings") },
};

export const Empty: Story = {
  name: "artboard がない",
  args: { state: EMPTY_EDITOR_STATE },
};
