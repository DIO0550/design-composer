import type { Decorator } from "@storybook/react-vite";

/**
 * 変形の外側へ `position: fixed` で重ねる線・ラベルを映す器。
 *
 * 本番はビューポートの座標をそのまま使うので器は位置を与えず、**地の色だけ**を出す
 * （線は白地でも見えるが、実画面ではキャンバスの灰色の上に出る）。
 *
 * `drop-marker` と `snap-guide-overlay` が同じ器を使う。どちらも運んでいる最中に
 * しか出ず、`ArtboardCanvas` のストーリーは静止した状態しか撮れないため、
 * **線の太さ・色を確かめる手段はそれぞれの story だけ**になる。
 */
export const OverlayStage: Decorator = (Story) => (
  <div className="h-64 w-full bg-gray-100">
    <Story />
  </div>
);
