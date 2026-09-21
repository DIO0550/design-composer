import { expectTypeOf, test } from "vitest";
import type { NestedRowPosition } from "@/components/nested-row-list";
import type { ChildPosition } from "@/domains/dcmp/child-position";

/*
 * 行を並べる器（`src/components/nested-row-list`）は横断層にあり `ChildPosition` を
 * import できないので、同じ位置を自分で綴っている。`DocumentTree` は器が返した位置を
 * 子の位置としてそのまま外へ渡すので、綴りがずれたら渡せなくなる。いまはその渡し方が
 * コンパイルエラーで気づかせてくれるが、渡す側が変わっても気づけるよう関係そのものを
 * ここで固定する（rules/coding.md「型レベルの保証が仕様の一部であるとき」）。
 */
test("行を並べる器が返す並べ替えの位置は、そのまま子の位置として渡せる", () => {
  expectTypeOf<NestedRowPosition>().toExtend<ChildPosition>();
});
