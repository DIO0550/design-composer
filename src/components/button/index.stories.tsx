import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactElement } from "react";
import {
  Button,
  type ButtonFramedKind,
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

/**
 * 箱型の 1 種類を、大きさごとに平常と押せないときで並べる。
 *
 * @param kind 並べる箱型の種類
 * @param label ボタンの綴り
 * @returns 大きさを行、平常と押せないときを列にした表
 */
function FramedKindSheet({
  kind,
  label,
}: Readonly<{ kind: ButtonFramedKind; label: string }>): ReactElement {
  // Object.values(ButtonSizes) にはしない。Storybook の docgen（react-docgen-typescript）は
  // `.tsx` で export した定数にも `displayName` / `__docgenInfo` を書き足すので、それも大きさとして並んでしまう。
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

/** その場の主な操作。 */
export const Primary: Story = {
  name: "プライマリ",
  render: () => (
    <FramedKindSheet
      kind={ButtonKinds.Primary}
      label="Go to source component"
    />
  ),
};

/** 主な操作の脇に置く、控えめな操作。 */
export const Secondary: Story = {
  name: "セカンダリ",
  render: () => (
    <FramedKindSheet kind={ButtonKinds.Secondary} label="Detach instance" />
  ),
};

/** 消す・壊す向きの操作。 */
export const Danger: Story = {
  name: "デンジャー",
  render: () => (
    <FramedKindSheet kind={ButtonKinds.Danger} label="Delete token" />
  ),
};

/** その画面を代表する操作。中身に置いた `◆` もボタンの文字色を継ぐ。 */
export const Emphasis: Story = {
  name: "強調",
  render: () => (
    <FramedKindSheet kind={ButtonKinds.Emphasis} label="◆ Create component" />
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

/** 26px の正方形に収まるアイコンの操作。 */
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

/** 見出しや帯の行の中に置く、記号や数値だけを中身に持つ操作。字の大きさは置いた行から継ぐので、13px の + を持つ見出しの行と 11px の帯に置いて並べる。 */
export const InlineIcon: Story = {
  name: "行内のアイコン",
  render: () => (
    <div className="flex w-60 flex-col gap-3 text-gray-900">
      <div className="flex items-center justify-between text-[13px]">
        <span className="font-semibold text-[11px]">Artboards</span>
        <Button kind={ButtonKinds.InlineIcon} aria-label="追加">
          +
        </Button>
      </div>
      <div className="flex items-center gap-1 text-[11px]">
        <span>Zoom</span>
        <Button kind={ButtonKinds.InlineIcon} aria-label="等倍に戻す">
          55%
        </Button>
      </div>
      <div className="flex items-center justify-between text-[13px]">
        <span className="font-semibold text-[11px]">Artboards</span>
        <Button kind={ButtonKinds.InlineIcon} aria-label="追加" disabled={true}>
          +
        </Button>
      </div>
    </div>
  ),
};
