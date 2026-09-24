# 判例: コーディング

規範は [`rules/coding.md`](../../rules/coding.md)。ここはその実例。

## `type-vocabulary` — 語彙が `string` のまま残る

| NG | OK |
|---|---|
| `/** rgb は6桁の hex であることを呼び出し側が保証する */`<br>`withRgb(color: ColorToken, rgb: string)` | `` type Rgb = `#${string}` `` を立て、生成を `Rgb.create(value): Option<Rgb>` に閉じてから `withRgb(color: ColorToken, rgb: Rgb)` |
| `AXES.width` | `Axes.Width` |
| `DOCUMENT_ERROR_ORIGINS.openedFile` | `DocumentErrorOrigins.OpenedFile` |

- **既にある型エイリアスへ付け替えるだけでは閉じられない。** `ColorToken = string` のように
  構造が `string` のままの型に付け替えても、素の `string` がそのまま代入できる。
  テンプレートリテラル型で構造を狭めて初めて代入が弾かれる
- **キーの型が union そのものだと、キーを PascalCase にした時点で `satisfies` が落ちる。**
  `Capitalize` を通して過不足の検査を残す（`LeftPaneViews` が
  `Readonly<Record<Capitalize<LeftPaneView>, LeftPaneView>>`）。行き先の id にハイフンや
  複数語が入ると `Capitalize<"left-pane">` = `"Left-pane"` を型が要求するので、
  そのときはキーの綴りを別に持つ
- スキーマなど既にある定数から導出する場合は出どころの形に従う（`CssDirection` が
  `BoxSchema.props.direction.values` から引く）
- 既存の `TokenKinds` / `TypographyFields` / `PrimitiveTypes` は配列 + `(typeof X)[number]` の
  まま（#105 で寄せる）

### 語彙と単位を型に出した形

```typescript
// NG: 任意の文字列が通る
function create(property: string, value: string): CssDeclaration { /* ... */ }

// OK: 語彙と単位が型に出る
export type CssProperty = "display" | "flex-direction" | "gap" | "padding" /* ... */;
export type Px = `${number}px`; // "16" / "16rem" は代入不可
```

値の集合から union を導出する形（`src/types/ValueOf.ts`）。

```typescript
export const Axes = { Width: "width", Height: "height" } as const;
export type Axis = ValueOf<typeof Axes>;

Object.values(Axes).flatMap((axis) => /* ... */);
```

## `type` — ジェネリクスを入れるか、列挙するか

判断軸は「型が似ているか」ではなく **「誰が型を決めるか」**。**呼び出し件数は判定材料にしない**
（件数は結果であって理由ではない）。実測（本番コードの `type` / `interface` / トップレベル
`function` の宣言に限って数えた 21 件）では、この基準に外れるものは無かった。

| 形 | 判断 | なぜ |
|---|---|---|
| `ResolvedProps<T extends PrimitiveType>` / `FormatVersionOf<Major extends number>` | **型引数でよい** | 閉じた union に束縛されているが、**どれを入れるかは呼び出し側が決める**。「列挙できる＝直和にせよ」を字義どおり当てると正当なこれらが違反に見える |
| `DefaultedKeys<P>` / `TokenPropNameOf<T>` / `TokenKindOfProp<P>` | **型引数でよい** | `T` の中を見ているが**型レベルの導出**で、`rules/coding.md`「不正な状態を型で表現できなくする」が推奨している形そのもの。禁じているのは**実行時に** `T` の中身で振り分けること |
| `IpcCaller<C extends string, E>` | **型引数でよい**（ターボフィッシュが要っても） | `C` は戻り値の関数の引数位置にしか現れず `caller()` の引数から推論できないので、呼び出し 2 箇所とも `TauriIpc.caller<DocumentCommand, DocumentIpcError>` と書く。外すと `command: string` に戻り、コマンドの語彙が開く |
| `Json.combine6<A, B, C, D, E, F, R>` / `FormatVersion.fromJsonOf<Major>` | **型引数でよい**（呼び出しが 1 箇所でも） | どちらも production の呼び出しは 1 箇所だが、実装は `T` の違いで振る舞いを変えていない。**件数で裁くと正しい型引数が違反に読める**ので、判定材料にしない |

