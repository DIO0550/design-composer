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
  // domains/dcmp/padding — カスタムプロパティ名の綴り方（出力層の知識）は引数で受け取る
  declarations(padding: Padding, resolveToken: (token: string) => string): readonly CssDeclaration[]
  ```

- **検証専用のファイル(`validation/`)が、走査・収集ロジックの置き場所になっていた例。**
  色トークンの妥当性判定自体は `ColorToken.isValid` にあったが、「トークン一式のどの色が
  不正か」を集める `collectColorTokenErrors` を `validation/` に書いていた。判定対象の
  トークン一式を持つのはドメイン(`TokenSet`)なので、`TokenSet.collectInvalidColorNames`
  へ移し、`validation/` はエラーへの詰め替えだけに戻した(pr-803#1)

## `utils-form` — utils の名前が用途を指している

| NG | OK | 理由 |
|---|---|---|
| `StringEx.toLabel(prop)` | `CaseStyle.toCapitalCase(prop)` | 「ラベル」は表示という**用途**。「camelCase を Capital Case にする」は用途に依らない**操作** |
| `ReorderMove`(`ReorderDrag.ts` に用途で命名) | `IndexMove`(`src/types/` へ、操作の意味で命名) | `{ fromIndex, toIndex }` は並べ替え固有の情報を1つも持たない `index → index` の値。ファイル名(`ReorderDrag.ts`)に残すと用途との結びつきが残るので、ロジックを持たない型として独立させる(pr-317#47) |

## `utils-boundary-unresolved` — 実測を添えた回答でも、応答の無いままマージするとスレッドが未決着で残る

`utils/` か `libs/` か迷う置き場所の疑問に、実測(既存の類似形・消費側の参照件数)を添えて
回答しても、**レビューの相手が応答しないまま PR がマージされると、判断は誰にも確定して
いない状態で残る**。次に同じ疑問が浮いたとき、この PR を見ても「結局どちらが正しいか」が
分からない。

| 起きたこと |
|---|
| `src/utils/PointerButton.ts` へ「Util とも言い難い」というレビューコメントが付いた。既存の類似形(`CommandKey` 13 消費側 / `ElementEx` 3 消費側)と `libs/` からの参照実績 0 件を根拠に utils 据え置きを回答したが、**返答が無いままマージされ、スレッドは未解決のまま残った**(pr-467#54) |

- 実測を添えた回答をした時点で終わらせず、**応答が無いまま閉じるなら、未決着であること
  自体を Issue かこの判例へ残す。** 沈黙を「現状維持で合意した」と読み替えない

## `utils-hides-domain-rule` — 汎用に見える処理が、実は仕様由来のドメイン知識だった

既存の汎用変換(`CaseStyle` 等)に見た目が似ているという理由だけで `utils/` へ出さない。
**その規則が `docs/` の仕様として定義されているなら、それは入力の型に依らず成り立つ汎用操作
ではなくドメインの知識。**

| NG | OK |
|---|---|
| `uniqueName` の連番の付け方を `src/utils/` へ出す案(`CaseStyle` を先例に挙げた) | 連番の規則は `docs/04` が定義するドメイン知識なので `TokenSet.uniqueName` としてコンパニオンオブジェクトに残す(pr-788#1) |

## `shape-not-identity` — コードの形が同じでも、ドメインが同じとは限らない

2 つの実装が同じ関数の形になっていても、**衝突してはいけない相手**と**仕様の出どころ
(`docs/` のどの節か)** が別なら、共通のドメインへまとめる根拠にならない。「コードが同じ
だから」は `rules/coding.md`「同じ処理が2箇所に現れたら共通化する」の対象外(重複している
のは処理の形であって、規則の出どころではない)。

| 起きたこと |
|---|
| ドキュメント名の採番とトークン名の採番が同じ「使用済み名前を避けて連番を振る」コードだったため、共通の「使用済み名前の集合」ドメインへまとめようとした。衝突相手(誰と衝突してはいけないか)も仕様の出どころ(`docs/01`・`06` と `docs/04`)も別だったため、共通化を取り下げた(pr-788#2) |

- 判断軸: **その2つの規則を1つ変えたとき、もう片方も変わるべきか。** 変わるべきでないなら、
  コードの形が同じでも別ドメイン

- 汎用の操作が 1 つだけでも、`<型名>Ex` に押し込めず**まとまりを表すモジュール**を立てる
  （綴りの流儀の変換なら `CaseStyle`）
- 型で閉じた対応表（`as const satisfies` でリテラル型を保つもの）を汎用変換に置き換えない。
  戻り値が `string` へ広がり、網羅性の保証が失われる（`TypographyField.cssProperty` を
  `toKebabCase()` にしない）
- ドメイン概念になった時点で `utils/` から `domains/` へ移す。規則を持つ `Px` は
  `domains/unit/px/`、文字列定数だけの `Font` は `utils/`

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
  文字列一致では偽陽性しか出ない(`harness-growth`「フックにする/しない」)。件数も 1 件のみで
  一般化する材料が無いため、今回は語彙を割らず単発として残す(再発したら候補にする)

| NG(汎用化するとこう誤検知する) | OK(実際に指摘された形) |
|---|---|
| `Type["key"]` の indexed access 型はすべて警告 | `resizeCursor(grip): CSSProperties["cursor"]` は正当。問題は `DocumentSessionPorts["ipc"]` のように**直接 import できる名前付きの型(`DocumentIpc`)が既にあるのに** 束から添字で引く形だけ |
