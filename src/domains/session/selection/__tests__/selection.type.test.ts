import { expectTypeOf, test } from "vitest";
import type { TypeGlyphKind } from "@/components/type-glyph";
import type { SelectionKind } from "../index";

/*
 * 型アイコン（`src/components/type-glyph`）は横断層にあり `PrimitiveType` を
 * import できないので、描ける種別を自分で綴っている。選択の種別が増えたときに
 * 描き分けが足りなくなることは、いまは `TypeGlyph` へ渡している呼び出し側が
 * コンパイルエラーになることで気づける。呼び出し側が 1 つも無くなっても気づけるよう、
 * 関係そのものをここで固定する（rules/coding.md「型レベルの保証が仕様の一部であるとき」）。
 */
test("選択できるものの種別は、すべて型アイコンが描ける種別に収まる", () => {
  expectTypeOf<SelectionKind>().toExtend<TypeGlyphKind>();
});
