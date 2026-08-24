import type { Meta, StoryObj } from "@storybook/react-vite";
import { RightPaneShell } from "@/components/__stories__/right-pane-shell";
import { PaneHeading } from "@/components/pane-heading";
import { Option } from "@/utils/Option";
import { SelectionTitle } from "./index";

/**
 * 帯の中身（型アイコン + 名前 + 右端に種別）。
 *
 * 器は帯そのもの（44px・両端まで届く）なので、本文には入れず、編集画面が着せるのと
 * 同じ帯（`PaneHeading`）に入れて見る。外側の殻が持つのは幅だけ。
 */
const meta = {
  title: "features/inspector/PropertyPanel/SelectionTitle",
  component: SelectionTitle,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <RightPaneShell height="content">
        <PaneHeading>
          <Story />
        </PaneHeading>
      </RightPaneShell>
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
