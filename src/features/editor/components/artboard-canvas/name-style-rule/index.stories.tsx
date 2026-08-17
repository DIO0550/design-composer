import type { Meta, StoryObj } from "@storybook/react-vite";
import { ElementNameAttribute } from "@/domains/compiled-element";
import { NameStyleRule } from "./index";

/**
 * 名前で指した要素だけに効く規則。
 *
 * 規則そのものは `<style>` なので何も描かれない。**規則が当たった相手**を見るために、
 * キャンバスの中身と同じ形（名前の属性を持つ div）を器として敷いている。
 * 名前を 2 つ並べるのは、**指した 1 つにだけ当たる**ことがこの部品の要だから。
 */
const meta = {
  title: "features/editor/ArtboardCanvas/NameStyleRule",
  component: NameStyleRule,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div className="flex h-48 items-start gap-8 bg-gray-100 p-8">
        <div
          {...{ [ElementNameAttribute]: "home-title" }}
          className="h-20 w-40 bg-white"
        />
        <div
          {...{ [ElementNameAttribute]: "home-note" }}
          className="h-20 w-40 bg-white"
        />
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof NameStyleRule>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 選択の枠（`artboard-frame-list` の `SelectionOutline` と同じ綴り）。 */
export const Selection: Story = {
  name: "選択の枠",
  args: {
    name: "home-title",
    declarations: "outline:2px solid #3b82f6;outline-offset:1px",
  },
};

/** ドロップ先の枠。選択と同時に出るので、破線と色で見分けられる必要がある。 */
export const DropParent: Story = {
  name: "ドロップ先の枠",
  args: {
    name: "home-title",
    declarations: "outline:2px dashed #10b981;outline-offset:1px",
  },
};

/** トークンの参照元に掛かる破線（UI 案の Tokens 画面）。 */
export const TokenReferrer: Story = {
  name: "トークンの参照元の破線",
  args: {
    name: "home-title",
    declarations: "outline:1.5px dashed #0d99ff;outline-offset:2px",
  },
};
