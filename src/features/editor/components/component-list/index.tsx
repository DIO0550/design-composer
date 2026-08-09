import { ComponentAsset } from "@/domains/component";
import { TypeGlyph } from "@/features/editor/components/type-glyph";
import type { Option } from "@/utils/Option";

/** 選択の状態から決まる、押せない理由。ボタンの `title` に出して操作の見当を付けさせる。 */
const INSERT_DISABLED_REASON = "子を持てるものを選ぶと挿入できます";

/** 使われていない部品の右端に出す語（UI 案は `×0` ではなくこの語を出す）。 */
const UNUSED_LABEL = "unused";

/** 選択中のインスタンスの元になっている行に添える語（UI 案の綴り）。 */
const SOURCE_OF_SELECTION_LABEL = "source of selection";

/**
 * 部品 1 件の行。名前の左に部品を表すアイコン、名前の下にその部品が公開している prop の
 * 名前、右端にドキュメント内での使用数を出す
 * （UI 案 docs/Design Composer.html の `primary-button / label / ×4`）。
 *
 * 使用数の綴りだけをここで決める。「使われていない」かどうかは部品の性質なので
 * `ComponentAsset.isUnused` が答え、こちらは `unused` と `×N` のどちらを書くかだけを持つ。
 *
 * 挿入ボタンは UI 案に無いが残している。消すとインスタンスを作る手段が画面から
 * 無くなるため（キャンバスにもツリーにも代わりの入口が無い）。ツリーの並べ替えボタンと
 * 同じ扱いで、代わりの操作は別の単位で入れる（#112）。
 */
function ComponentRow({
  asset,
  isSourceOfSelection,
  isInsertEnabled,
  onInsert,
}: Readonly<{
  asset: ComponentAsset;
  isSourceOfSelection: boolean;
  isInsertEnabled: boolean;
  onInsert: (name: string) => void;
}>) {
  /*
   * 出どころの行では、公開 prop の名前を `source of selection` に譲る。
   * 両方を出すと 1 行に 2 段の補足が並び、UI 案が 1 段しか置いていない位置に
   * 収まらなくなる（公開 prop は右ペインの `Public props` が出している）。
   */
  const showsPublicProps =
    !isSourceOfSelection && asset.publicPropNames.length > 0;

  return (
    <li
      className={`flex items-center gap-1.5 rounded px-2 py-1 hover:bg-gray-100 ${
        isSourceOfSelection ? "bg-purple-50 shadow-[inset_2px_0_0_#9747ff]" : ""
      }`}
    >
      <TypeGlyph kind="component" />
      {/* 名前が余りを占める。flex の子は既定で内容幅より縮まないため省略には min-w-0 が要る */}
      <span className="min-w-0 flex-1">
        <span className="block truncate">{asset.name}</span>
        {showsPublicProps ? (
          <span className="block truncate text-gray-400 text-xs">
            {asset.publicPropNames.join(", ")}
          </span>
        ) : null}
        {isSourceOfSelection ? (
          <span className="block truncate text-[#9747ff] text-xs">
            {SOURCE_OF_SELECTION_LABEL}
          </span>
        ) : null}
      </span>
      <span className="shrink-0 text-gray-400 text-xs">
        {ComponentAsset.isUnused(asset) ? UNUSED_LABEL : `×${asset.refCount}`}
      </span>
      <button
        type="button"
        aria-label={`${asset.name} を挿入`}
        onClick={() => onInsert(asset.name)}
        disabled={!isInsertEnabled}
        title={isInsertEnabled ? undefined : INSERT_DISABLED_REASON}
        className="shrink-0 rounded border border-gray-300 px-1 text-gray-600 text-xs hover:bg-gray-100 disabled:opacity-50"
      >
        挿入
      </button>
    </li>
  );
}

/**
 * パレットの部品（UI 案 docs/Design Composer.html の `Assets` > `Components`。
 * `docs/06-ui.md`「画面構成」が左ペインの内容として挙げている部品一覧）。
 * 各行から選択位置へインスタンス（参照ノード）を挿せる（docs/06-ui.md「編集操作の一覧」）。
 *
 * 見出しと件数は UI 案に合わせて左右に離して置く。
 *
 * 絞り込みはここでは行わない。何を出すかは検索欄を持つ `AssetsPanel` が決め、
 * ここは渡された並びを描くだけ。1 件も無いときに「部品がありません」と言わないのは、
 * 絞り込みで 0 件になっただけかもしれないから。件数は見出しの `0` が伝え、
 * 検索の結果として 0 件になったことは、検索語を持つ `AssetsPanel` が伝える。
 *
 * 部品は選択の対象にしない。選択できるのはキャンバスに描かれるもの、つまり
 * artboard とその配下のノードだけ（`EditorState` と同じ線引き）。選択中の
 * インスタンスの元になっている行は、選択ではなく**出どころ**として強調する
 * （UI 案 docs/Design Composer.html の `source of selection`）。
 */
export function ComponentList({
  assets,
  sourceName,
  isInsertEnabled,
  onInsert,
}: Readonly<{
  assets: readonly ComponentAsset[];
  sourceName: Option<string>;
  isInsertEnabled: boolean;
  onInsert: (name: string) => void;
}>) {
  return (
    <section className="text-sm">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-semibold text-gray-500 text-xs uppercase">
          Components
        </h3>
        <span className="text-gray-400 text-xs">{assets.length}</span>
      </div>
      <ul>
        {assets.map((asset) => (
          <ComponentRow
            key={asset.name}
            asset={asset}
            isSourceOfSelection={
              sourceName.some && sourceName.value === asset.name
            }
            isInsertEnabled={isInsertEnabled}
            onInsert={onInsert}
          />
        ))}
      </ul>
    </section>
  );
}
