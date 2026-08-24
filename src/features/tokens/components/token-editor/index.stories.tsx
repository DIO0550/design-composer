import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps, ReactElement } from "react";
import { fn } from "storybook/test";
import { RightPaneShell } from "@/components/__stories__/right-pane-shell";
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
 * 呼べるのは、どちらも横断層にあるため（#297）。ペインの殻も横断層の代わり
 * （`RightPaneShell`）をデコレータで着せる（#300）。
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
  decorators: [
    (Story) => (
      <RightPaneShell height="pane">
        <Story />
      </RightPaneShell>
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
