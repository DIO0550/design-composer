import type { DropTarget } from "@/features/canvas/domains/node-drop";

/**
 * ドロップ先を「どの親の何個中どこか」として読ませるラベル（UI 案 docs/Design
 * Composer.html の `into login-form · child 3 of 5`）。
 *
 * 数え方は UI 案の図に合わせた（`N` は挿入位置の 0 起点、`M` は落とす前の子の数）。色は
 * 今のドロップ提示（緑の破線）に合わせ、`DropMarker` と同じくズーム / パンの変形の**外
 * 側**へ置いて実測した client 座標を `position: fixed` で使う。
 *
 * **置き方（`fixed` と持ち上げ量）を落としても気づく手段が無い。** happy-dom はレイアウ
 * トを解決せず、運んでいる最中のキャンバスを映すストーリーも無いので視覚差分にも出ない
 * （落ちるのは「ラベルが出る」ところまで）。
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
