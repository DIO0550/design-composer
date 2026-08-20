import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps, ReactElement } from "react";
import { fn } from "storybook/test";
import {
  NoTokenSelection,
  sampleTokenSelection,
} from "@/features/tokens/__stories__/sample-token-document";
import { TokenEditor } from "./index";

/**
 * 帯と本文を実画面と同じ並びで見る。
 *
 * 器（`EditorLayout.RightPane`）は編集画面の組み立てに属していてこの feature からは
 * import できないので、帯の高さと本文の余白だけをここで真似ている。
 *
 * **この写しが、器を落としたことに気づける唯一の手段**（テストは 1 件も落ちない）。
 * `editor-layout` の `RightPaneHeading` / `RightPaneBody` を直したらここも直す。
 */
function TokenEditorPanel(
  props: ComponentProps<typeof TokenEditor.Body>,
): ReactElement {
  return (
    <>
      <div className="flex h-11 shrink-0 items-center gap-2 border-gray-300 border-b px-3">
        <TokenEditor.Title selection={props.selection} />
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-3">
        <TokenEditor.Body {...props} />
      </div>
    </>
  );
}

const meta = {
  title: "features/tokens/TokenEditor",
  component: TokenEditorPanel,
  parameters: { layout: "padded" },
  /*
   * 実際の右ペインと同じ器で見る。帯は器の両端まで届くので、
   * 余白は器ではなく帯と本文がそれぞれ内側に持つ（`EditorLayout.RightPane` と同じ形）。
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