「**穴が 1 つ**」は条件にしない。`Result<T, E>` / `Brand<T, Tag>` / `IpcCaller<C, E>` / `Option.map<T, U>` と、
穴が複数のものが既に並んでいる。条件になるのは**穴の中身を実行時に見ないこと**だけ。

### `interface` は使わない

TS 公式は形状の継承に `interface extends` を薦めている（衝突を即エラーにできる / 型チェックが速い /
表示が良い）。**このリポジトリでは採らない。** 対象は `FreezablePaneProps` ほか数件しか無く、
`interface` の使用は 0 件で、型とコンパニオンオブジェクトを同名で並べる形に揃っているため。

代償は把握しておく。**交差型は衝突すると黙って `never` になり、値を作った時点で初めて気づく。**
`resolved-props/index.ts` の `Props & Readonly<Record<DefaultedKeys<SchemaPropsOf<T>>, PropValue>>` は
インデックスシグネチャを持つ型との交差で、この形にいちばん近い。

## `illegal-state` — 不正な状態が型で作れてしまう

計画検証・実装検証で 1 つずつ当てる形。繰り返し出ている。

- **辞書引きの「まだ無い」と「0」が同じ顔になる。** `Record<string, number>` をキーで引くと、
  定義の無いキーも型上 `number` になる（`noUncheckedIndexedAccess` が無いため）。
  区別したいなら `(名前, 値)` の並びにする
- **出し分けの最後の枝がラベルの無い受け皿になる。** `if` の連なり・nested ternary の最後の
  分岐は、行き先を足し忘れても黙って通る。`switch` を `default` 無しで書き、戻り値の型を
  `ReactNode` ではなく `ReactElement` にする
- **`as const` から union を export するのに `satisfies` と型テストが無い。** 隣接する既存の
  語彙（`TypographyFields` 等）と縛り方を揃える
- **本来届かないはずの `Option.none` / 分岐を作る。** `findX` → `findY` のような多段の参照は、
  途中の `none` が「起こり得ないのに UI が持つ枝」になる。1 段で引ける型・既存の公開 API を先に探す
- **構造が変わらない型エイリアスを新設する**（`type A = B`）
- **同じ位置づけの既存の型が `Option` で表しているものを、そこだけ空配列 / 既定値へ潰す。**
  隣の型と揃っているかを見る
- **1 つの型に、本来直交する状態が同居する。** ある枝でしか意味を持たないフィールド
  （色トークンにしか無い swatch 等）を共通の親に持たせない

### 状態ごとに持つフィールドを変える

```typescript
// NG: 「hug なのに長さがある」「fixed なのに長さが無い」が表現できてしまう
type Size = Readonly<{ mode: "hug" | "fill" | "fixed"; length?: number }>;

// OK: 長さを持つのは fixed のときだけ、が構造に出る
export type Size =
  | Readonly<{ mode: "hug" }>
  | Readonly<{ mode: "fill" }>
  | Readonly<{ mode: "fixed"; length: number }>;
```

### ブランド型

```typescript
declare const FontWeightBrand: unique symbol;
export type FontWeight = Brand<number, typeof FontWeightBrand>;

export const FontWeight = {
  create(value: number): Option<FontWeight> {
    return Range.contains(FontWeightRange, value)
      ? Option.some(value as FontWeight)
      : Option.none;
  },
} as const;
```

- **目印の `unique symbol` は使う側で宣言する。** `unique symbol` は宣言した場所ごとに別の型に
  なるので、目印まで `Brand` の中へ書くとそこから作った型がすべて同じ目印を共有し、
  取り違えを弾けなくなる
- **同じ制約を持つ値を 1 つの型にまとめない。** `blur` と `spacing` はどちらも「0 以上の px」
  だが、まとめると片方をもう片方へ渡せてしまい、ブランドを入れた目的が消える
