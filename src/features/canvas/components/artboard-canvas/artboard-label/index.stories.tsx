import type { Meta, StoryObj } from "@storybook/react-vite";
import { BoxElement } from "@/domains/compiled/compiled-element";
import { ArtboardLabel } from "./index";

/**
 * artboard の見出し（UI 案 docs/Design Composer.html。名前の右に大きさが並ぶ）。
 *
 * **今見ている 1 枚かどうかの出し分けは、テストでは 1 件も落ちない**
 * （happy-dom は Tailwind を解決しない）。青と灰色の差を確かめる手段はこの
 * 2 つのストーリーの視覚差分だけ。`ArtboardCanvas` のストーリーにも出るが、
 * 縮んだ artboard の上に小さく載るので色の差を読み取りにくい。
 */
const meta = {
  title: "features/canvas/ArtboardCanvas/ArtboardLabel",
  component: ArtboardLabel,
  parameters: { layout: "centered" },
  args: {
    artboard: {
      element: BoxElement.create("login", [], []),
      width: 720,
      height: 900,
    },
  },
} satisfies Meta<typeof ArtboardLabel>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 今ツリーが映している 1 枚。名前だけが青く太くなる（大きさは太くしない）。 */
export const Current: Story = {
  name: "今見ている 1 枚",
  args: { isCurrent: true },
};

export const NotCurrent: Story = {
  name: "他の artboard",
  args: { isCurrent: false },
};
