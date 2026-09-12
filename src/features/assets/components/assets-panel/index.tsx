import { NoMatchMessage } from "@/components/search-field";
import type { ComponentAsset } from "@/domains/dcmp/component";
import { PrimitiveTypes } from "@/domains/dcmp/primitive-schema";
import { ComponentList } from "@/features/assets/components/component-list";
import { PrimitiveList } from "@/features/assets/components/primitive-list";
import type { AssetGrab } from "@/features/assets/types/AssetGrab";
import type { Option } from "@/utils/Option";
import { StringEx } from "@/utils/StringEx";

/**
 * 挿せる部品のパレット（UI 案 docs/Design Composer.html の `Assets` パネル）。
 *
 * このパネルの中で絞り込みを担うのはここだけ。プリミティブと部品のどちらも同じ語で絞る
 * ので、それぞれのリストに検索語を配ると同じ判定が 2 箇所に出る（rules/coding.md）。
 * リストには絞り込み済みの並びだけを渡す。
 *
 * 検索欄そのものは見出しの直下に留まる器（`LeftPanePanel`）が持ち、ここへは打たれた語だ
 * けが届く（docs/06-ui.md「絞り込み」）。
 */
export function AssetsPanel({
  query,
  assets,
  sourceName,
  grab,
}: Readonly<{
  /** 検索欄に打たれた語。空なら絞っていない */
  query: string;
  assets: readonly ComponentAsset[];
  sourceName: Option<string>;
  grab: AssetGrab;
}>) {
  const matchedTypes = Object.values(PrimitiveTypes).filter((type) =>
    StringEx.includesIgnoreCase(type, query),
  );
  const matchedAssets = assets.filter((asset) =>
    StringEx.includesIgnoreCase(asset.name, query),
  );
  // 検索語が空のときの 0 件は「まだ何も無い」なので、絞り込みの結果とは分けて扱う
  const hasNoMatch =
    query !== "" && matchedTypes.length === 0 && matchedAssets.length === 0;

  return (
    <>
      {/*
       * どちらにも残らなかったときは、節ごと知らせに置き換える。空の `Primitives` と
       * `Components 0` を残したうえで知らせも出すと、同じ「無い」を 3 箇所で言うことに
       * なるため。片方にでも残っていれば、残らなかった側は見出しと `0` をそのまま出す
       * （そちらは「この節には無い」という情報になる）。
       */}
      {hasNoMatch ? (
        <p className="text-gray-500 text-sm">{NoMatchMessage}</p>
      ) : (
        <>
          <PrimitiveList types={matchedTypes} grab={grab} />
          <ComponentList
            assets={matchedAssets}
            sourceName={sourceName}
            grab={grab}
          />
        </>
      )}
    </>
  );
}
