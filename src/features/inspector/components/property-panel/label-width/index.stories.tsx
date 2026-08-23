import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactElement } from "react";
import { PanelFrame } from "../__stories__/panel-frame";
import { ControlOffsetClass, LabelWidthClass } from "./index";

/**
 * ラベル欄の幅と、その幅から決まる字下げ。
 *
 * このモジュールは class の綴りしか持たないので、**2 つが揃っていること**を見るための
 * 見本をここで組む（`artboard-canvas/name-style-rule` のストーリーが、規則の当たり先を
 * 器として敷いているのと同じ形）。実際にこの 2 つを使うのは `prop-row` /
 * `shorthand-row` / `instance-body` で、ずれると 3 つの行の左端が揃わなくなる。
 *
 * @returns ラベル付きの行と、その下にぶら下がる字下げした行を並べた見本
 */
function LabelWidthSample(): ReactElement {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span
          className={`${LabelWidthClass} truncate text-[11px] text-gray-500`}
        >
          Width Mode
        </span>
        <div className="min-w-0 flex-1 rounded-md border border-gray-300 px-2 py-1 text-[11px]">
          ラベル欄の右
        </div>
      </div>
      <div className={`flex items-center ${ControlOffsetClass}`}>
        <div className="min-w-0 flex-1 rounded-md border border-gray-300 px-2 py-1 text-[11px]">
          字下げした行（上の欄と左端が揃う）
        </div>
      </div>
    </div>
  );
}

const meta = {
  title: "features/inspector/PropertyPanel/LabelWidth",
  component: LabelWidthSample,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <PanelFrame>
        <Story />
      </PanelFrame>
    ),
  ],
} satisfies Meta<typeof LabelWidthSample>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 幅（5.25rem）と字下げ（5.75rem = 幅 + 間隔 0.5rem）が揃っている状態。 */
export const Default: Story = { name: "ラベル欄の幅と字下げ" };
