import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps, ReactElement } from "react";
import { fn } from "storybook/test";
import { PaneBody } from "@/components/pane-body";
import { PaneHeading } from "@/components/pane-heading";
import {
  NoTokenSelection,
  sampleTokenSelection,
} from "@/features/tokens/__stories__/sample-token-document";
import { TokenEditor } from "./index";

/**
 * 帯と本文を実画面と同じ並びで見る。
 *
 * 帯と本文は編集画面が着せるのと同じもの（`PaneHeading` / `PaneBody`）。真似ずに
 * 呼べるのは、どちらも横断層にあるため（#297）。ペインの殻（`EditorLayout.RightPane`）
 * だけは編集画面の組み立てに属していてこの feature からは呼べないので、幅と枠線は
 * デコレータで代わりに作る。
 */
function TokenEditorPanel(
  props: ComponentProps<typeof TokenEditor.Body>,
): ReactElement {
  return (
    <>
      <PaneHeading>
        <TokenEditor.Title selection={props.selection} />
      </PaneHeading>
      <PaneBody>
        <TokenEditor.Body {...props} />
      </PaneBody>
    </>
  );
}

const meta = {
  title: "features/tokens/TokenEditor",
  component: TokenEditorPanel,
  parameters: { layout: "padded" },
  /*
   * ペインの殻の代わり。帯の下線を両端まで届かせるため、殻は余白を持たない
   * （`EditorLayout.RightPane` と同じ形）。高さを固定するのは、実画面と同じ縦の長さで
   * 見るため。どのストーリーも中身は 32rem に収まるので、スクロールは絵に出ない。
   *
   * Why not: この殻は `features/inspector` のストーリーと綴りが同じだが、共有していない。
   * フィーチャを跨いだストーリー専用ヘルパーの置き場所を決める判断が要るため（#300）。
   */
  decorators: [
    (Story) => (
      <div className="flex h-[32rem] w-72 flex-col border border-gray-300 bg-white">
        <Story />
      </div>
    ),
  ],
  args: {
    onSetTokenValue: fn(),
    onRenameToken: fn(),
    onRemoveToken: fn(),
  },
} satisfies Meta<typeof TokenEditorPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "選択されていない",
  args: { selection: NoTokenSelection },
};

export const ColorSelected: Story = {
  name: "色トークンを選択中",
  args: {
    selection: sampleTokenSelection({ kind: "colors", name: "primary" }),
  },
};

export const SpacingSelected: Story = {
  name: "間隔トークンを選択中",
  args: { selection: sampleTokenSelection({ kind: "spacing", name: "md" }) },
};

export const ShadowSelected: Story = {
  name: "影トークンを選択中",
  args: { selection: sampleTokenSelection({ kind: "shadows", name: "md" }) },
};

export const TypographySelected: Story = {
  name: "書体トークンを選択中",
  args: {
    selection: sampleTokenSelection({ kind: "typography", name: "body" }),
  },
};

export const RadiusSelected: Story = {
  name: "角丸トークンを選択中",
  args: { selection: sampleTokenSelection({ kind: "radius", name: "md" }) },
};
