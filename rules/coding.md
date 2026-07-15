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
