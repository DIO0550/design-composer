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

- **「コードが同じ」は、1 つのドメインへまとめる理由にならない**(pr-788#2)。ドキュメントの
  名前とトークン名の連番を「使用済みの名前の集合」という共通のドメインで共有しようとした。
  採番のコードは同じ形でも、衝突してはいけない相手が別で、決めている仕様も別
  (単一名前空間は `docs/01`「識別子の規則」、トークンの種別内と塗り用 2 種別の間は `docs/04`
  「命名規則」)。トークン名の採番をドキュメントの名前と同じ規則に従わせる仕様は無い

  | NG | OK |
  |---|---|
  | 採番の形が同じなので、名前の集合を表す共通ドメインを作って両方から呼ぶ | 衝突相手を持つ型がそれぞれ採番する(`DocumentNames.uniqueName` / `TokenSet.uniqueName`) |

  `rules/coding.md`「同じ処理が2箇所に現れたら共通化する」との分かれ目は、**同じ処理か**では
  なく**同じ仕様が決めた同じ相手を守っているか**。これは共通化の必要条件で十分条件ではない。
  仕様上同じ規則でも、参照の向き(`docs/04` → `docs/01`)と import の循環を理由に
  `DocumentNames.isValidIdentifier` と `TokenSet.isValidName` は共有していない

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

- **置き場所が `services/` でなくても同じ形になる**(pr-803#1)。色トークンの判定は
  `ColorToken.isValid` にあったのに、「トークン一式のどの色が不正か」の走査を
  `domains/dcmp/design-document/validation/` に書いていた。ドメインの中の検証用モジュールも、
  単一のドメインオブジェクトの不変条件を外から見に行けば `services/` に置いたのと同じ
  (`rules/architecture.md`「services の責務」)

  | NG | OK |
  |---|---|
  | `validation/` が `TokenSet` の中身を走査して不正な色の名前を集める | `TokenSet.collectInvalidColorNames` が走査し、`validation/` は返った名前をエラーへ詰め替えるだけ(`TokenSet.collectPaintNameConflicts` と同じ形) |

  分かれ目は関数名ではなく**走査(`TokenSet` の中身の形を読むこと)がドメインにあるか**。
  `validation/` というモジュール自体の扱いはこの判例では決めていない(#808)

## `utils-form` — utils の名前が用途を指している

| NG | OK | 理由 |
|---|---|---|
| `StringEx.toLabel(prop)` | `CaseStyle.toCapitalCase(prop)` | 「ラベル」は表示という**用途**。「camelCase を Capital Case にする」は用途に依らない**操作** |
| `ReorderMove`(`{ fromIndex, toIndex }`、`ReorderDrag.ts`) | `IndexMove`(`src/types/IndexMove.ts`) | 並べ替え固有の情報を 1 つも持たず「index から index へ」でしかない。用途のファイルに残すと、名前を変えても用途との結びつきが残る(pr-317#47) |

- 汎用の操作が 1 つだけでも、`<型名>Ex` に押し込めず**まとまりを表すモジュール**を立てる
  （綴りの流儀の変換なら `CaseStyle`）
- 型で閉じた対応表（`as const satisfies` でリテラル型を保つもの）を汎用変換に置き換えない。
  戻り値が `string` へ広がり、網羅性の保証が失われる（`TypographyField.cssProperty` を
  `toKebabCase()` にしない）
- ドメイン概念になった時点で `utils/` から `domains/` へ移す。規則を持つ `Px` は
  `domains/unit/px/`、文字列定数だけの `Font` は `utils/`
  - **処理が汎用に見えても、何と衝突してはいけないかを仕様が決めているならドメイン**(pr-788#1)。
    `CaseStyle` の変換はどの文字列にも同じ規則が当たるが、連番は衝突相手(`docs/01`
    「識別子の規則」)といつ付けるか(`docs/06-ui.md`「名前の変更」)を仕様が決めている。
    その相手ごとに分けて持つ理由は `ownership-reasoning` の pr-788#2

    | NG | OK |
    |---|---|
    | 連番の規則を `CaseStyle` を先例に `src/utils/` へ出す | 衝突相手を持つ型のメソッドにする(`DocumentNames.uniqueName`) |

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
