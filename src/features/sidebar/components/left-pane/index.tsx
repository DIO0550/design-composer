import type { ReactElement } from "react";
import { LeftPanePanel } from "@/features/sidebar/components/left-pane-panel";
import {
  LeftPaneRail,
  type LeftPaneView,
  LeftPaneViewLabels,
} from "@/features/sidebar/components/left-pane-rail";
import type { LeftPaneViewContent } from "@/features/sidebar/types/LeftPaneViewContent";
import { Option } from "@/utils/Option";

/**
 * 中身が持つ検索欄の案内文。
 *
 * @param content 今の行き先の中身
 * @returns 検索欄を持つ中身ならその案内文。持たない中身では不在
 */
function searchLabelOf(content: LeftPaneViewContent): Option<string> {
  switch (content.kind) {
    case "searchable":
      return Option.some(content.search);
    case "unsearchable":
      return Option.none;
  }
}

/**
 * パネルの本体に出すもの。
 *
 * @param content 今の行き先の中身
 * @param query 検索欄に打たれた語
 * @returns 検索欄を持つ中身なら語で絞ったもの、持たない中身ならそのまま
 */
function bodyOf(content: LeftPaneViewContent, query: string): ReactElement {
  switch (content.kind) {
    case "searchable":
      return content.body(query);
    case "unsearchable":
      return content.body;
  }
}

/**
 * 左ペイン（UI 案 docs/Design Composer.html は 56px のレールと 248px の見出し付きパネルを
 * 横に並べる）。レールで選んだ行き先の中身をパネルへ出す。
 *
 * 行き先ごとの中身は持たず、組む側（`opened-document-editor`）から行き先ぶん揃った形で受け
 * 取る。中身は行き先ごとに別の feature（`features/assets` / `features/tokens`）に属しており、
 * ここが持つと器がそれらへ依存する。
 */
export function LeftPane({
  view,
  onSelectView,
  contents,
  isFrozen,
}: Readonly<{
  /** 今どの行き先か。右ペインの出し分けも同じ値で決まるので、状態は組む側が持つ。 */
  view: LeftPaneView;
  onSelectView: (view: LeftPaneView) => void;
  /** 行き先ごとの中身。 */
  contents: Readonly<Record<LeftPaneView, LeftPaneViewContent>>;
  isFrozen: boolean;
}>) {
  const content = contents[view];

  return (
    <>
      <LeftPaneRail current={view} onSelect={onSelectView} />
      {/*
        行き先を `key` にして器ごと付け替える。検索語は非永続で、行き先を変えると空へ戻る
        （docs/06-ui.md「絞り込み」）。
      */}
      <LeftPanePanel
        key={view}
        title={LeftPaneViewLabels[view]}
        /*
         * ファイルが不正な間は操作を受け付けない（器の `EditorLayout.LeftPane` が
         * `inert` にする）ので、見出しでその旨を名乗る。UI 案 Error 画面の `frozen`。
         */
        note={isFrozen ? Option.some("凍結中") : Option.none}
        search={searchLabelOf(content)}
        footer={content.footer}
      >
        {(query) => bodyOf(content, query)}
      </LeftPanePanel>
    </>
  );
}
