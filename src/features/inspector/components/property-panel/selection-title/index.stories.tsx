import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactElement } from "react";
import { Option } from "@/utils/Option";
import { SelectionTitle } from "./index";

/**
 * 帯の中身（型アイコン + 名前 + 右端に種別）。
 *
 * 器は帯そのもの（44px・両端まで届く）なので、右ペインの幅の枠ではなく帯を真似た器で
 * 見る（`property-panel/index.stories.tsx` の帯と同じ綴り）。
 */
function HeadingFrame({ children }: Readonly<{ children: ReactElement }>) {
  return (
    <div className="w-72 border border-gray-300 bg-white">
      <div className="flex h-11 items-center gap-2 border-gray-300 border-b px-3">
        {children}
      </div>
    </div>
  );
}

const meta = {
  title: "features/inspector/PropertyPanel/SelectionTitle",
  component: SelectionTitle,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <HeadingFrame>
        <Story />
      </HeadingFrame>
    ),
  ],
} satisfies Meta<typeof SelectionTitle>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Box: Story = {
  name: "Box を選択中",
  args: {
    selection: { name: "overflow-wide", kind: Option.some("Box") },
  },
};

export const Instance: Story = {
  name: "インスタンスを選択中",
  args: { selection: { name: "home-login", kind: Option.some("component") } },
};

/** スキーマに無い `type`。分からない種別を既定へ寄せず、アイコンも綴りも出さない。 */
export const UnknownKind: Story = {
  name: "種別が分からないノードを選択中",
  args: { selection: { name: "broken-node", kind: Option.none } },
};

/** 帯の幅に収まらない名前。省略されることを視覚差分で見る。 */
export const LongName: Story = {
  name: "名前が長いノードを選択中",
  args: {
    selection: {
      name: "very-long-node-name-that-does-not-fit-in-the-heading",
      kind: Option.some("Box"),
    },
  },
};
