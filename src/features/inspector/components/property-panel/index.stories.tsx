import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps, ReactElement } from "react";
import { expect, fn, screen, userEvent } from "storybook/test";
import { RightPaneShell } from "@/components/__stories__/right-pane-shell";
import { PaneBody } from "@/components/pane-body";
import { PaneHeading } from "@/components/pane-heading";
import {
  DesignDocument,
  DocumentTemplate,
} from "@/domains/dcmp/design-document";
import { DocumentSelection } from "@/domains/document-selection";
import { PropertyPanel, ShorthandLabels } from "./index";

/** 帯の幅に収まらない名前。省略の見え方を視覚差分で見るためだけの状態。 */
const LongNodeName = "very-long-node-name-that-does-not-fit-in-the-heading";

/**
 * このパネルのストーリー用のサンプルドキュメント。
 *
 * `features/editor/__stories__/sample-editor-state.ts` から、ストーリーが選ぶ 2 枚
 * （`home` / `overflow`）を写している（`EditorState` そのものなのでこの feature からは
 * 持ち込めない）。組み直さず写すのは、別のドキュメントに替えると 11 本すべての絵が
 * 変わり、移設で変わったのか組み直しで変わったのかが視覚差分から読めなくなるため。
 *
 * `unset-box` / padding の 2 つの Box / 名前の長いノードは、このパネルにしか要らない
 * 状態なのでここで足している。
 */
const SampleDocument = DesignDocument.create({
  tokens: DocumentTemplate.Default.tokens,
  components: DocumentTemplate.Default.components,
  artboards: [
    {
      name: "home",
      width: 360,
      height: 240,
      props: {
        direction: "column",
        gap: "md",
        paddingTop: "lg",
        paddingRight: "lg",
        paddingBottom: "lg",
        paddingLeft: "lg",
        background: "white",
      },
      children: [
        {
          name: "home-title",
          type: "Text",
          props: { content: "ホーム", typography: "heading" },
        },
        {
          name: "home-login",
          ref: "primary-button",
          overrides: { label: "ログイン" },
        },
      ],
    },
    {
      name: "overflow",
      width: 240,
      height: 160,
      props: {
        paddingTop: "md",
        paddingRight: "md",
        paddingBottom: "md",
        paddingLeft: "md",
        background: "white",
      },
      children: [
        {
          name: "overflow-wide",
          type: "Box",
          props: {
            widthMode: "fixed",
            width: 480,
            heightMode: "fixed",
            height: 320,
            background: "primary",
            radius: "md",
          },
          children: [],
        },
      ],
    },
  ],
});

/**
 * 既存のストーリーが持っていない状態を視覚差分に載せるための Box。
 * 大半の prop が未指定（既定の注記が出る行）で、`background` だけが
 * 実在しないトークンを指す（見本の出ない色の行）。
 */
const UnsetDocument = DesignDocument.create({
  artboards: [
    {
      name: "home",
      width: 360,
      height: 240,
      children: [
        { name: "unset-box", type: "Box", props: { background: "missing" } },
      ],
    },
  ],
});

/**
 * padding の 4 辺が揃っている Box と、揃っていない Box。
 * 束ねた行は畳んだ 2 欄・4 辺の欄・不揃いで見え方が変わるので、
 * 3 つとも視覚差分に載せる（happy-dom は Tailwind を解決しないので、
 * 半幅セルの崩れに気づける手段が視覚差分しか無い）。
 */
const PaddingDocument = DesignDocument.create({
  tokens: DocumentTemplate.Default.tokens,
  artboards: [
    {
      name: "home",
      width: 360,
      height: 240,
      children: [
        {
          name: "uniform-padding-box",
          type: "Box",
          props: {
            paddingTop: "md",
            paddingRight: "md",
            paddingBottom: "md",
            paddingLeft: "md",
          },
        },
        {
          name: "mixed-padding-box",
          type: "Box",
          props: {
            paddingTop: "sm",
            paddingRight: "lg",
            paddingBottom: "md",
            paddingLeft: "lg",
          },
        },
      ],
    },
  ],
});

const LongNameDocument = DesignDocument.create({
  artboards: [
    {
      name: "home",
      width: 360,
      height: 240,
      children: [{ name: LongNodeName, type: "Box" }],
    },
  ],
});

