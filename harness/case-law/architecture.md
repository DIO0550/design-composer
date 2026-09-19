# 判例: アーキテクチャ

規範は [`rules/architecture.md`](../../rules/architecture.md)。ここはその実例。

## `ownership-reasoning` — 帰属の理由が理由になっていない

置き場所自体は合っていても、**理由がその型に固有の性質を指していない**形。
「第 1 引数の型が◯◯だから」だけでは、他の型でも同じ理由が成り立ってしまう。
次に似た値が出たときに、同じ場所へ置いてよいか判断できない。

| NG | OK |
|---|---|
| `TypographyToken.withField(token, { field: "fontFamily", value: "" })` が空文字を「省略」と読む | コントロール側で `raw === "" ? Option.none : Option.some(raw)` に解釈し、ドメインは `Option<string>` を受ける |
| `DocumentErrorLocation.toText(location)` をドメインに置き、`"home-title.typography"` を組み立てる | ドメインは `DocumentErrorLocation` の直和まで。綴りは `document-error-list` の `locationLabel` が持つ |

- **テストが表示の綴りを必要としているように見えたら、まず assert のほうを疑う。**
  「テストのヘルパーが実装の再実装になっている」を理由に綴りをドメインへ移したくなるが、
  多くの場合テストが見たいのは綴りではなく**構造**（どのノードのどの prop か）で、
  構造のまま比べれば綴りを作る必要そのものが消える

## `service-placement` — services に置く前にドメインを探していない

「複数ドメインに跨る」という感触だけを根拠に `services/` へ置いた形。過去のレビューで
services に置かれたロジックの多くは、`rules/architecture.md` の 1〜6 で帰属先が見つかっている。

- 対を表す型を作って帰属させた例: `TypographyFieldRef` / `Padding`
- ドメインが出力形式を必要とする場合は、変換手段を**引数で受け取る**ことで依存方向を保ったまま
  ドメインに置ける

  ```typescript
  // domains/padding — カスタムプロパティ名の綴り方（出力層の知識）は引数で受け取る
  declarations(padding: Padding, resolveToken: (token: string) => string): readonly CssDeclaration[]
  ```

## `utils-form` — utils の名前が用途を指している

| NG | OK | 理由 |
|---|---|---|
| `StringEx.toLabel(prop)` | `CaseStyle.toCapitalCase(prop)` | 「ラベル」は表示という**用途**。「camelCase を Capital Case にする」は用途に依らない**操作** |

- 汎用の操作が 1 つだけでも、`<型名>Ex` に押し込めず**まとまりを表すモジュール**を立てる
  （綴りの流儀の変換なら `CaseStyle`）
- 型で閉じた対応表（`as const satisfies` でリテラル型を保つもの）を汎用変換に置き換えない。
  戻り値が `string` へ広がり、網羅性の保証が失われる（`TypographyField.cssProperty` を
  `toKebabCase()` にしない）
- ドメイン概念になった時点で `utils/` から `domains/` へ移す。規則を持つ `Px` は `domains/px/`、
  文字列定数だけの `Font` は `utils/`

## `domain-scope-promotion` — 置き場所を消費する feature の数で決めていない

1 feature でしか使わないのに `src/domains/` へ置く / 2 つ以上の feature が必要なのに
`features/<x>/domains/` に留める。どちらの向きにも出る。

## `module-api` — 「いつ分割が必要か」は書けても、機械には拾えない形がある

pr-235 で観点(`implementation-reviewer`「モジュールの公開 API の観点」)へ介入した後も
28 件再発し、うち 2 件が人のレビューまで届いた(すり抜け)。内訳は**未使用 export の放置**
(16 件・全件すり抜け 0)が大半で、これは既存の観点(「`index.ts` の export が増えていないか」)
が既に捕まえている。すり抜けた 2 件だけが観点の範囲外だった。

- **1 件目(pr-240): `.tsx` に部品が積み上がっても分割の閾値が無かった。** `artboard-canvas/index.tsx`
  が 716 行・11 コンポーネントになるまで誰も気づけなかった。**行数はフックにできる**
  (`.oxlintrc.json` の `overrides` に `src/**/*.tsx` 向け `max-lines: 600` を追加。現行の最大は
  `opened-document-editor/index.tsx` の 575 行で、追加時点では違反 0)
- **2 件目(pr-544#22): 「他 feature の束オブジェクトへ添字でアクセスする」と「直接 import する」の
  流儀不統一は、フックにしなかった。** 汎用化すると TypeScript の正当な indexed access 型
  (`CSSProperties["cursor"]` 等、`src/` に実例が複数ある)まで誤検知する。「直接 import できる
  型が既にあるのに束の添字経由で書いているか」は型情報と消費者側の実態を読まないと判定できず、
  文字列一致では偽陽性しか出ない(`harness-growth`「Step 3」)。件数も 1 件のみで
  一般化する材料が無いため、今回は語彙を割らず単発として残す(再発したら候補にする)

| NG(汎用化するとこう誤検知する) | OK(実際に指摘された形) |
|---|---|
| `Type["key"]` の indexed access 型はすべて警告 | `resizeCursor(grip): CSSProperties["cursor"]` は正当。問題は `DocumentSessionPorts["ipc"]` のように**直接 import できる名前付きの型(`DocumentIpc`)が既にあるのに** 束から添字で引く形だけ |
