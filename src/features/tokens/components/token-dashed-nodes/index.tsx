import { type ReactElement, useMemo } from "react";
import { ColorSwatch } from "@/components/color-swatch";
import { TokenSelection } from "@/domains/token-selection";
import { ArrayEx } from "@/utils/ArrayEx";

/**
 * 破線が掛かっているノードの数の綴り。
 *
 * 単複を出し分けるのは、UI 案（docs/Design Composer.html の Tokens 画面）が
 * 8 件の状態しか描いておらず `1 nodes` の綴りが出せないため。
 *
 * @param count 破線が掛かっているノードの数
 * @returns 数と単位を並べた綴り
 */
function nodeCountText(count: number): string {
  return count === 1 ? "1 node" : `${count} nodes`;
}

/**
 * キャンバスの破線が何を指しているかを示す帯
 * （UI 案 docs/Design Composer.html の Tokens 画面。キャンバス下部に浮く）。
 *
 * 破線が 1 本も無いときは出さない。この帯が伝えるのは「今どれが破線になっているか」なので、
 * 破線が無いまま出しても指す相手がいない（`Used by` が 0 件でも件数を出すのとは役割が違う。
 * あちらは「使われていない」こと自体が削除の判断材料になる）。
 *
 * 左寄せ（`self-start`）を器ではなくここが持つのは、UI 案でツールバーが中央、
 * この帯だけが左に寄っているため。器の既定を変えると他の 2 つまで動く。
 *
 * 見本を出すのは色だけ。UI 案が描いているのも `#111827` の四角 1 例で、他の種別の絵は無い
 * （`token-editor` の見出しと同じ判断）。
 * Why not: `token-control` の `TokenPreview` は使わない。使うと `token-list` の
 * `PreviewSlot` と 4 枝すべてが重なる。
 *
 * 飛び先は破線の先頭。UI 案がリンクを 1 本しか描いていないので、複数ある参照元から
 * 1 つ選ぶことになり、並びは既に `collectCanvasReferrerNames` が決めている（#209）。
 *
 * @returns トークン名・破線の本数・先頭へ飛ぶリンクを並べた帯。
 *   破線が 1 本も無いときは何も出さない
 */
export function TokenDashedNodes({
  selection,
  onReveal,
}: Readonly<{
  selection: TokenSelection;
  onReveal: (nodeName: string) => void;
}>): ReactElement | null {
  const token = TokenSelection.token(selection);
  /*
   * キャンバス側と同じ走査をここでも行う。パン / ズームでこの帯まで再レンダーされるので、
   * 覚えないと数え直しがキャンバスと二重に走る（覚えたものが効くよう、呼び出し側は
   * 対を `state` ごとに 1 つだけ作る）。
   * Why not: 数え終えた名前を props で受け取らない。受け取ると、名前とトークンが
   * 食い違う組み合わせを呼び出し側が作れてしまう（対で受ければ作れない）。
   */
  const nodeNames = useMemo(
    () => TokenSelection.collectCanvasReferrerNames(selection),
    [selection],
  );

  /*
   * 帯を出す条件を「先頭が在るか」で書くのは、リンクに飛び先が必ずあることを
   * 構造で保つため（`nodeNames.length === 0` で弾くと、飛び先は `nodeNames[0]` の
   * `undefined` を含んだまま残る）。
   */
  const firstDashedNodeName = ArrayEx.first(nodeNames);
  const hasDashedNode = token.some && firstDashedNodeName.some;

  if (!hasDashedNode) {
    return null;
  }

  const selected = token.value;

  return (
    <section
      aria-label="キャンバスの破線"
      className="flex max-w-[430px] items-center gap-[9px] self-start rounded-[9px] bg-white px-3 py-2.5 text-[11px] text-[#767676] shadow-lg ring-1 ring-black/5"
    >
      {selected.kind === "colors" ? (
        <ColorSwatch color={selected.value} />
      ) : null}
      <span className="min-w-0 truncate font-medium text-[#1e1e1e]">
        {selected.name}
      </span>
      <span className="shrink-0">
        {`${nodeCountText(nodeNames.length)} · dashed in canvas`}
      </span>
      {/*
        UI 案は押せるものも `<span style="cursor:pointer">` で描いているが、実装では
        ボタンにする（`document-error-list` の `revert file` と同じ形）。
        文字サイズを指定しないのは、UI 案の綴りも font-size を持たず帯の 11px を継ぐため。
      */}
      <button
        type="button"
        onClick={() => onReveal(firstDashedNodeName.value)}
        className="ml-1 shrink-0 text-[#0d99ff]"
      >
        reveal in tree
      </button>
    </section>
  );
}
