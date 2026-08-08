/**
 * 左ペインが何を映しているか。
 *
 * UI 案（docs/Design Composer.html）は `Layers` / `Assets` / `Tokens` を左端のアイコン
 * レールで切り替えており、このタブとは形が違う（#112 の表 1）。
 *
 * `Assets` はまだ出していない。中身は Primitives（Box / Text）と Components の一覧で、
 * Components は component-list として実装済み（今は Layers 側に置いている）。
 */
export const LEFT_PANE_TABS = {
  layers: "layers",
  tokens: "tokens",
} as const;

export type LeftPaneTab = (typeof LEFT_PANE_TABS)[keyof typeof LEFT_PANE_TABS];

/** タブの見出し。データモデルの語ではなく UI 案の綴りに合わせる。 */
const TAB_LABELS = {
  layers: "Layers",
  tokens: "Tokens",
} as const satisfies Readonly<Record<LeftPaneTab, string>>;

/**
 * 左ペインの切り替えタブ。
 * 何を映すかは呼び出し側が持つ状態で決まり、ここは選ばせるところだけを担う。
 */
export function LeftPaneTabs({
  current,
  onSelect,
}: Readonly<{
  current: LeftPaneTab;
  onSelect: (tab: LeftPaneTab) => void;
}>) {
  return (
    <div role="tablist" aria-label="左ペインの表示" className="flex">
      {Object.values(LEFT_PANE_TABS).map((tab) => (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={current === tab}
          onClick={() => onSelect(tab)}
          className="flex-1 border-transparent border-b-2 px-2 py-2 text-gray-500 text-xs aria-selected:border-gray-900 aria-selected:font-semibold aria-selected:text-gray-900"
        >
          {TAB_LABELS[tab]}
        </button>
      ))}
    </div>
  );
}
