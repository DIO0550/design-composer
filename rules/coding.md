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

`domains/` 内のファイルは可能な限り不変に保つ。

- 引数で受け取った配列・オブジェクトを破壊的に変更しない(`push` / `splice` / `sort` / プロパティへの再代入など)
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

## 状態を型で表現する(型による境界)

「ある処理を通過したこと」(検証済み・解決済み・正規化済みなど)が後続処理の前提になる場合、その事実を**構造の違いを持つ型**として表現し、未処理の値を処理済みとして受け渡せない**境界**を作る。

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
- 単一ドメインオブジェクトに帰属するロジック(判定・計算・変換)はコンパニオンオブジェクトのメソッドとして実装する
- 複数ドメインに跨るロジックは `services/` に置く。features 層にドメイン知識(判定条件・計算規則の定義など)を書いてはならない
- features 層の責務は「services / domains のオーケストレーションとUI」のみ
- class は使用しない(type + companion object で統一)
- ブロックのネストは**3段まで**(lint の `max-depth` で強制)。早期リターン・関数分割でフラットに保つ

## 禁止事項

- `any` の使用
- `domains/` `services/` での I/O(console, fs, localStorage, fetch, Tauri API 等)— I/O は `libs/` のみ
