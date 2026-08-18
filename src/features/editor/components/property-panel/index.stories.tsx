import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, screen, userEvent } from "storybook/test";
import { DesignDocument, DocumentTemplate } from "@/domains/design-document";
import {
  FileInvalidEditorState,
  SampleEditorState,
} from "@/features/editor/__stories__/sample-editor-state";
import { EditorState } from "@/features/editor/domains/editor-state";
import { PropertyPanel, ShorthandLabels } from "./index";

/** 帯の幅に収まらない名前。省略の見え方を視覚差分で見るためだけの状態。 */
const LongNodeName = "very-long-node-name-that-does-not-fit-in-the-heading";

/**
 * 既存のストーリーが持っていない状態を視覚差分に載せるための Box。
 * 大半の prop が未指定（既定の注記が出る行）で、`background` だけが
 * 実在しないトークンを指す（見本の出ない色の行）。
 */
const UnsetEditorState = EditorState.create(
  DesignDocument.create({
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
  }),
);

/**
 * padding の 4 辺が揃っている Box と、揃っていない Box。
 * 束ねた行は畳んだ 2 欄・4 辺の欄・不揃いで見え方が変わるので、
 * 3 つとも視覚差分に載せる（happy-dom は Tailwind を解決しないので、
 * 半幅セルの崩れに気づける手段が視覚差分しか無い）。
 */
const PaddingEditorState = EditorState.create(
  DesignDocument.create({
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
  }),
);

const LongNameEditorState = EditorState.create(
  DesignDocument.create({
    artboards: [
      {
        name: "home",
        width: 360,
        height: 240,
        children: [{ name: LongNodeName, type: "Box" }],
      },
    ],
  }),
);

const meta = {
  title: "features/editor/PropertyPanel",
  component: PropertyPanel,
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
    onClearSelection: fn(),
    onEditProp: fn(),
    instance: { goToSource: fn(), selectAllInstances: fn(), detach: fn() },
  },
} satisfies Meta<typeof PropertyPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: "選択されていない",
  args: { state: SampleEditorState },
};

export const Selected: Story = {
  name: "artboard を選択中",
  args: { state: EditorState.select(SampleEditorState, "home") },
};

export const TextSelected: Story = {
  name: "Text ノードを選択中",
  args: { state: EditorState.select(SampleEditorState, "home-title") },
};

export const InstanceSelected: Story = {
  name: "インスタンスを選択中（publicProps から生成）",
  args: { state: EditorState.select(SampleEditorState, "home-login") },
};

export const BoxSelected: Story = {
  name: "Box ノードを選択中",
  args: { state: EditorState.select(SampleEditorState, "overflow-wide") },
};

export const Unset: Story = {
  name: "未指定の prop だけの Box を選択中",
  args: { state: EditorState.select(UnsetEditorState, "unset-box") },
};

/** 名前が帯の幅に収まらない状態（省略されることを視覚差分で見る）。 */
export const LongName: Story = {
  name: "名前が長いノードを選択中",
  args: {
    state: EditorState.select(LongNameEditorState, LongNodeName),
  },
};

/**
 * 外部編集でファイルが壊れているとき（#135）。見出しは選んでいたものを保ったまま、
 * 本文だけが「選択は凍結中」になる（何を選んでいたかは消さない）。
 */
export const Frozen: Story = {
  name: "凍結中",
  args: { state: FileInvalidEditorState },
};

/** 4 辺が揃っているとき。畳んだ 2 欄に同じ値が出る。 */
export const PaddingUniform: Story = {
  name: "padding が揃っている Box を選択中",
  args: {
    state: EditorState.select(PaddingEditorState, "uniform-padding-box"),
  },
};

/** 4 辺が揃っていないとき。畳んだ欄が `不揃い` になる。 */
export const PaddingMixed: Story = {
  name: "padding が不揃いな Box を選択中",
  args: {
    state: EditorState.select(PaddingEditorState, "mixed-padding-box"),
  },
};

/**
 * 4 辺を個別に出したとき。切り替えは `useState` なので、押した後の
 * 半幅セル 2×2 は `play` を通さないと視覚差分に載らない。
 */
export const PaddingPerEdge: Story = {
  name: "padding を辺ごとに出した Box を選択中",
  args: {
    state: EditorState.select(PaddingEditorState, "mixed-padding-box"),
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
