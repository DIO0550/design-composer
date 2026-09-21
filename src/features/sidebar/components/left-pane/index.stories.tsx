import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactElement } from "react";
import { fn } from "storybook/test";
import {
  type LeftPaneView,
  LeftPaneViews,
} from "@/features/sidebar/components/left-pane-rail";
import type { LeftPaneViewContent } from "@/features/sidebar/types/LeftPaneViewContent";
import { Option } from "@/utils/Option";
import { LeftPane } from "./index";

/**
 * 中身の代役に並べる行。
 *
 * @param label 行の頭に付ける語
 * @param count 並べる本数
 * @returns 1 から数えた行の名前の並び
 */
function sampleRows(label: string, count: number): readonly string[] {
  return Array.from({ length: count }, (_, index) => `${label} ${index + 1}`);
}

/** 中身の代役。器が出すもの（帯・検索欄・本体・フッター）だけを見たいので行を並べるだけ。 */
function SampleBody({
  rows,
}: Readonly<{ rows: readonly string[] }>): ReactElement {
  return (
    <ul className="flex flex-col gap-1 text-gray-700 text-xs">
      {rows.map((row) => (
        <li key={row}>{row}</li>
      ))}
    </ul>
  );
}

/** フッターの代役。下端に固定されていることが分かればよいので境界線だけ実物に合わせる。 */
function SampleFooter(): ReactElement {
  return (
    <div className="shrink-0 border-[#f0f0f0] border-t p-3 text-gray-700 text-xs">
      下端に固定するもの
    </div>
  );
}

/**
 * 行き先ごとの中身の代役。
 *
 * 実物（`LayersPanel` / `AssetsPanel` / `TokenList`）は差さない。組み立ては
 * `opened-document-editor` が持っており、ここへ写すと同じ組み立てが 2 箇所に出る。行き先
 * ごとの絵は各パネルのストーリーが持つ。
 *
 * フッターを持つ行き先の本体だけは、パネルをスクロールさせる長さにしてある。スクロールする
 * 本体と下端のフッターが同じ絵に載るのはここだけで、実物のパネルのストーリーは殻
 * （`LeftPaneShell`）に入っていて帯もフッターも持たない。
 *
 * @returns 検索欄を持つ行き先・持つうえでフッターも持つ行き先・持たない行き先の 3 つ
 */
function sampleContents(): Readonly<Record<LeftPaneView, LeftPaneViewContent>> {
  return {
    [LeftPaneViews.Layers]: {
      kind: "searchable",
      search: "Search layers",
      body: (query) => (
        <SampleBody
          rows={sampleRows("layer", 6).filter((row) => row.includes(query))}
        />
      ),
      footer: Option.none,
    },
    [LeftPaneViews.Assets]: {
      kind: "searchable",
      search: "Search assets",
      body: (query) => (
        <SampleBody
          rows={sampleRows("asset", 40).filter((row) => row.includes(query))}
        />
      ),
      footer: Option.some(<SampleFooter />),
    },
    [LeftPaneViews.Tokens]: {
      kind: "unsearchable",
      body: <SampleBody rows={sampleRows("token", 6)} />,
      footer: Option.none,
    },
  };
}

const meta = {
  title: "features/sidebar/LeftPane",
  component: LeftPane,
  parameters: { layout: "fullscreen" },
  args: {
    onSelectView: fn(),
    contents: sampleContents(),
    isFrozen: false,
  },
  // 実際の幅（レール 56px + パネル 248px）と高さで見ないと、行の詰まり方が分からない。
  decorators: [
    (Story) => (
      <div className="flex h-[36rem] w-76 border-gray-300 border-r bg-white">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LeftPane>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Searchable: Story = {
  name: "検索欄を持つ行き先",
  args: { view: LeftPaneViews.Layers },
};

/** 検索欄とフッターの両方を持つ行き先。本体がパネルより長く、フッターは下端に残る。 */
export const SearchableWithFooter: Story = {
  name: "検索欄とフッターを持つ行き先",
  args: { view: LeftPaneViews.Assets },
};

export const Unsearchable: Story = {
  name: "検索欄を持たない行き先",
  args: { view: LeftPaneViews.Tokens },
};

/**
 * 外部編集でファイルが壊れているとき。見出しの右端が `凍結中` になる。淡色と操作不可は器
 * （`EditorLayout.LeftPane`）が持つので、ここには出ない。
 */
export const Frozen: Story = {
  name: "凍結中",
  args: {
    view: LeftPaneViews.Layers,
    isFrozen: true,
  },
};
