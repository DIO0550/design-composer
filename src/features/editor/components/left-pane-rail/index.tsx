import type { ReactNode } from "react";

/**
 * 左ペインが何を映しているか、レールに並ぶ順で（UI 案 docs/Design Composer.html は
 * 左端の縦アイコンレールでこれを切り替える / #129）。
 *
 * `Assets` はバイナリ資産ではなく**部品のパレット**で、`docs/06-ui.md` が左ペインの内容と
 * して挙げている「部品一覧」に当たる。
 *
 * 並びを**この配列**に持ち、レールもここから作る。オブジェクトを `Object.values` で
 * 走査しない理由は、Storybook のビルドでは docgen が export した定数へ `displayName` /
 * `__docgenInfo` を**列挙可能なプロパティとして**足すことがあり、走査すると行き先では
 * ない値まで行として並ぶため（配列の `map` は添字だけを見るので影響を受けない。
 * vitest では docgen が走らず、テストだけでは気付けない / #129）。
 */
const LEFT_PANE_VIEW_ORDER = ["layers", "assets", "tokens"] as const;

export type LeftPaneView = (typeof LEFT_PANE_VIEW_ORDER)[number];

/**
 * 行き先を名前で指すための対応表。消費側が綴りを直接書かずに済むよう置く
 * （rules/coding.md「値の集合から union を導出する」）。
 * 過不足は `Record<LeftPaneView, LeftPaneView>` がコンパイルエラーにする。
 */
export const LEFT_PANE_VIEWS = {
  layers: "layers",
  assets: "assets",
  tokens: "tokens",
} as const satisfies Readonly<Record<LeftPaneView, LeftPaneView>>;

/**
 * 行き先の名前。データモデルの語ではなく UI 案の綴りに合わせる。
 * レールのラベルと、その先に出るパネルの見出しの両方がこれを使う。
 */
export const LEFT_PANE_VIEW_LABELS = {
  layers: "Layers",
  assets: "Assets",
  tokens: "Tokens",
} as const satisfies Readonly<Record<LeftPaneView, string>>;

/*
 * 行き先を表す図形。UI 案のレールは線と面だけで描かれていて字面を使っていないため、
 * `type-glyph` のような Unicode の文字ではなく同じ形を要素で組む
 * （字面で代用すると、フォントによって太さと大きさが行き先ごとにばらつく）。
 *
 * 図形は行き先をなぞっているだけで、それが何かはラベルが伝えるので読み上げから外す。
 */
/** 重なった面を横から見た形。3 本の線を等間隔に積む。 */
function LayersGlyph() {
  return (
    <span aria-hidden="true" className="flex w-4 flex-col gap-1">
      <span className="h-px bg-current" />
      <span className="h-px bg-current" />
      <span className="h-px bg-current" />
    </span>
  );
}

/** 円の中の十字。パレットに足せることを表す。 */
function AssetsGlyph() {
  return (
    <span
      aria-hidden="true"
      className="relative flex size-4 items-center justify-center rounded-full border border-current"
    >
      <span className="absolute h-px w-2 bg-current" />
      <span className="absolute h-2 w-px bg-current" />
    </span>
  );
}

/** 粒が並んだ形。2x2 の面を敷き詰める。 */
function TokensGlyph() {
  return (
    <span aria-hidden="true" className="grid size-4 grid-cols-2 gap-0.5">
      <span className="bg-current" />
      <span className="bg-current" />
      <span className="bg-current" />
      <span className="bg-current" />
    </span>
  );
}

/**
 * 行き先ごとの図形（`type-glyph` の `GLYPHS` と同じ形の対応表）。
 * 行き先を足して図形を足し忘れると、ここがコンパイルエラーになる。
 */
const VIEW_GLYPHS = {
  layers: LayersGlyph,
  assets: AssetsGlyph,
  tokens: TokensGlyph,
} as const satisfies Readonly<Record<LeftPaneView, () => ReactNode>>;

/**
 * 左ペインの行き先を選ぶ縦レール（UI 案 docs/Design Composer.html の 56px のレール）。
 * 何を映すかは呼び出し側が持つ状態で決まり、ここは選ばせるところだけを担う。
 */
export function LeftPaneRail({
  current,
  onSelect,
}: Readonly<{
  current: LeftPaneView;
  onSelect: (view: LeftPaneView) => void;
}>) {
  return (
    <nav
      aria-label="左ペインの表示"
      className="flex w-14 shrink-0 flex-col items-center gap-1 border-gray-300 border-r bg-white py-2"
    >
      {LEFT_PANE_VIEW_ORDER.map((view) => {
        const Glyph = VIEW_GLYPHS[view];

        return (
          <button
            key={view}
            type="button"
            aria-current={current === view}
            onClick={() => onSelect(view)}
            className="flex w-12 flex-col items-center gap-1 rounded py-1.5 text-[9px] text-gray-500 hover:bg-gray-100 aria-[current=true]:bg-[#0d99ff]/10 aria-[current=true]:text-[#0d99ff]"
          >
            <Glyph />
            {LEFT_PANE_VIEW_LABELS[view]}
          </button>
        );
      })}
    </nav>
  );
}
