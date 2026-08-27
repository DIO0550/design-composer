import { TypeGlyph } from "@/components/type-glyph";
import type { Selection, SelectionKind } from "@/domains/session/selection";

/**
 * 帯の右端に出す種別の綴り。
 *
 * UI 案（docs/Design Composer.html）に実在するのは `Box` と `Instance` だけ。
 * artboard を選んだ帯と Text を選んだ帯は UI 案に画面が無いので、`Artboard` /
 * `Text` はここで決めた（型の綴りをそのまま出す形に揃えている）。
 *
 * ドメインには置かない。ドメインが答えるのは「参照ノードか」「どの primitive か」で、
 * `Instance` はそれをこの画面でどう呼ぶかという表示の語彙。実際、同じ参照ノードを
 * ツリーは `inst`、ここは `Instance` と綴っている（`rules/architecture.md`
 * 「ドメインが出力形式を必要とする場合」と同じ線引き）。
 *
 * 種別を足して綴りを足し忘れると、ここがコンパイルエラーになる。
 */
const KindLabels = {
  artboard: "Artboard",
  Box: "Box",
  Text: "Text",
  component: "Instance",
} as const satisfies Readonly<Record<SelectionKind, string>>;

/**
 * 選んでいるものを出す見出しの中身（型アイコン + 名前 + 右端に種別）。
 *
 * 種別が `none`（スキーマに無い `type`）のときはアイコンも綴りも出さず名前だけにする。
 * 分からない種別を既定へ寄せると、不正なドキュメントであることが画面から消える
 * （ツリーの行と同じ扱い）。
 */
export function SelectionTitle({
  selection,
}: Readonly<{ selection: Selection }>) {
  const kind = selection.kind;

  return (
    <>
      {kind.some ? <TypeGlyph kind={kind.value} /> : null}
      {/* 名前が余りを占める。flex の子は既定で内容幅より縮まないため省略には min-w-0 が要る */}
      <h2 className="min-w-0 flex-1 truncate font-semibold text-gray-900 text-sm">
        {selection.name}
      </h2>
      {kind.some ? (
        <span className="shrink-0 text-gray-400 text-xs">
          {KindLabels[kind.value]}
        </span>
      ) : null}
    </>
  );
}
