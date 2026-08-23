import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import {
  BackgroundControl,
  DanglingGapControl,
  DirectionControl,
  GapControl,
  LabelControl,
  MissingBackgroundControl,
  TypographyControl,
  WidthControl,
} from "../__stories__/panel-controls";
import { PanelFrame } from "../__stories__/panel-frame";
import { fieldOf, PropField } from "./index";

/**
 * 値域ごとの入力欄。
 *
 * 6 種類を並べるのは、どの種別がどの見た目になるかがスキーマの走査だけで決まり、
 * 画面から確かめる手段が視覚差分しか無いため（happy-dom は Tailwind を解決しない）。
 */
const meta = {
  title: "features/inspector/PropertyPanel/PropField",
  component: PropField,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <PanelFrame>
        <Story />
      </PanelFrame>
    ),
  ],
  args: { resolvedValuePlacement: "beside" },
} satisfies Meta<typeof PropField>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Enum: Story = {
  name: "enum（未指定）",
  args: {
    field: fieldOf("field-label", DirectionControl, fn()),
    input: DirectionControl.input,
  },
};

export const Token: Story = {
  name: "トークン名から選ぶ",
  args: {
    field: fieldOf("field-label", TypographyControl, fn()),
    input: TypographyControl.input,
  },
};

/** 解決できたトークン。全幅の行なので数値は右に添う。 */
export const NumericToken: Story = {
  name: "数値のトークン（解決値あり）",
  args: {
    field: fieldOf("field-label", GapControl, fn()),
    input: GapControl.input,
  },
};

/** 半幅セルに入るときの添え方。数値が欄の下へ回る。 */
export const NumericTokenBelow: Story = {
  name: "数値のトークン（解決値を下に添える）",
  args: {
    field: fieldOf("field-label", GapControl, fn()),
    input: GapControl.input,
    resolvedValuePlacement: "below",
  },
};

/** ファイル由来の不正な参照。解決値が無いので選択欄だけになる。 */
export const DanglingToken: Story = {
  name: "数値のトークン（解決できない）",
  args: {
    field: fieldOf("field-label", DanglingGapControl, fn()),
    input: DanglingGapControl.input,
  },
};

export const ColorToken: Story = {
  name: "色のトークン（見本あり）",
  args: {
    field: fieldOf("field-label", BackgroundControl, fn()),
    input: BackgroundControl.input,
  },
};

/** 実在しないトークンを指しているとき。見本が出ず、名前だけが残る。 */
export const MissingColorToken: Story = {
  name: "色のトークン（見本なし）",
  args: {
    field: fieldOf("field-label", MissingBackgroundControl, fn()),
    input: MissingBackgroundControl.input,
  },
};

export const NumberInput: Story = {
  name: "数値を打ち込む",
  args: {
    field: fieldOf("field-label", WidthControl, fn()),
    input: WidthControl.input,
  },
};

export const TextInput: Story = {
  name: "文字を打ち込む",
  args: {
    field: fieldOf("field-label", LabelControl, fn()),
    input: LabelControl.input,
  },
};
