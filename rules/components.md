# コンポーネント規約

> **この規約は記録 32 本で 1 件も引かれていない**(`composition` の通算が 0 件)。フック・CI・型の
> どれでも強制していないので「効いているから 0」とは言えず、`harness-growth` の棚卸しで
> 縮めてある。指摘が出たら、その回に必要な分だけ書き戻す。

## Composition パターン

props が多くなったコンポーネントは、props を増やし続けるのではなく **Composition(合成)** で組み立てる。

- props が概ね5個を超える、または真偽値 props(`showHeader`, `hasFooter` 等)で内部の出し分けが増えてきたら Composition を検討する
- 「設定を渡して中身を制御する」のではなく「中身を子要素として渡す」形に変える

```tsx
// NG                                  // OK
<Card title="プロパティ" showIcon      <Card>
  iconType="settings" showFooter         <Card.Header align="center">プロパティ</Card.Header>
  footerText="適用" headerAlign="center" <Card.Body>...</Card.Body>
/>                                       <Card.Footer>適用</Card.Footer>
                                       </Card>
```

## 関連する部品は名前空間でまとめる

意味的にまとまりのある複合コンポーネントは、`Parent.Child` 形式(コンパウンドコンポーネント)で公開してよい。

- 親が暗黙のコンテキスト(状態・スタイル)を提供し、子がそれを利用する関係のときに使う
- 子を `Parent.Child` として公開する(`<FormNameField />` のような独立公開より、所属が型と補完で明確になる)
- 単なる無関係な部品の寄せ集めに名前空間を付けない(濫用禁止)

## Provider / Context の使いどころ

props のバケツリレーが長くなり、中間コンポーネントが自分では使わない値を下位へ渡すだけになっている場合は、Provider / Context を検討する。

- 3階層以上にわたって同じ props を通過させている、または複数の兄弟サブツリーで同じ UI 状態・設定が必要になったら Provider を検討する
- theme、locale、認証ユーザー、フォーム/ウィザードの局所状態、エディタ画面内の選択状態など、特定のサブツリー全体で読む値に使う
- まずは props / Composition / children で十分かを確認する。Provider は依存元が見えにくくなるため、単に1〜2階層渡すだけなら props を優先する
- Provider のスコープは必要最小限にする。アプリ全体で不要な feature 固有状態を root provider に置かない
- unrelated な値を1つの巨大 Context にまとめない。更新頻度や責務が異なる値は Provider を分ける

## hooks と UI の分離(headless 原則)

**カスタムフックは JSX を返さない。** state・派生値・ハンドラ・(必要なら DOM に spread する) props オブジェクトだけを返し、JSX の組み立ては呼び出し側コンポーネントが行う。React Aria / TanStack Table / React Hook Form 等が採る "headless" の方針に従う。

- 公開する(再利用される)カスタムフックは必ず headless で書く。UI ライブラリ・マークアップを hook 側で固定しない
- 例外: **同一コンポーネント内の private な整理**目的で、外に export しない hook が JSX を返すのは許容(ただし `features/<x>/` の外には公開しない)
- 共有 UI(ダイアログ等)が必要なら、フックではなく**通常のコンポーネント**(必要なら Provider と組み合わせ)で提供する

## その他

- 1コンポーネント1責務。表示と状態管理・データ取得を同居させない(ロジックは hooks / services 側)
- ドメイン知識を持たない汎用コンポーネントは `src/components/`、feature 固有は `features/<x>/components/`
- props はオブジェクトで受け、必要最小限に絞る。使わない props を「将来のため」に足さない
- 真偽値 props よりも、状態を表す列挙(`variant="primary"` 等)を優先する