/**
 * 帯と本文を実画面と同じ並びで見る。
 *
 * 帯と本文は編集画面が着せるのと同じもの（`PaneHeading` / `PaneBody`）。真似ずに
 * 呼べるのは、どちらも横断層にあるため（#297）。ペインの殻も横断層の代わり
 * （`RightPaneShell`）をデコレータで着せる（#300）。
 */
function PropertyPanelPane(
  props: ComponentProps<typeof PropertyPanel.Body>,
): ReactElement {
  return (
    <>
      <PaneHeading>
        <PropertyPanel.Title selection={props.selection} />
      </PaneHeading>
      <PaneBody>
        <PropertyPanel.Body {...props} />
      </PaneBody>
    </>
  );
}

const meta = {
  title: "features/inspector/PropertyPanel",
  component: PropertyPanelPane,
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <RightPaneShell height="pane">
        <Story />
      </RightPaneShell>
    ),
  ],
  args: {
    isFrozen: false,
    onClearSelection: fn(),
    onEditProp: fn(),
    instance: { goToSource: fn(), selectAllInstances: fn(), detach: fn() },
  },
} satisfies Meta<typeof PropertyPanelPane>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "選択されていない",
  args: { selection: DocumentSelection.fromNames(SampleDocument, []) },
};

export const Selected: Story = {
  name: "artboard を選択中",
  args: { selection: DocumentSelection.fromNames(SampleDocument, ["home"]) },
};

export const TextSelected: Story = {
  name: "Text ノードを選択中",
  args: {
    selection: DocumentSelection.fromNames(SampleDocument, ["home-title"]),
  },
};

export const InstanceSelected: Story = {
  name: "インスタンスを選択中（publicProps から生成）",
  args: {
    selection: DocumentSelection.fromNames(SampleDocument, ["home-login"]),
  },
};

export const BoxSelected: Story = {
  name: "Box ノードを選択中",
  args: {
    selection: DocumentSelection.fromNames(SampleDocument, ["overflow-wide"]),
  },
};

export const Unset: Story = {
  name: "未指定の prop だけの Box を選択中",
  args: {
    selection: DocumentSelection.fromNames(UnsetDocument, ["unset-box"]),
  },
};

/** 名前が帯の幅に収まらない状態（省略されることを視覚差分で見る）。 */
export const LongName: Story = {
  name: "名前が長いノードを選択中",
  args: {
    selection: DocumentSelection.fromNames(LongNameDocument, [LongNodeName]),
  },
};

/**
 * 外部編集でファイルが壊れているとき（#135）。見出しは選んでいたものを保ったまま、
 * 本文だけが「選択は凍結中」になる（何を選んでいたかは消さない）。
 */
export const Frozen: Story = {
  name: "凍結中",
  args: {
    selection: DocumentSelection.fromNames(SampleDocument, ["home"]),
    isFrozen: true,
  },
};

/** 4 辺が揃っているとき。畳んだ 2 欄に同じ値が出る。 */
export const PaddingUniform: Story = {
  name: "padding が揃っている Box を選択中",
  args: {
    selection: DocumentSelection.fromNames(PaddingDocument, [
      "uniform-padding-box",
    ]),
  },
};

/** 4 辺が揃っていないとき。畳んだ欄が `不揃い` になる。 */
export const PaddingMixed: Story = {
  name: "padding が不揃いな Box を選択中",
  args: {
    selection: DocumentSelection.fromNames(PaddingDocument, [
      "mixed-padding-box",
    ]),
  },
};

/**
 * 4 辺を個別に出したとき。切り替えは `useState` なので、押した後の
 * 半幅セル 2×2 は `play` を通さないと視覚差分に載らない。
 */
export const PaddingPerEdge: Story = {
  name: "padding を辺ごとに出した Box を選択中",
  args: {
    selection: DocumentSelection.fromNames(PaddingDocument, [
      "mixed-padding-box",
    ]),
  },
  play: async () => {
    await userEvent.click(
      screen.getByRole("button", { name: ShorthandLabels.perEdge }),
    );
    await expect(
      screen.getByRole("combobox", { name: "Padding Top" }),
    ).toBeDefined();
  },
};
