import {
  type LeftPaneView,
  LeftPaneViews,
} from "@/features/sidebar/components/left-pane-rail";
import type { LeftPaneViewContent } from "@/features/sidebar/types/LeftPaneViewContent";
import { Option } from "@/utils/Option";

/**
 * 器へ差す行き先ごとの中身。
 *
 * 実物のパネルを差さないのは、確かめたいのが器が引く先と出し分けだからで、実物を差すと
 * パネル側の描画を確かめることになる。行き先ごとに違う綴りを持たせて、器が引き間違えたら
 * 落ちるようにする。
 *
 * @returns 検索欄だけを持つ行き先・検索欄とフッターを持つ行き先・どちらも持たない行き先
 */
export function setupViewContents(): Readonly<
  Record<LeftPaneView, LeftPaneViewContent>
> {
  return {
    [LeftPaneViews.Layers]: {
      kind: "searchable",
      search: "Search layers",
      body: (query) => <p>{`レイヤーの中身 ${query}`}</p>,
      footer: Option.none,
    },
    [LeftPaneViews.Assets]: {
      kind: "searchable",
      search: "Search assets",
      body: () => <p>パレットの中身</p>,
      footer: Option.some(<p>パレットのフッター</p>),
    },
    [LeftPaneViews.Tokens]: {
      kind: "unsearchable",
      body: <p>トークンの中身</p>,
      footer: Option.none,
    },
  };
}
