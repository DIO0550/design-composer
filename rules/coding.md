# コーディング規約

## コンパニオンオブジェクトパターン

ドメインロジックは**ドメインオブジェクト自身に閉じ込める**。
型と同名の const オブジェクトを定義し、生成・判定・変換ロジックをそこに集約する。

```typescript
// 例(汎用)
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

## イミュータブル

**引数で受け取った値を変更しないことは全レイヤー共通の規約。** そのうえで `domains/` 内のファイルは可能な限り不変に保つ。

- 引数で受け取った配列・オブジェクトを破壊的に変更しない(`push` / `splice` / `sort` / プロパティへの再代入など)。走査中のカーソルやエラー蓄積用の配列も同様で、「内部で使う可変オブジェクト」を引数で引き回さない
- 更新が必要な場合はコピーを作って新しい値を返す(スプレッド構文、`map` / `filter` / `toSorted` など)
- `let` による再代入も可能な限り避ける

```typescript
// NG: 引数を破壊的に変更している
function addItem(list: Item[], item: Item): Item[] {
  list.push(item);
  return list;
}

// OK: 新しい配列を生成して返す
function addItem(list: readonly Item[], item: Item): readonly Item[] {
  return [...list, item];
}
```

## エラーと不在の表現(Result / Option)

**例外を投げない。** 失敗しうる処理は `Result<T, E>` を、値が無いことがありうる処理は `Option<T>` を返す(`src/utils/Result.ts` / `src/utils/Option.ts`)。

- `throw` / `try-catch` は使わない。「見つからない」「不正な入力」「循環参照」などはすべて `Result.err` / `Option.none` で表現する
- 戻り値の `T | undefined` / `T | null` を不在の表現に使わない。不在は `Option` で表す
- 失敗を握りつぶして既定値へフォールバックしない。呼び出し側が分岐できるよう、そのまま伝播させる(`Result.map` / `Result.flatMap` で連鎖する)
- **同じモジュール内で throw ベースと Result ベースを混在させない。** 公開APIの一部だけを `Result` 化して残りを throw のままにしない
- 例外に変換してよいのは、外部ライブラリの境界(`libs/`)と、失敗したらテストを落としたいテストコード(`Result.unwrap`)だけ

```typescript
// NG: 例外で失敗を伝える / undefined で不在を伝える
function findNode(document: DesignDocument, name: string): Node | undefined { /* ... */ }
function moveNode(document: DesignDocument, name: string): DesignDocument {
  throw new Error(`node "${name}" not found`);
}

// OK: 不在は Option、失敗は Result
function findNode(document: DesignDocument, name: string): Option<Node> { /* ... */ }
function moveNode(
  document: DesignDocument,
  name: string,
): Result<DesignDocument, Error> { /* ... */ }
```

## 関数のシグネチャ

- **引数は最大3つまで。** 4つ以上になったら、常に一緒に渡る値をまとめた型を作って名前を付ける(`ReferenceContext` / `BindingLocation` など)
- 引数が増える原因が「1件ずつ受け取って呼び出し側でループしている」ことなら、**反復を関数の内側へ移す**(1エントリではなく、まとまり全体を受け取る)
- 同じ型の位置引数が2つ以上並び、取り違えても型エラーにならない場合はオブジェクト引数にする
- **意味のないジェネリクスを付けない。** 型引数は、実際に2種類以上の具体型で使われるときだけ導入する。呼び出しが実質1種類なら具体型で書き、用途が2つあるなら型を2つに分ける

## 値の語彙を型で閉じる

**取りうる値が仕様上決まっているものを `string` / `number` のままにしない。** union 型・テンプレートリテラル型で語彙を閉じ、タイポや単位違いをコンパイルエラーにする。

```typescript
// NG: 任意の文字列が通る
function create(property: string, value: string): CssDeclaration { /* ... */ }
const length = `${value}px`;

// OK: 語彙と単位が型に出る
export type CssProperty = "display" | "flex-direction" | "gap" | "padding" /* ... */;
export type Px = `${number}px`; // "16" / "16rem" は代入不可
```

- 仕様(`docs/`)が列挙している語彙はそのまま union にする。定数から導出できる場合は `as const satisfies` で導出し、二重管理しない
- 単位付きの値は単位を型に含める。合成順が決まっている値は並びを型に出す(`` `${Px} ${Px} ${Px} ${Px} ${string}` ``)
- ただし、プロパティごとに値域が違うなど**対で縛るコストが釣り合わない場合は無理に縛らない**。縛らなかった理由をコメントに残す

## 不正な状態を型で表現できなくする(型による境界)

**バグは直すのではなく、表現できなくする。** 型はコンパイラの装飾ではなく、不正な状態をコードの世界に存在させないための境界(防壁)として設計する。実行時チェックやテストで「見つける」前に、そもそも書けなくすることを考える。

### 正しい状態だけを列挙する

boolean や `Option` の組み合わせで矛盾した状態が作れてしまうなら、**取りうる状態を直和(判別可能な union)で列挙**し、状態に応じて持つフィールドを変える。

```typescript
// NG: 「hug なのに長さがある」「fixed なのに長さが無い」が表現できてしまう
type Size = Readonly<{ mode: "hug" | "fill" | "fixed"; length?: number }>;

