import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import {
  BackgroundControl,
  DirectionControl,
  WidthControl,
} from "../__stories__/panel-controls";
import { PanelFrame } from "../__stories__/panel-frame";
import { PropRow } from "./index";

/**
 * 1 prop 分の行。
 *
 * ラベル欄の幅・条件付きの行の字下げ・未指定の注記はいずれも class の違いにしか
 * 出ないので、崩れに気づける手段は視覚差分だけ。
 */
const meta = {
  title: "features/inspector/PropertyPanel/PropRow",
  component: PropRow,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <PanelFrame>
        <Story />
      </PanelFrame>
    ),
  ],
  args: { onEdit: fn() },
} satisfies Meta<typeof PropRow>;

export default meta;

type Story = StoryObj<typeof meta>;

/** ラベル左・コントロール右の並び。 */
export const Normal: Story = {
  name: "値の入った行",
  args: { control: BackgroundControl },
};

/** セグメントには「未指定」の選択肢が無いので、同じ綴りを行の下に出す。 */
export const Unset: Story = {
  name: "未指定の enum（既定の注記が付く）",
  args: { control: DirectionControl },
};

/** 条件を出している行の下にぶら下がる欄。ラベルを出さず、コントロールの左端へ揃える。 */
export const Dependent: Story = {
  name: "条件付きの行（ラベルを出さず字下げする）",
  args: { control: WidthControl },
};
