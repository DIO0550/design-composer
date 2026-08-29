import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, screen, userEvent } from "storybook/test";
import { LeftPaneShell } from "@/components/__stories__/left-pane-shell";
import { SampleAssetsDocument } from "@/features/assets/__stories__/sample-assets-document";
import { Option } from "@/utils/Option";
import { CreateComponent } from "./index";

/**
 * 入力欄に打つ名前。`SampleAssetsDocument` のどの名前とも衝突しないので、
 * **名前を理由には**押せなくならない（凍結中は別の理由で押せない）。
 */
const DraftName = "info-panel";

/**
 * 入力欄を開いて `DraftName` を打つところまで進める。
 *
 * Why not: `Labels` を公開して綴りを共有しない。7 個の綴りをまとめた内部の表なので、
 * 公開すると撮影に要らない `instance` / `artboard` まで外へ出る。同じ問題に
 * `ShorthandLabels`（公開して共有する）という逆向きの先例があるが、あちらは
 * 束ねた行が出す綴りそのものが通しテストの引き当てに要る点が違う。
 */
async function enterDraftName(): Promise<void> {
  await userEvent.click(
    screen.getByRole("button", { name: /Create component/ }),
  );
  await userEvent.type(
    screen.getByRole("textbox", { name: "部品名" }),
    DraftName,
  );
}

/**
 * 作成ボタンが押せない状態か。
 *
 * @returns 押せないなら true
 */
function isCreateDisabled(): boolean {
  return screen
    .getByRole("button", { name: /Create component/ })
    .hasAttribute("disabled");
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
 * 入力欄が出てフッターが 3 段になる状態。押す前しか撮っていなかったので、入力欄の
 * 見た目（幅・高さ・プレースホルダ）はどの story にも映っていなかった。
 *
 * 空の下書きではなく使える名前を打った状態で撮るのは、入力欄と押せる作成ボタンの
 * 両方を 1 枚で覆えるため。
 *
 * この `play` に絵を預けている点は弱い。撮影は「同じフレームが 2 回続いたら採用」なので、
 * `play` が間に合わなければ押す前の絵（`Ready` とほぼ同じ）が焼き付き、しかも失敗が
 * 誰にも見えない（`play` の `expect` は CI のどこでも走らない。後述 `Frozen`）。
 */
export const Naming: Story = {
  name: "部品名を打っている",
  play: async () => {
    await enterDraftName();
    await expect(isCreateDisabled()).toBe(false);
  },
};

/*
 * 凍結が絵に出るのはここだけ（`isFrozen` は作成ボタンの `disabled` と Enter での送信の
 * 2 つを止めるが、後者は絵に出ない）。
 *
 * この `play` の `expect` は凍結を守っていない。`@storybook/test-runner` も
 * `addon-vitest` も入れていないので CI のどこでも走らず、落とせるのは人が interactions
 * パネルを見たときだけ。判定を守っているのは `__tests__/create-component.edge.test.tsx`
 * と、この絵の画素差（VRT）の 2 つ。
 *
 * Why not: 実画面の凍結の見え方はこれではない。淡色（`opacity-45 saturate-[0.4]`）と
 * `inert` は器（`EditorLayout.LeftPane`）が持つので、単体のこの絵には出ない。
 */
export const Frozen: Story = {
  name: "ファイルが不正な間に部品名を打っている",
  args: { isFrozen: true },
  play: async () => {
    await enterDraftName();
    await expect(isCreateDisabled()).toBe(true);
  },
};
