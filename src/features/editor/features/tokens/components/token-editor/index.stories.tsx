import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps, ReactElement } from "react";
import { fn } from "storybook/test";
import { RightPaneShell } from "@/components/__stories__/right-pane-shell";
import { PaneBody } from "@/components/pane-body";
import { PaneHeading } from "@/components/pane-heading";
import { DesignDocument } from "@/domains/dcmp/design-document";
import { TokenSet } from "@/domains/dcmp/token";
import { TokenSelection } from "@/domains/session/token-selection";
import {
  NoTokenSelection,
  sampleTokenSelection,
} from "@/features/editor/features/tokens/__stories__/sample-token-document";
import { Option } from "@/utils/Option";
import { TokenEditor } from "./index";

/**
 * 帯と本文を実画面と同じ並びで見る。
 *
 * 帯と本文は編集画面が着せるのと同じもの（`PaneHeading` / `PaneBody`）。ペインの殻も横断層
 * の代わり（`RightPaneShell`）をデコレータで着せる。
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
  title: "features/editor/features/tokens/TokenEditor",
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

export const GradientSelected: Story = {
  name: "グラデーショントークンを選択中",
  args: {
    selection: sampleTokenSelection({ kind: "gradients", name: "brand" }),
  },
};

/*
 * 壊れた色はこのファイルの中で組む。共有のサンプルへ足すと、一覧・Used by などほかのストーリーの
 * 視覚差分まで広がる。
 */

export const BrokenColorSelected: Story = {
  name: "hex として読めない色トークンを選択中",
  args: {
    selection: TokenSelection.create(
      DesignDocument.create({
        tokens: { ...TokenSet.empty(), colors: { broken: "RED" } },
      }),
      Option.some({ kind: "colors", name: "broken" }),
    ),
  },
};

export const BrokenStopSelected: Story = {
  name: "1 件目の stop の色が hex として読めないグラデーションを選択中",
  args: {
    selection: TokenSelection.create(
      DesignDocument.create({
        tokens: {
          ...TokenSet.empty(),
          gradients: {
            brand: {
              shape: "linear",
              angle: 90,
              stops: [
                { color: "RED", ratio: 0 },
                { color: "#1d4ed8", ratio: 1 },
              ],
            },
          },
        },
      }),
      Option.some({ kind: "gradients", name: "brand" }),
    ),
  },
};
