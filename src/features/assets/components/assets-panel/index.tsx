import { useState } from "react";
import type { ComponentAsset } from "@/domains/dcmp/component";
import { PrimitiveTypes } from "@/domains/dcmp/primitive-schema";
import { ComponentList } from "@/features/assets/components/component-list";
import { PrimitiveList } from "@/features/assets/components/primitive-list";
import type { AssetGrab } from "@/features/assets/types/AssetGrab";
import type { Option } from "@/utils/Option";
import { StringEx } from "@/utils/StringEx";

/** 検索欄に出す案内（UI 案 docs/Design Composer.html の綴り）。 */
const SearchPlaceholder = "Search assets";

/**
 * 検索して何も残らなかったときの知らせ。
 *
 * 各リストに言わせない。リストは絞り込みを知らないので、そこで「ありません」と書くと
 * ドキュメントに部品があるのに無いと言うことになる（絞り込みで 0 件になっただけ）。
 * 検索語を持っているのはここだけなので、ここで 1 度だけ伝える。
 */
const NoMatchMessage = "一致するものがありません";

/**
 * 挿せる部品のパレット（UI 案 docs/Design Composer.html の `Assets` パネル）。
 *
 * 絞り込みを担うのはここだけ。プリミティブと部品のどちらも同じ語で絞るので、
 * それぞれのリストに検索語を配ると同じ判定が 2 箇所に出る（rules/coding.md）。
 * リストには絞り込み済みの並びだけを渡す。
 *
 * 検索語は 1 つの独立した値で、1 回の入力が他の状態を動かさないので `useState`
 * （rules/hooks.md「useState / useReducer の使い分け」）。
 */
export function AssetsPanel({
  assets,
  sourceName,
  grab,
}: Readonly<{
  assets: readonly ComponentAsset[];
  sourceName: Option<string>;
  grab: AssetGrab;
}>) {
  const [query, setQuery] = useState("");

  const matchedTypes = PrimitiveTypes.filter((type) =>
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
      <input
        type="search"
        aria-label={SearchPlaceholder}
        placeholder={SearchPlaceholder}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="rounded border border-gray-300 px-2 py-1 text-sm placeholder:text-gray-400"
      />
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
