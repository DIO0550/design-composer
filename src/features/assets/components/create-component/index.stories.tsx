import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, screen, userEvent } from "storybook/test";
import { LeftPaneShell } from "@/components/__stories__/left-pane-shell";
import { SampleAssetsDocument } from "@/features/assets/__stories__/sample-assets-document";
import { Option } from "@/utils/Option";
import { CreateComponent } from "./index";

/**
 * 入力欄を開いた状態を作るために打つ名前。`SampleAssetsDocument` のどの名前とも
 * 衝突しないので、打ち終えた時点で作成ボタンが押せる側に倒れる。
 */
const DraftName = "info-panel";

/**
 * 入力欄を開いて `DraftName` を打つところまで進める。
 *
 * ボタンと入力欄を綴りで引くのは、`Labels` が非公開のため。撮るためだけに公開 API を
 * 広げない（同じ綴りは `__tests__/` も直書きしている）。
 */
async function openDraft(): Promise<void> {
  await userEvent.click(
    screen.getByRole("button", { name: /Create component/ }),
  );
  await userEvent.type(
    screen.getByRole("textbox", { name: "部品名" }),
    DraftName,
  );
}

const meta = {
  title: "features/assets/CreateComponent",
  component: CreateComponent,
  parameters: { layout: "padded" },
  args: {
    document: SampleAssetsDocument,
    singleName: Option.some("home-title"),
    isFrozen: false,
    onCreate: fn(),
  },
  // 実際の幅（248px のパネル）で見ないと、ボタンと 1 行の収まり方が分からない。
  // パネル下端に固定されるフッターなので、本文の余白（p-3）は持たせない。
  decorators: [
    (Story) => (
      <LeftPaneShell>
        <Story />
      </LeftPaneShell>
    ),
  ],
} satisfies Meta<typeof CreateComponent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Ready: Story = {
  name: "ノードを選んでいる",
};

export const InstanceSelected: Story = {
  name: "インスタンスを選んでいる",
  args: { singleName: Option.some("home-login") },
};

export const ArtboardSelected: Story = {
  name: "artboard を選んでいる",
  args: { singleName: Option.some("home") },
};

export const Unselected: Story = {
  name: "何も選んでいない",
  args: { singleName: Option.none },
};

/*
 * 入力欄が出てフッターが 3 段になる状態。`index.tsx` が「`shrink-0` を外すとフッターが
 * 潰れるが、happy-dom は Tailwind を解決しないためテストでは落ちない。気づく手段は
 * Storybook の視覚差分だけ」と書いている状態が、これまで撮影対象に無かった。
 *
 * 空の下書きではなく使える名前を打った状態で撮るのは、入力欄と押せる作成ボタンの
 * 両方を 1 枚で覆えるため。
 */
export const Naming: Story = {
  name: "部品名を打っている",
  play: async () => {
    await openDraft();
    await expect(
      screen
        .getByRole("button", { name: /Create component/ })
        .hasAttribute("disabled"),
    ).toBe(false);
  },
};

/*
 * このコンポーネント自身が持つ唯一の凍結の出し分け（下書きを打った後の作成ボタンが
 * 押せなくなる）。
 *
 * Why not: 実画面の凍結の見え方はこれではない。淡色（`opacity-45 saturate-[0.4]`）と
 * `inert` は器（`EditorLayout.LeftPane`）が持つので、単体のこの絵には出ない。
 */
export const Frozen: Story = {
  name: "ファイルが不正な間に部品名を打っている",
  args: { isFrozen: true },
  play: async () => {
    await openDraft();
    await expect(
      screen
        .getByRole("button", { name: /Create component/ })
        .hasAttribute("disabled"),
    ).toBe(true);
  },
};
