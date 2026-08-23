import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { InstanceControls } from "../__stories__/panel-controls";
import { PanelFrame } from "../__stories__/panel-frame";
import { InstanceBody } from "./index";

/**
 * インスタンスを選んだときの本文（UI 案 docs/Design Composer.html の
 * `Assets · Instance` の右ペイン）。
 *
 * 押せないボタンを 2 通り並べるのは、`disabled` の見た目と `title` の理由が
 * 出どころ違いの 2 つの条件で決まるため。
 */
const meta = {
  title: "features/inspector/PropertyPanel/InstanceBody",
  component: InstanceBody,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <PanelFrame>
        <Story />
      </PanelFrame>
    ),
  ],
  args: {
    onEdit: fn(),
    actions: { goToSource: fn(), selectAllInstances: fn(), detach: fn() },
  },
} satisfies Meta<typeof InstanceBody>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 上書きしている公開 prop（既定値の知らせが付く）と、上書きしていない公開 prop。 */
export const Default: Story = {
  name: "インスタンスを選択中",
  args: { controls: InstanceControls },
};

/** 参照先の部品が見つからないとき。解除のボタンだけが押せなくなる。 */
export const NotDetachable: Story = {
  name: "解除できないインスタンス",
  args: { controls: { ...InstanceControls, isDetachable: false } },
};

/** そのインスタンスしか無いとき。まとめて選んでも選択が変わらないので押せない。 */
export const OnlyInstance: Story = {
  name: "同じ部品のインスタンスが 1 つだけ",
  args: { controls: { ...InstanceControls, sourceInstanceCount: 1 } },
};
