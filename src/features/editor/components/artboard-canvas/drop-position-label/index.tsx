import type { DropTarget } from "@/features/editor/domains/node-drop";

/**
 * ドロップ先を「どの親の何個中どこか」として読ませるラベル
 * （UI 案 docs/Design Composer.html の `into login-form · child 3 of 5`）。
 *
 * 数え方は UI 案の図に合わせた。`login-form` は子を 5 つ持ち、線はその 4 つ目の手前に
 * あるので、`N` は挿入位置（0 起点）、`M` は落とす前の子の数になる。先頭へ落とすと
 * `child 0 of 5` になり日本語としては硬いが、綴りを読みやすくすると UI 案の数字を
 * 再現できなくなる。
 *
 * 色は今のドロップ提示（緑の破線）に合わせる。UI 案はここも選択と同じ青にしているが、
 * 選択と見分けるために緑にしてあるので、まとめて青へ寄せるのは #112 の担当。
 *
 * `DropMarker` と同じくズーム / パンの変形の**外側**へ置き、実測した client 座標を
 * `position: fixed` で使う。
 *
 * **置き方（`fixed` と持ち上げ量）を落としても気づく手段が無い。** happy-dom は
 * レイアウトを解決せず、運んでいる最中のキャンバスを映すストーリーも無いので視覚差分にも
 * 出ない。落ちるのは「ラベルが出る」ところまで（`opened-document-editor.asset-drag`）。
 */
export function DropPositionLabel({
  target,
}: Readonly<{ target: DropTarget }>) {
  return (
    <p
      aria-hidden
      className="pointer-events-none fixed z-10 whitespace-nowrap rounded-t-[3px] bg-emerald-500 px-1.5 py-0.5 font-medium text-[10px] text-white"
      style={{
        left: `${target.parentBounds.left}px`,
        // ラベルの高さぶん親の上へ持ち上げ、枠に載せる（UI 案と同じ置き方）
        top: `${target.parentBounds.top - 18}px`,
      }}
    >
      into {target.position.parentName} · child {target.position.index} of{" "}
      {target.childCount}
    </p>
  );
}
