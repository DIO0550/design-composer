# 判例: 整合性

規範は [`rules/consistency.md`](../../rules/consistency.md)。ここはその実例。

## `dependency` — 器が中身を知っていた（sidebar → assets / tokens）

`features/editor/features/sidebar` の `LeftPane` が、行き先ごとの中身を自分で `import` して
描いていた。

| | 形 |
|---|---|
| NG | `left-pane/index.tsx` が `@/features/editor/features/assets` の `AssetsPanel` / `CreateComponent` と `@/features/editor/features/tokens` の `TokenList` を読み、`switch` 3 つ（`LeftPaneContent` / `searchLabelOf` / `leftPaneFooter`）で出し分ける |
| OK | `LeftPane` は `Record<LeftPaneView, LeftPaneViewContent>` を受け取って引くだけにし、中身は親（`features/editor` の `opened-document-editor`）が差し込む |

見分け方は **props の中身**。`sidebar` は `grab` / `tokenSelection` / `token` を editor から預かって
中身へ横流ししているだけで、自分では読んでいなかった。**器が使わない props を通しているのは、
中身と結合しているサイン。** 器化で props は 11 個から 4 個になった。

`LayersPanel` は sidebar 自身が実装を持つが、これも差し込みに揃えた（器は行き先ごとの中身を
一切持たない、を徹底するため。1 つだけ例外にすると次の行き先で判断が割れる）。

### Composition ではなく `Record` を選んだ

`<LeftPane.Tab>` を children で組む形は採らない。**children からは全行き先が揃っていることを型で
保証できない**。元の実装が `switch` + `ReactElement` で「足し忘れた行き先が黙って空になる」を
警戒していたので、その保証を `Record<LeftPaneView, …>` へ移した。再描画コストは両者で差が無い。

### 差し込む型は直和にする

`{ search: Option<string>; render: (query: string) => ReactElement }` の 1 つの形にまとめると、
検索欄を持たない行き先（Tokens）にも常に `""` が渡り、その語に意味が無いことが型に出ない。
`kind: "plain" | "searchable"` の直和にして、欄を持たない行き先の `render` は引数を取らない形にした。

## `naming` — `Tab` はこのリポジトリの語彙に無い

差し込む型の名前を最初 `LeftPaneTab` にしたが、`docs/06-ui.md` に `tab` は `grep -ic` で 0 回、
UI 案の展開後で 1 回（`rail` は 8 回）。既存の型は `LeftPaneView` / `LeftPaneViews` /
`LeftPaneViewLabels` で、doc の語彙は「レール」「行き先」。**`LeftPaneViewContent`** に揃えた。

## `dependency` — ネストしないもの（`features/editor/features/tokens`）

`TokenList`（左ペイン）・`TokenEditor`（右ペイン）・`TokenDashedNodes`（キャンバス）は表示される
場所が 3 つに分かれているが、**同じ `TokenSelection` に反応し、
`features/editor/features/tokens/domains/token-control` の見せ方を共有している**。使われ方で 3 つに割ると凝集が壊れるので、1 つのまとまりのまま editor 直下に置く。

**参照元が 2 つ以上ある feature は、共通の親の直下に置き、親が両方へ差し込む。**

## 兄弟参照を禁止する理由（一般には多数派ではない）

一般には公開API 経由の兄弟参照を許す構成が多数派（React 公式・Next.js 公式は意見なし、
bulletproof-react は提案レベル、明確に禁止しているのは FSD のみ）。

**ここで禁止するのは業界標準だからではなく、このアプリでは合成役が `editor` 1 つに決まっていて、
それ以外が他 feature を組む必要が無いから。** 合成役が複数になったら再検討する。

禁止で得られるもの。

- **依存の向きが 1 つに定まる。** 親 → 子だけになるので、どの feature を直せば何に波及するかが
  構造から読める。兄弟参照を許すと、同じ階層の中に隠れた上下関係ができる
- **器が中身を知らなくなる**（上の `LeftPane` の判例）

## `dependency` — `feature-cycle` は子→親を押さえていない

「子が親を読むのは `feature-cycle` が拾う」は**偶然の被覆**。閉路は**親がその子を import している
間しか成立しない**ので、親が import をやめた子は素通りになる。子から祖先への向きは
`feature-ancestor` が独立して押さえる。

移行時の実測では、7 つの子のうち `assets` だけが editor から未 import だった（器化で 7 つになった）。

## `harness` — 検出器の判定表は移動で静かに嘘になる

`import-rule-violations.py` に pytest は無く、判定表は `.claude/hooks/README.md` の probe レシピ。
probe が書いている綴り（`@/features/editor/features/canvas/domains/canvas-view` 等）は
フォルダを動かすと解決できなくなり、**違反が出なくなって probe が静かに緑になる**。フォルダを動かす変更では、
README の probe も同じ差分で直す。
