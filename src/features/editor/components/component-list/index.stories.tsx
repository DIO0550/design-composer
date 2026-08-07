import type { Meta, StoryObj } from "@storybook/react-vite";
import { DocumentTemplate } from "@/domains/design-document";
import { ComponentList } from "./index";

const meta = {
  title: "features/editor/ComponentList",
  component: ComponentList,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="w-64 border border-gray-300 bg-white p-3">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ComponentList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "雛形の初期部品セット",
  args: {
    components: DocumentTemplate.DEFAULT.components,
    isInsertEnabled: true,
    onInsert: () => {},
  },
};

export const Empty: Story = {
  name: "部品がない",
  args: { components: {}, isInsertEnabled: true, onInsert: () => {} },
};
