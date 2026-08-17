import type { CanvasBounds } from "@/features/editor/domains/node-drop";

/**
 * ドロップ先を示す線（docs/06-ui.md「ドロップ先は『どの Box の何番目の子になるか』を
 * ハイライトで提示する」）。
 *
 * ズーム / パンの変形の**外側**に置き、実測した client 座標をそのまま `position: fixed`
 * で使う。変形の内側に置くと、倍率と平行移動を打ち消す座標変換が要るうえ、
 * 中身は React の管理外なので線を差し込む場所も無い。
 */
export function DropMarker({ bounds }: Readonly<{ bounds: CanvasBounds }>) {
  return (
    <div
      data-testid="drop-marker"
      aria-hidden
      className="pointer-events-none fixed z-10 bg-emerald-500"
      style={{
        left: `${bounds.left}px`,
        top: `${bounds.top}px`,
        width: `${bounds.width}px`,
        height: `${bounds.height}px`,
      }}
    />
  );
}