// OK: 長さを持つのは fixed のときだけ、が構造に出る(domains/size)
export type Size =
  | Readonly<{ mode: "hug" }>
  | Readonly<{ mode: "fill" }>
  | Readonly<{ mode: "fixed"; length: number }>;
```

### 生成時に検証し、不正な値を存在させない

制約を持つ値は、コンパニオンオブジェクトの `create` が**検証込みで生成**する(Smart Constructor)。検証に失敗しうるなら `Result` / `Option` を返し、「生成された = 制約を満たしている」を成立させる。生成後に呼び出し側が検証する設計にしない(検証を通っていない値が型上は同じ顔で流通してしまう)。

### 処理の通過を型に刻む

「ある処理を通過したこと」(検証済み・解決済み・正規化済みなど)が後続処理の前提になる場合、その事実を**構造の違いを持つ型**として表現し、未処理の値を処理済みとして受け渡せない**境界**を作る(Parse, don't validate: 検証は boolean を返すのではなく、検証済みを表す型への変換として書く)。

```typescript
// 例: デフォルト解決済み props。
// スキーマでデフォルトを持つ prop のキーが「必ず存在する」ことが構造に現れる
type DefaultedKeys<P extends PropDefinitionRecord> = {
  [K in keyof P]: P[K] extends { default: PropValue } ? K : never;
}[keyof P];

export type ResolvedProps<T extends PrimitiveType> = Props &
  Readonly<Record<DefaultedKeys<SchemaPropsOf<T>>, PropValue>>;

// 消費側は解決済みであることを型で要求する。
// 未解決の Props を渡すと必須キー欠落でコンパイルエラーになる
function compile(props: ResolvedProps<"Box">): Style { /* ... */ }
```

### ルール

- 消費側の関数は、自分が前提とする状態の型を**引数で要求する**。呼び出し側の規律ではなく型で誤用を防ぐ
- **構造が変わらない型エイリアスの新設は禁止**(`type ResolvedProps = Props` 等)。構造的型付けでは何も防がないのに「別の型がある」と誤読させる。境界にならない型は作らず、処理を表す関数名で意図を示す
- 状態の違いは可能な限り**実在する構造の違い**として表現する(必須キーの追加、値域の狭窄など)。スキーマ等の定数から導出する場合は `as const satisfies` でリテラル型を保存し、型レベルで走査して導出する(情報を二重管理しない)
- 狭い型への `as` は、**実行時にその事実を成立させる処理の戻り値1箇所のみ**許可する(構築処理と型の境界を一致させる)。境界以外での `as` によるすり抜けは禁止
- ブランド型(`& { readonly __brand: unique symbol }`)は構造で表現できない場合の最終手段。防ぎたい誤用が実際にコード上へ現れてから導入する(推測での先回り導入は過度な抽象化)
- 型レベルの保証が仕様の一部であるときは、`expectTypeOf` によるテストで退行を検知する

## ルール

- ドメインオブジェクトを**型定義のみで実装しない**。`domains/` に置く以上、生成・判定・変換のロジックを持つコンパニオンオブジェクトを必ずセットで実装する
- 型とコンパニオンオブジェクトは**同一ファイル**で定義する。型だけを `type.ts` / `types.ts` に分離して `domains/` に置かない(ロジックを持たない純粋な型は `types/` フォルダの担当)
- ドメインの型はすべて `Readonly` / イミュータブル
- ロジック(判定・計算・変換)はコンパニオンオブジェクトのメソッドとして実装する。**「複数ドメインに跨るから」を理由に `services/` へ逃がさない**(帰属先の探し方は `rules/architecture.md`「services はドメインを探してから使う」)
- features 層にドメイン知識(判定条件・計算規則の定義など)を書いてはならない。features 層の責務は「domains のオーケストレーションとUI」のみ
- class は使用しない(type + companion object で統一)
- ブロックのネストは**3段まで**(lint の `max-depth` で強制)。早期リターン・関数分割でフラットに保つ
- **同じ処理が2箇所に現れたら共通化する**(実装・テストとも)。汎用操作なら `utils/`、ドメインの規則ならコンパニオンオブジェクトへ
- 長い配列の結合をインラインのスプレッドで書かない。**中身に名前を付けた変数へ入れてから結合**し、何をどこから集めているかを名前で示す
- コメントは実装と一致させる。挙動を曖昧にまとめず対象を列挙する(「タグの開始だけを潰す」ではなく「`&` `<` `>` を実体参照へ変換する」)。実装を変えたらコメントも同時に直す

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

## 禁止事項

- `any` の使用
- `domains/` `services/` での I/O(console, fs, localStorage, fetch, Tauri API 等)— I/O は `libs/` のみ
