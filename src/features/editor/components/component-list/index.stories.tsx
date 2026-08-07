import type { Meta, StoryObj } from "@storybook/react-vite";
import { DesignDocument, DocumentTemplate } from "@/domains/design-document";
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

/**
 * 使われている部品と使われていない部品を 1 枚で見るための状態。
 * 雛形の初期部品セットは参照を 1 つも持たないため、そのまま使うと全行が `×0` になり
 * 使用数の出方が分からない。
 */
const USED_COMPONENTS_DOCUMENT = DesignDocument.create({
  components: DocumentTemplate.DEFAULT.components,
  artboards: [
    {
      name: "home",
      width: 360,
      height: 240,
      children: [
        { name: "home-login", ref: "primary-button" },
        { name: "home-cancel", ref: "primary-button" },
        { name: "home-card", ref: "card" },
      ],
    },
  ],
});

export const Default: Story = {
  name: "使用数のある部品",
  args: {
    refCounts: DesignDocument.componentRefCounts(USED_COMPONENTS_DOCUMENT),
    isInsertEnabled: true,
    onInsert: () => {},
  },
};

export const InsertDisabled: Story = {
  name: "挿せる位置が無い",
  args: {
    refCounts: DesignDocument.componentRefCounts(USED_COMPONENTS_DOCUMENT),
    isInsertEnabled: false,
    onInsert: () => {},
  },
};

export const Empty: Story = {
  name: "部品がない",
  args: { refCounts: [], isInsertEnabled: true, onInsert: () => {} },
};
