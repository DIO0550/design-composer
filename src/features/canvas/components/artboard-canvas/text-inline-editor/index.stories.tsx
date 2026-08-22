import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { TextInlineEditor } from "./index";

/**
 * 編集中の Text に重ねる入力欄（docs/06-ui.md「Text のインライン編集」）。
 *
 * **キャンバスのストーリーには出てこない。** 開くにはダブルクリックが要り、
 * `ArtboardCanvas` のストーリーは静止した状態しか撮れないため。枠の色・最小の大きさを
 * 確かめる手段はここだけになる。
 */
const meta = {
  title: "features/canvas/ArtboardCanvas/TextInlineEditor",
  component: TextInlineEditor,
  parameters: { layout: "fullscreen" },
  args: { onChange: fn(), onCommit: fn(), onCancel: fn() },
  decorators: [
    (Story) => (
      <div className="h-48 w-full bg-gray-100">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TextInlineEditor>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 文言のある Text を編集しているところ。実測した矩形にぴったり重なる。 */
export const Editing: Story = {
  name: "文言を編集中",
  args: {
    edit: {
      draft: "ようこそ",
      bounds: { left: 40, top: 40, width: 200, height: 28 },
    },
  },
};

/**
 * 文言が空の Text を編集しているところ。
 *
 * 矩形が潰れている（幅も高さも 0）ので、最小の幅と高さが効かないと掴めない入力欄になる。
 * **この最小値を落としてもテストは落ちない**ので、見る手段はこのストーリーだけ。
 */
export const EmptyText: Story = {
  name: "文言が空の Text を編集中",
  args: {
    edit: { draft: "", bounds: { left: 40, top: 40, width: 0, height: 0 } },
  },
};