- **同じ制約の型が 2 つ以上あるなら、互いに代入できないことを `expectTypeOf` で固定する。**
  検証が同じだと実装を 1 つに畳んでも `tsc` もテストも通ってしまう（`FontSize` と `LineHeight`
  が実際にこれで、レビューまで気づかなかった / #143）

### 処理の通過を型に刻む

```typescript
// スキーマでデフォルトを持つ prop のキーが「必ず存在する」ことが構造に現れる
type DefaultedKeys<P extends PropDefinitionRecord> = {
  [K in keyof P]: P[K] extends { default: PropValue } ? K : never;
}[keyof P];

export type ResolvedProps<T extends PrimitiveType> = Props &
  Readonly<Record<DefaultedKeys<SchemaPropsOf<T>>, PropValue>>;

// 消費側は解決済みであることを型で要求する。未解決の Props は必須キー欠落でコンパイルエラー
function compile(props: ResolvedProps<"Box">): Style { /* ... */ }
```

## `comment-false-claim` — 主張を確かめずに書いた

書いた時点では**もっともらしく読める**ので、確かめない限り残る。

| 主張の形 | 確かめ方 | 実例 |
|---|---|---|
| この class / 属性が◯◯を防ぐ | 外した状態を実際に作って見る | `shrink-0` は守る対象を取り違えた上に実質 no-op（縮まないのは `min-width:auto` のため） |
| あの型は◯◯できない | できると書いてあるコードを探す | 「影・タイポは 1 つの値に畳めない」→ `token-control` の `valueTextOf` が実際に畳んでいた |
| この枝は値域付きの型しか持てない | 同じ差分の型テストを先に開く | `x` / `y` / `spread` は素の `number` のままなのに「値域付きの型しか持てないので」と書き、同じ差分の `shadow.type.test.ts` と矛盾していた |
| この API / フックはこう振る舞う | 公式ドキュメント・型定義を実際に読む | 「ref は render 中に読めない」と書いたが読めてしまう（React が推奨しないだけ） |
| この経路はまれにしか通らない | その経路に実際に到達する入力でコードを追う | 「巻き戻る状況でしか負にならない」と書いたが、mount 時 1 度だけ初期化される `now` により通常経路で毎回踏んでいた |
| CI / VRT はこういう結果になる(PR 本文) | 走らせてから書く。走らせる前に書くなら「見込み」と明記し、結果が出た時点で置き換える | pr-438: PR 本文に「VRT は差分が出る見込み」と書いたが、実測は 2 回とも差分 0 件(147 passed)。記録のタグは `comment-behavior-claim` |

## `comment-stale-edit` — 一部だけ直して終えた

**この判断は pr-305 で更新された。** `comment-stale-edit` は
`comment-referent-drift` / `comment-enumeration-drift` / `comment-premise-drift` /
`comment-block-placement` へ分割し、下の実例もそれぞれの節へ引き継いだ。以降は
1 件しか出ていない単発の形だけがこのタグに残る。

| 記述の組 | 実例 |
|---|---|
| コメントが手法を説明している | `switch` と書いたまま実装が対応表になっていた |
| 挙動を説明する記述が 2 箇所以上 | `@returns` は更新したのに、ゴールそのものを書いた唯一の箇所（呼び出し側のコメント）が元のまま |
| 削除・改名したシンボル名がコメントに残る | `isWithin` を `Range.contains` へ移した同じ PR で、`Brand.ts` の `@example` だけ古い名前を指したまま（typecheck も lint も落ちない） |

## `comment-referent-drift` — 名指しした先が同じ差分でずれた

| ずれ方 | 実例 |
|---|---|
| `@param` の名前が実引数名と不一致 | `rowsOf` の doc に `@param editables` と書いたが仮引数は `enabled`。`@param props` の説明も判定を済ませている呼び出し側 `sectionsOf` の doc をコピーしたまま残っていた |
| 移設・シグネチャ変更後も doc が旧層の型を根拠にしたまま | 上位層へ移した doc が、移動後の層からは参照できない型を名指ししたまま残っていた |

