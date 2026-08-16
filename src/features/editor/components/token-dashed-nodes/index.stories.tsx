import type { Meta, StoryObj } from "@storybook/react-vite";
import { DesignDocument } from "@/domains/design-document";
import { TokenSet } from "@/domains/token";
import { SampleEditorState } from "@/features/editor/__stories__/sample-editor-state";
import { EditorState } from "@/features/editor/domains/editor-state";
import { TokenDashedNodes } from "./index";

/**
 * 帯は灰色のキャンバス面に影付きで浮く部品なので、decorator で面と余白を与える。
 * 白地に置くと影と角丸が沈み、実画面と違うものが視覚差分の基準になる。
 */
const meta = {
  title: "features/editor/TokenDashedNodes",
  component: TokenDashedNodes,
  decorators: [
    (Story) => (
      <div className="flex bg-gray-100 p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TokenDashedNodes>;

export default meta;

type Story = StoryObj<typeof meta>;

/** キャンバス上で `primary` を指しているのは `overflow-wide` の 1 件だけ（単数形が出る）。 */
export const Single: Story = {
  name: "参照が1件",
  args: {
    state: EditorState.selectToken(SampleEditorState, {
      kind: "colors",
      name: "primary",
    }),
  },
};

/**
 * 複数形が出る状態。
 *
 * `SampleEditorState` では作れないので専用のドキュメントを組む。あちらで同じトークンを
 * 2 箇所から指しているのは artboard の props（`gap` / `paddingX`）で、artboard は
 * 破線の相手にならないため件数が 0 になる。
 */
export const Multiple: Story = {
  name: "参照が複数",
  args: {
    state: EditorState.selectToken(
      EditorState.create(
        DesignDocument.create({
          tokens: { ...TokenSet.empty(), colors: { "gray-900": "#111827" } },
          artboards: [
            {
              name: "home",
              width: 360,
              height: 240,
              children: [
                {
                  name: "home-title",
                  type: "Text",
                  props: { content: "ホーム", color: "gray-900" },
                },
                {
                  name: "home-caption",
                  type: "Text",
                  props: { content: "説明", color: "gray-900" },
                },
              ],
            },
          ],
        }),
      ),
      { kind: "colors", name: "gray-900" },
    ),
  },
};

/** 色以外は見本を持たない（`token-editor` の見出しと同じ扱い）。 */
export const NonColor: Story = {
  name: "色以外のトークン",
  args: {
    state: EditorState.selectToken(SampleEditorState, {
      kind: "typography",
      name: "heading",
    }),
  },
};
