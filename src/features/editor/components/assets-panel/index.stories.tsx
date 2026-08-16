import type { Meta, StoryObj } from "@storybook/react-vite";
import { Artboard } from "@/domains/artboard";
import { DesignDocument, DocumentTemplate } from "@/domains/design-document";
import { LeftPanePanel } from "@/features/editor/components/left-pane-panel";
import { Option } from "@/utils/Option";
import { AssetsPanel } from "./index";

/**
 * 使われている部品と使われていない部品を 1 枚で見るための状態。
 * 雛形の初期部品セットは参照を 1 つも持たないため、そのまま使うと全行が `unused` になり
 * 使用数の出方が分からない。
 */
const UsedComponentsDocument = DesignDocument.create({
  components: DocumentTemplate.Default.components,
  artboards: [
    Artboard.create({
      name: "home",
      width: 360,
      height: 240,
      children: [
        { name: "home-login", ref: "primary-button" },
        { name: "home-cancel", ref: "primary-button" },
        { name: "home-card", ref: "card" },
      ],
    }),
  ],
});

const meta = {
  title: "features/editor/AssetsPanel",
  component: AssetsPanel,
  parameters: { layout: "padded" },
  args: {
    assets: DesignDocument.componentAssets(UsedComponentsDocument),
    sourceName: Option.none,
    isInsertEnabled: true,
    onInsert: () => {},
  },
  // 実際の幅（248px のパネル）で見ないと、名前と使用数の詰まり方が分からない。
  decorators: [
    (Story) => (
      <div className="flex h-96 w-62 border border-gray-300">
        <LeftPanePanel title="Assets" note={Option.none} footer={Option.none}>
          <Story />
        </LeftPanePanel>
      </div>
    ),
  ],
} satisfies Meta<typeof AssetsPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "パレット",
};

export const InsertDisabled: Story = {
  name: "挿せる位置が無い",
  args: { isInsertEnabled: false },
};

export const NoComponents: Story = {
  name: "部品がない",
  args: { assets: [] },
};
