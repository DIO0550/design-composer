import type { PrimitiveNode } from "@/domains/dcmp/node";

/*
 * カテゴリの中ではなくカテゴリと並べて置くのは、消費側が `dcmp` のテストと feature のテストに
 * またがるため（`rules/architecture.md`「domains のカテゴリ」）。
 */

/**
 * ロックが入れ子になった Box の `panel`。中にロックした `sealed` > ロックした `inner` >
 * ロックしていないと書いた Box の `nested` があり、`sealed` の後ろに Text の `after` が並ぶ。
 *
 * ロックの継承と、ロックの外側への持ち出しを見るテストが `design-document` と feature に
 * またがるので、同じ木をそれぞれに書かず共有する（rules/testing.md「同じヘルパーを 2 つ
 * 以上のテストファイルに書いたら共通化する」）。
 *
 * @returns `panel` を根にした部分木
 */
export function nestedLockPanel(): PrimitiveNode {
  return {
    name: "panel",
    type: "Box",
    children: [
      {
        name: "sealed",
        type: "Box",
        props: { locking: "locked" },
        children: [
          {
            name: "inner",
            type: "Box",
            props: { locking: "locked" },
            children: [
              {
                name: "nested",
                type: "Box",
                props: { locking: "unlocked" },
              },
            ],
          },
        ],
      },
      { name: "after", type: "Text" },
    ],
  };
}
