import { expectTypeOf, test } from "vitest";
import type { DropParent, InsertionParent } from "../index";

test("向きを持たない親は並びへ挿す先として渡せない", () => {
  // 型を2つに割った目的そのもの。1つに戻しても実行時のテストは全部通るので、ここで固定する
  expectTypeOf<DropParent>().not.toExtend<InsertionParent>();
});

test("並びへ挿す先はそのまま座標の受け入れ先として渡せる", () => {
  // 座標の置き直しは名前しか要らないので、向きまで分かっている親は詰め替えずに渡せる
  expectTypeOf<InsertionParent>().toExtend<DropParent>();
});
