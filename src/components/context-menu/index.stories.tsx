import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps, ReactElement } from "react";
import { Option } from "@/utils/Option";
import { ContextMenu, ContextMenuTones } from "./index";

/**
 * 右クリックで開くメニュー。
 *
 * **色・区切り・割り当ての欄はテストでは守れない。** class 名を assert すると実装詳細のテス
 * トになり、happy-dom は Tailwind を解決しないので、押せない行の淡色と `Delete` の赤に気づ
 * く手段はここの視覚差分だけ。
 *
 * 本番は窓の座標へ `position: fixed` で置くので、器は与えず `at` を左上に寄せて撮る。
 */
const meta = {
  title: "components/ContextMenu",
  component: ContextMenu,
  parameters: { layout: "padded" },
  args: { at: { x: 8, y: 8 }, onClose: () => {} },
  decorators: [
    (Story) => (
      // fixed の基準は窓なので、撮影範囲を確保するためだけの器
      <div className="h-56">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ContextMenu>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * 1 行。既定は「押せる・通常の色・割り当てなし」。
 *
 * テスト側の `row` と同じ形だが寄せていない。`__tests__/` と `__stories__/` は互いに
 * import しない置き方（rules/architecture.md）なので、寄せるには production 側へ出すことに
 * なり、本番では 1 度も呼ばれない組み立てが公開 API に並ぶ。
 */
function row(
  label: string,
  props: Partial<Omit<ComponentProps<typeof ContextMenu.Item>, "label">> = {},
): ReactElement {
  return (
    <ContextMenu.Item
      key={label}
      label={label}
      shortcut={Option.none}
      tone={ContextMenuTones.Normal}
      isEnabled={true}
      onSelect={() => {}}
      {...props}
    />
  );
}

/**
 * 行を 1 組にまとめる。組のあいだに区切りが入る。
 *
 * @param rows 並べる行
 * @returns メニューへ入れる 1 組
 */
function group(...rows: readonly ReactElement[]): ReactElement {
  return (
    <ContextMenu.Group key={rows.map((entry) => entry.key).join()}>
      {rows}
    </ContextMenu.Group>
  );
}

/**
 * ノードを右クリックしたときの並び（docs/06-ui.md「コンテキストメニュー」）。
 *
 * UI 案 docs/Design Composer.html の `Context menu` と同じ状態にしてある。artboard 直下に
 * 1 つしか無いノードなので前面へ / 背面へは押せず、Box なのでインスタンスの解除も押せない。
 */
export const SelectedNode: Story = {
  name: "ノードを選んでいるとき",
  args: {
    children: [
      group(
        row("Copy", { shortcut: Option.some("⌘C") }),
        row("Paste", { shortcut: Option.some("⌘V") }),
      ),
      group(
        row("Bring forward", {
          shortcut: Option.some("⌘]"),
          isEnabled: false,
        }),
        row("Send backward", { shortcut: Option.some("⌘["), isEnabled: false }),
      ),
      group(row("Detach instance", { isEnabled: false })),
      group(
        row("Delete", {
          shortcut: Option.some("Delete"),
          tone: ContextMenuTones.Danger,
        }),
      ),
    ],
  },
};

/** artboard を右クリックしたときの並び。削除だけが並ぶ。 */
export const SelectedArtboard: Story = {
  name: "artboard を選んでいるとき",
  args: {
    children: group(
      row("Delete", {
        shortcut: Option.some("Delete"),
        tone: ContextMenuTones.Danger,
      }),
    ),
  },
};

/** 空き領域を右クリックしたときの並び。貼る先が無いのでペーストは押せない。 */
export const EmptyArea: Story = {
  name: "空き領域を右クリックしたとき",
  args: {
    children: [
      group(row("Paste", { shortcut: Option.some("⌘V"), isEnabled: false })),
      group(
        row("Undo", { shortcut: Option.some("⌘Z") }),
        row("Redo", { shortcut: Option.some("Shift+⌘Z") }),
      ),
    ],
  },
};
