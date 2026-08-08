import type { ValueOf } from "@/types/ValueOf";

/**
 * 左ペインが何を映しているか（UI 案 docs/Design Composer.html は左端の縦アイコンレールで
 * これを切り替える / #129）。
 *
 * `Assets` はバイナリ資産ではなく**部品のパレット**で、`docs/06-ui.md` が左ペインの内容と
 * して挙げている「部品一覧」に当たる。
 */
export const LEFT_PANE_VIEWS = {
  layers: "layers",
  assets: "assets",
  tokens: "tokens",
} as const;

export type LeftPaneView = ValueOf<typeof LEFT_PANE_VIEWS>;

/**
 * レールに並べる順（UI 案 docs/Design Composer.html の上から下）。
 *
 * `Object.values(LEFT_PANE_VIEWS)` で作らない。Storybook のビルドでは docgen が
 * export した定数へ `displayName` / `__docgenInfo` を**列挙可能なプロパティとして**
 * 足すことがあり、走査すると行き先ではない値まで行として並ぶ（vitest では docgen が
 * 走らないため、テストだけでは気付けない / #129）。
 *
 * 足し忘れは「すべての行き先がレールに並ぶ」テストが落として知らせる。
 */
const RAIL_ORDER = [
  LEFT_PANE_VIEWS.layers,
  LEFT_PANE_VIEWS.assets,
  LEFT_PANE_VIEWS.tokens,
] as const satisfies readonly LeftPaneView[];

/**
 * 行き先の名前。データモデルの語ではなく UI 案の綴りに合わせる。
 * レールのラベルと、その先に出るパネルの見出しの両方がこれを使う。
 */
export const LEFT_PANE_VIEW_LABELS = {
  layers: "Layers",
  assets: "Assets",
  tokens: "Tokens",
} as const satisfies Readonly<Record<LeftPaneView, string>>;

/**
 * 行き先を表す図形。UI 案のレールは線と面だけで描かれていて字面を使っていないため、
 * `type-glyph` のような Unicode の文字ではなく同じ形を要素で組む
 * （字面で代用すると、フォントによって太さと大きさが行き先ごとにばらつく）。
 *
 * 図形は行き先をなぞっているだけで、それが何かはラベルが伝えるので読み上げから外す。
 */
function ViewIcon({ view }: Readonly<{ view: LeftPaneView }>) {
  if (view === LEFT_PANE_VIEWS.layers) {
    return (
      // 重なった面を横から見た形。3 本の線を等間隔に積む。
      <span aria-hidden="true" className="flex w-4 flex-col gap-1">
        <span className="h-px bg-current" />
        <span className="h-px bg-current" />
        <span className="h-px bg-current" />
      </span>
    );
  }
  if (view === LEFT_PANE_VIEWS.assets) {
    return (
      // 円の中の十字（パレットに足せることを表す）。
      <span
        aria-hidden="true"
        className="relative flex size-4 items-center justify-center rounded-full border border-current"
      >
        <span className="absolute h-px w-2 bg-current" />
        <span className="absolute h-2 w-px bg-current" />
      </span>
    );
  }
  return (
    // 粒が並んだ形。2x2 の面を敷き詰める。
    <span aria-hidden="true" className="grid size-4 grid-cols-2 gap-0.5">
      <span className="bg-current" />
      <span className="bg-current" />
      <span className="bg-current" />
      <span className="bg-current" />
    </span>
  );
}

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
      {RAIL_ORDER.map((view) => (
        <button
          key={view}
          type="button"
          aria-current={current === view}
          onClick={() => onSelect(view)}
          className="flex w-12 flex-col items-center gap-1 rounded py-1.5 text-[9px] text-gray-500 hover:bg-gray-100 aria-[current=true]:bg-[#0d99ff]/10 aria-[current=true]:text-[#0d99ff]"
        >
          <ViewIcon view={view} />
          {LEFT_PANE_VIEW_LABELS[view]}
        </button>
      ))}
    </nav>
  );
}
