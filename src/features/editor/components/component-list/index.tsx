import { ComponentAsset } from "@/domains/component";
import { AssetRow } from "@/features/editor/components/asset-row";
import type { AssetGrab } from "@/features/editor/types/AssetGrab";
import type { Option } from "@/utils/Option";

/** 使われていない部品の右端に出す語（UI 案は `×0` ではなくこの語を出す）。 */
const UnusedLabel = "unused";

/** 選択中のインスタンスの元になっている行に添える語（UI 案の綴り）。 */
const SourceOfSelectionLabel = "source of selection";

/**
 * 部品 1 件の名前まわり。名前の下に、その部品が公開している prop の名前か、
 * 選択中のインスタンスの出どころであることを出す
 * （UI 案 docs/Design Composer.html の `primary-button / label`）。
 *
 * 出どころの行では公開 prop の名前を `source of selection` に譲る。両方を出すと 1 行に
 * 2 段の補足が並び、UI 案が 1 段しか置いていない位置に収まらなくなる
 * （公開 prop は右ペインの `Public props` が出している）。
 *
 * @returns 名前と、その下に置く 1 段の補足
 */
function ComponentName({
  asset,
  isSourceOfSelection,
}: Readonly<{ asset: ComponentAsset; isSourceOfSelection: boolean }>) {
  const showsPublicProps =
    !isSourceOfSelection && asset.publicPropNames.length > 0;

  return (
    <>
      <span className="block truncate">{asset.name}</span>
      {showsPublicProps ? (
        <span className="block truncate text-gray-400 text-xs">
          {asset.publicPropNames.join(", ")}
        </span>
      ) : null}
      {isSourceOfSelection ? (
        <span className="block truncate text-[#9747ff] text-xs">
          {SourceOfSelectionLabel}
        </span>
      ) : null}
    </>
  );
}

/**
 * パレットの部品（UI 案 docs/Design Composer.html の `Assets` > `Components`。
 * `docs/06-ui.md`「画面構成」が左ペインの内容として挙げている部品一覧）。
 * 各行を掴んでキャンバスへ落とすとインスタンス（参照ノード）が挿さる
 * （docs/06-ui.md「編集操作の一覧」/ #203）。
 *
 * 見出しと件数は UI 案に合わせて左右に離して置く。使用数の綴りだけをここで決める
 * （「使われていない」かどうかは部品の性質なので `ComponentAsset.isUnused` が答え、
 * こちらは `unused` と `×N` のどちらを書くかだけを持つ）。
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
  grab,
}: Readonly<{
  assets: readonly ComponentAsset[];
  sourceName: Option<string>;
  grab: AssetGrab;
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
        {assets.map((asset) => {
          const isSourceOfSelection =
            sourceName.some && sourceName.value === asset.name;

          return (
            <AssetRow
              key={asset.name}
              kind="component"
              name={
                <ComponentName
                  asset={asset}
                  isSourceOfSelection={isSourceOfSelection}
                />
              }
              template={{ kind: "instance", componentName: asset.name }}
              grab={grab}
              accent={isSourceOfSelection ? "source-of-selection" : "none"}
            >
              <span className="shrink-0 text-gray-400 text-xs">
                {ComponentAsset.isUnused(asset)
                  ? UnusedLabel
                  : `×${asset.refCount}`}
              </span>
            </AssetRow>
          );
        })}
      </ul>
    </section>
  );
}