## `comment-enumeration-drift` — 列挙・件数が同じ差分の増減に追随しなかった

| ずれ方 | 実例 |
|---|---|
| 見出し項目を増やしたのに後続の件数表現が追随しない | `.claude/hooks/README.md` の「doc コメントとテスト規約は CI へ上げた」に import 規約を挿し込んで 3 項目にしたのに、後続の「この 2 つは層 2・層 3 にしか無かった」がそのまま残り、指す先が壊れた |

## `comment-premise-drift` — Why / Why not の前提が同じ差分で崩れた

| ずれ方 | 実例 |
|---|---|
| 分岐が無くなったのに、分岐由来の理由が残る | `PropertyPanelTitle` の doc に「`case` を足し忘れたときにコンパイルエラーにするため `ReactElement` と書いている」が残っていたが、この関数に `switch` は無く（`if` + 三項）、戻り値も `ReactElement \| null` で理屈が効かなくなっていた |
| 実装を対へ移した後もコメントが元の場所に逐語で残る | 実装をペアの型へ移したのに、Why / Why not をほぼ逐語のまま元の場所にも残し、二重管理になっていた |
| 未来形の見込みを、同じ差分が満たしたのに残す | pr-573: `claim-verification/SKILL.md` の段落が「後続のセッションが `pr-530.md` へ対策済を追記し、積み残しを解消することを想定する」で締められたまま、**同じ差分の `pr-530.md` がその行を追記していた**。「〜することを想定する」「後続で〜する」と書いた文は、差分の中にその「〜」が無いかを grep してから残す |

## `comment-block-placement` — doc の付着・行幅が機械的にずれた

| ずれ方 | 実例 |
|---|---|
| 隣接する `/** */` ブロックが同じ宣言に付く | メソッドを足す編集の途中で doc ブロックの位置がずれ、`sourceName` が doc を 2 つ重ねて持ち、`selectAllInstances` は doc 無しになっていた。**typecheck も lint も `check-doc-comments.sh` も落ちない**（`missing-doc-comments.py` は入れ子の宣言を対象外にしているため） |
| ファイル全体の doc が直後の宣言の doc に隣接する | テストファイル冒頭の `/**` ブロックが直後の `editor()` の doc に隣接し、ツール上は両方が `editor()` に付く形になっていた。このリポジトリには `/*`（アスタリスク 1 つ）で書き分けて宣言に付けない前例が既にある |

## `comment-missing` — 書くべき Why / Why not が無い

- **経緯を Issue の見出し番号だけで指す**（`// #183 の決定 B のため`）。番号はコードだけを読む
  人には何も伝わらない。理由そのものをその場に書く
- **却下しなかった非自明な選択に Why が無い。** `pressPointer` に `userEvent` を使わない理由が
  無く、レビューで聞かれて初めて書いた
- **置き場所の理由が無い。** pr-359: `collectEffectiveAssignments` の doc は「なぜ 1 つに
  寄せたか」だけを書き、コンパニオンのメソッドではなくフリー関数に置いた理由が無かった
  (「なんでフリー関数にしてるの？」と問われた)。何をするかの doc と、なぜそこに在るかは別の項目
- **既存の型へ寄せなかった Why not が無い。** pr-394: `DrawnBounds` を `CanvasBounds` に置かない
  理由がどこにも無かった。`CanvasBounds` へ `measure(name)` を足して `@/libs/canvas-dom` を
  import しても、`import-rule-violations.py` も `oxlint` も通る。止めているのが機械ではなく
  規範(`domains/` での I/O 禁止)だけのときは、書かなければ読んだ人が同じ検証をやり直す

置き場所・寄せ先の 2 つ(pr-359 / pr-394)に限った判定の分かれ目は「**素直な置き場所・素直な型が別にあり、
そこへ寄せても機械的には何も止まらないか**」。止まらないなら、寄せなかった理由は型にもテストにも
無いので、コメントにしか残らない。`implementation-reviewer` の語彙では、先例から外れた判断の理由が
無い形(`comment-missing-divergence`)の置き場所版にあたる。

