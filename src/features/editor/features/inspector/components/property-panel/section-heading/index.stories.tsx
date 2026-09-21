import type { Meta, StoryObj } from "@storybook/react-vite";
import { PanelFrame } from "../__stories__/panel-frame";
import { SectionHeading } from "./index";

/** 節の見出し。右端に添えるものの有無で 2 通りある。 */
const meta = {
  title: "features/inspector/PropertyPanel/SectionHeading",
  component: SectionHeading,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <PanelFrame>
        <Story />
      </PanelFrame>
    ),
  ],
} satisfies Meta<typeof SectionHeading>;

export default meta;

type Story = StoryObj<typeof meta>;

/** prop のグループの見出し（`groups-body`）。 */
export const Default: Story = {
  name: "見出しだけ",
  args: { children: "Layout" },
};

/** 公開 prop の節の見出し（`instance-body`）。右端に件数が付く。 */
export const WithTrailing: Story = {
  name: "右端に件数を添える",
  args: {
    children: "Public props",
    trailing: <span className="text-gray-400 text-xs">2</span>,
  },
};
