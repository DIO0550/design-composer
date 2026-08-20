import type { ReactElement } from "react";
import { TypeGlyph, type TypeGlyphKind } from "@/components/type-glyph";
import { TokenReferrer } from "@/domains/design-document";
import { TokenSelection } from "@/domains/token-selection";

/**
 * 枠の中に出す行数の上限。
 * UI 案（docs/Design Composer.html の Tokens 画面）は 8 件のうち 3 行を出し、
 * 残りを `+ 5 more` と書いている。
 */
const VisibleRowLimit = 3;

/**
 * 参照元に当たる型アイコン。
 *
 * 種別の語彙は `TypeGlyph` が受けるものに合わせる（ツリーの行も同じ語彙でアイコンを
 * 描く）。部品定義は選択の対象ではないが、指しているものが部品である点は
 * インスタンスと同じなので同じアイコンになる。
 *
 * `switch` に `default` を置かず戻り値を `TypeGlyphKind`（`undefined` を含まない）に
 * しているので、参照元の種類を足してここを足し忘れるとコンパイルエラーになる
 * （rules/coding.md「列挙した状態の網羅を型で強制する」）。
 *
 * @param referrer アイコンを出したい参照元
 * @returns その行に描くアイコンの種類
 */
function glyphKindOf(referrer: TokenReferrer): TypeGlyphKind {
  switch (referrer.target) {
    case "artboard":
      return "artboard";
    case "primitive":
      return referrer.type;
    /*
     * インスタンスと部品定義はどちらも `◆`。指しているものが部品である点は同じで、
     * UI 案もどちらの行にも `◆` を置いている（`type-glyph` の `component` と同じ扱い）。
     */
    case "instance":
    case "component":
      return "component";
  }
}

/**
 * そのトークンを参照している箇所 1 件の行。
 *
 * @returns アイコンと参照元の位置を並べた 1 行
 */
function UsedByRow({
  referrer,
}: Readonly<{ referrer: TokenReferrer }>): ReactElement {
  return (
    <li className="flex items-center gap-2 border-gray-200 border-t px-2.5 py-1.5 text-xs first:border-t-0">
      <TypeGlyph kind={glyphKindOf(referrer)} />
      <span className="min-w-0 truncate">{TokenReferrer.toText(referrer)}</span>
    </li>
  );
}

/**
 * 選択中のトークンの参照元（UI 案 docs/Design Composer.html の Tokens 画面の `Used by` / #127）。
 *
 * 参照が 0 件でも見出しと件数は出す。使われていないことは削除の判断材料なので、
 * 節ごと消すと「使われていない」と「まだ調べていない」が同じ見た目になる。
 * 枠は行があるときだけ出す（中身の無い枠を置かない）。
 *
 * 件数は表示している行数ではなく参照元の総数。UI 案が 3 行しか出さない状態で `8` と
 * 書いているのがその形で、`+ N more` は総数との差になる。
 *
 * `+ N more` は押せる形にしていない。UI 案はこれを灰色の文字として描いており
 * `cursor:pointer` を持たせていない（同じ画面で持っているのは `reveal in tree` だけ）。
 * 全参照元をどこで見せるかは、キャンバスとの連動（#147）が持つ。
 *
 * @returns 見出しと件数、参照元の行（0 件なら枠を出さない）
 */
export function TokenUsedBy({
  selection,
}: Readonly<{ selection: TokenSelection }>): ReactElement {
  const referrers = TokenSelection.collectReferrers(selection);
  const visibleReferrers = referrers.slice(0, VisibleRowLimit);
  const hiddenCount = referrers.length - visibleReferrers.length;

  return (
    <section aria-label="Used by" className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 text-xs">Used by</h3>
        <span
          data-testid="used-by-count"
          className="text-[10px] text-gray-400 tabular-nums"
        >
          {referrers.length}
        </span>
      </div>
      {referrers.length === 0 ? null : (
        <div className="overflow-hidden rounded border border-gray-200">
          <ul>
            {visibleReferrers.map((referrer) => (
              /*
               * 名前は単一名前空間なので正しいドキュメントでは表記だけで一意になるが、
               * 名前が重複した不正ファイルも画面に残る（docs/03「不正ファイル時の挙動」）
               * ため、行の種類も混ぜて衝突を避ける。
               */
              <UsedByRow
                key={`${referrer.target}/${TokenReferrer.toText(referrer)}`}
                referrer={referrer}
              />
            ))}
          </ul>
          {hiddenCount === 0 ? null : (
            <p className="border-gray-200 border-t px-2.5 py-1.5 text-center text-[10px] text-gray-400">
              {`+ ${hiddenCount} more`}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
