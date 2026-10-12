import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactElement } from "react";
import {
  Button,
  type ButtonKind,
  ButtonKinds,
  type ButtonSize,
  ButtonSizes,
} from "./index";

/**
 * 基本のボタン。種類ごとに 1 本で、平常と押せないときを並べる。箱型は大きさも並べる。
 *
 * hover の見え方は視覚差分では撮れないので、Storybook で触って確かめる。
 */
const meta = {
  title: "components/Button",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

/** 箱型の種類。 */
type BoxKind = Exclude<
  ButtonKind,
  typeof ButtonKinds.Text | typeof ButtonKinds.Icon
>;

/**
 * 箱型の 1 種類を、大きさごとに平常と押せないときで並べる。
 *
 * @param kind 並べる箱型の種類
 * @param label ボタンの綴り
 * @returns 大きさを行、平常と押せないときを列にした表
 */
function BoxKindSheet({
  kind,
  label,
}: Readonly<{ kind: BoxKind; label: string }>): ReactElement {
  // Object.values(ButtonSizes) にはしない。Storybook の docgen が export した定数へ
  // `__docgenInfo` を書き足すので、それも 1 つの大きさとして並んでしまう。
  const sizes: readonly ButtonSize[] = [
    ButtonSizes.Small,
    ButtonSizes.Regular,
    ButtonSizes.Large,
  ];

  return (
    <div className="grid grid-cols-[auto_auto_auto] items-center justify-start gap-3 text-[11px] text-gray-500">
      {sizes.map((size) => (
        <div key={size} className="contents">
          <span>{size}</span>
          <span>
            <Button kind={kind} size={size}>
              {label}
            </Button>
          </span>
          <span>
            <Button kind={kind} size={size} disabled={true}>
              {label}
            </Button>
          </span>
        </div>
      ))}
    </div>
  );
}

/** 押す先を示す既定の操作。 */
export const Primary: Story = {
  name: "プライマリ",
  render: () => (
    <BoxKindSheet kind={ButtonKinds.Primary} label="Go to source component" />
  ),
};

/** 勧め分けをしない操作。 */
export const Secondary: Story = {
  name: "セカンダリ",
  render: () => (
    <BoxKindSheet kind={ButtonKinds.Secondary} label="Detach instance" />
  ),
};

/** 取り消せない削除などの操作。 */
export const Danger: Story = {
  name: "デンジャー",
  render: () => <BoxKindSheet kind={ButtonKinds.Danger} label="Delete token" />,
};

/** その画面でいちばん勧めたい操作。中身に置いた `◆` もボタンの文字色を継ぐ。 */
export const Emphasis: Story = {
  name: "強調",
  render: () => (
    <BoxKindSheet kind={ButtonKinds.Emphasis} label="◆ Create component" />
  ),
};

/** 文の中に置く操作。前後の文と並べて、行の中での収まりを見る。 */
export const Text: Story = {
  name: "テキスト",
  render: () => (
    <div className="flex flex-col gap-3 text-gray-900 text-xs">
      <p>
        2 nodes use this token{" "}
        <Button kind={ButtonKinds.Text}>reveal in tree</Button>
      </p>
      <p>
        2 nodes use this token{" "}
        <Button kind={ButtonKinds.Text} disabled={true}>
          reveal in tree
        </Button>
      </p>
    </div>
  ),
};

/** 綴りを持たないアイコンだけの操作。 */
export const Icon: Story = {
  name: "アイコン",
  render: () => (
    <div className="flex items-center gap-3">
      <Button kind={ButtonKinds.Icon} aria-label="追加">
        +
      </Button>
      <Button kind={ButtonKinds.Icon} aria-label="追加" disabled={true}>
        +
      </Button>
    </div>
  ),
};