## `comment-temporary-premise` — 理由の根拠に一時的な事実を置いた

規範は `rules/coding.md`「理由の根拠に、いま直されつつある一時的な事実を置かない」。記録上の分類は
`comment`(pr-718)。

| NG | OK |
|---|---|
| pr-718: `GradientStop.create` の doc が、境界が入口の `Option` だけである理由の後段を「その入口はまだ無い」に寄りかかっていた。トークンパネルから編集できるようにする #611 が入った時点で嘘になる | 「読み込みは値域を見ない(docs/04-tokens.md「値域の扱い」)。型では弾けないので、この入口の `Option` だけが境界になる」。仕様に拠るので、#611 が入っても残る |

判定の分かれ目は「**open な Issue / PR が入った瞬間に、その理由は偽になるか**」。なるなら、その変更が
入っても残る理由(型・構造・仕様・外部の制約)を探す。見つからなければ、理由そのものが Issue に
書くべき経緯。同じ doc の冗長さは「消すコメントの見分け」の「同じ理由の言い直し」に置いた。
ハーネスの規約側の同じ形は [process.md](process.md) `rules-consistency` の表にある。

`comment-premise-drift` とは確かめる範囲が違う。premise-drift は**同じ差分の中**で前提が崩れる形で、
差分を grep すれば見つかる。こちらは**差分の外で予定されている変更**で崩れる形で、open な Issue / PR
を見ないと見つからない。

## doc の形

```typescript
/**
 * 指す 1 つを取り除いたトークン一式。
 *
 * @param tokens 取り除く前のトークン一式
 * @param ref 取り除くトークンの種別と名前
 * @returns 指したトークンを除いた新しい一式。元の一式は変えない
 */
function withoutToken(tokens: TokenSet, ref: TokenRef): TokenSet { /* ... */ }
```

## 名前を付けてから結合する

```typescript
// NG: 何をどこから集めているか名前が無い
return [
  ...withLocation({ nodeName: artboard.name }, PropDefinitionRecord.collectErrors(/* ... */)),
  ...artboard.children.flatMap((child) => collectNodeErrors(child, context.tokens)),
  ...artboard.children.flatMap((child) => collectNodeRefErrors(context, child)),
];

// OK: 一旦名前を付けてから結合する
const propErrors = withLocation(/* ... */);
const childErrors = artboard.children.flatMap(/* ... */);
const refErrors = artboard.children.flatMap(/* ... */);
return [...propErrors, ...childErrors, ...refErrors];
```

## 消すコメントの見分け

| 消すもの | 例 |
|---|---|
| What の言い換え | `// キャンバスの下端に浮かべる` の隣に `absolute bottom-4` |
| コード内の値の再掲 | `（UI 案の 36×32 / border-radius:6px）` の隣に `h-8 w-9 rounded-md` |
| 経緯・実行履歴 | 「実際にアイコンを消して 703 件すべて通ることを確かめた」 |
| Issue の見出し番号だけを指す | `// #183 の決定 B のため` |
| 一般論 | 「アイコンだけのボタンなので読み上げ名が要る」 |
| 同じ理由の言い直し | pr-718: `GradientStop.create` の doc が「型では閉じられず入口の `Option` だけが境界」を 2 段落で 2 回言っていた。1 行で済む述語 2 つにも 6 行の doc が付いていた(同じ doc の一時的な事実は `comment-temporary-premise`) |

**消してはいけない Why**: 型やテストで表現できず、外すと壊れるのに壊れたことに気づけないもの
（「この `relative` を外すと浮くものが全部ずれるが、テストでは落ちない」）。

## コンパニオンオブジェクトの形

型と同名の const オブジェクトに、生成・判定・変換を集める。

```typescript
export type Money = Readonly<{
  amount: number;
  currency: "JPY" | "USD";
}>;

export const Money = {
  create(amount: number, currency: Money["currency"]): Money { /* バリデーション込み */ },
  add(a: Money, b: Money): Money { /* ... */ },
  isNegative(money: Money): boolean { /* ... */ },
} as const;
```
