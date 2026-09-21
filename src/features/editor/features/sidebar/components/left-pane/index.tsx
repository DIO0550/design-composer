import { LeftPanePanel } from "@/features/editor/features/sidebar/components/left-pane-panel";
import {
  LeftPaneRail,
  type LeftPaneView,
  LeftPaneViewLabels,
} from "@/features/editor/features/sidebar/components/left-pane-rail";
import type { LeftPaneViewContent } from "@/features/editor/features/sidebar/types/LeftPaneViewContent";
import { Option } from "@/utils/Option";

/**
 * 左ペイン（UI 案 docs/Design Composer.html は 56px のレールと 248px の見出し付きパネルを
 * 横に並べる）。レールで選んだ行き先の中身をパネルへ出す。
 *
 * 行き先ごとに何を出すかは持たず、組む側（`opened-document-editor`）から受け取る。ここが
 * 中身を知ると、左ペインが他の feature の部品を直接読むことになる
 * （`rules/consistency.md`「兄弟参照を禁止する理由」）。
 *
 * 見出しの綴りだけはここが引く。`LeftPaneViewLabels` はレールのラベルでもあるので、組む側
 * へ渡させるとレールとパネルの見出しが別々に決まる。
 */
export function LeftPane({
  view,
  onSelectView,
  views,
  isFrozen,
}: Readonly<{
  view: LeftPaneView;
  onSelectView: (view: LeftPaneView) => void;
  /** 行き先ごとの中身。全部の行き先が揃っていることを `Record` が型で要求する。 */
  views: Readonly<Record<LeftPaneView, LeftPaneViewContent>>;
  isFrozen: boolean;
}>) {
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
        content={views[view]}
      />
    </>
  );
}
