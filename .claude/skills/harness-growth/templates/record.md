# 記録のテンプレート

`harness/records/pr-<番号>.md` へコピーして使う。

## Contents

- テンプレート
- 分類の語彙
- 書き方の例

---

## テンプレート

````markdown
# PR #<番号> <タイトル>

- マージ日: <YYYY-MM-DD>
- 関連 Issue: #<番号>
- 差分規模: <変更ファイル数> ファイル / +<追加行> -<削除行>

## ゴールと結果

<Issue に書いたゴールと、実際に達成できたか。ずれていたらそのずれ>

## 指摘

### 1. <一行で内容>

- 分類: `<語彙>`
- 出どころ: レビュー / CI / 自己修正 / フック
- 内容: <何が起きたか>
- 既存ルール: rules/<file>.md「<見出し>」 / なし
- 次にどう防ぐか: <ルール追記 / 観点に追加 / フック追加 / 今回は記録のみ>

### 2. <一行で内容>

...

## 手戻り

<計画から外れた箇所と、外れた理由。無ければ「無し」>

## うまくいったこと

<次も同じようにやりたいこと。無ければ「無し」>
````

---

## 分類の語彙

`分類` はここから選ぶ。**勝手に増やさない。** どれにも当てはまらないなら `なし` と書く
(それが規約の抜けの候補になる)。

| 分類 | 対応する規約 |
| --- | --- |
| `logic-ownership` | rules/architecture.md「ロジックの帰属先」 |
| `service-placement` | rules/architecture.md「services はドメインを探してから使う」 |
| `layer-dependency` | rules/architecture.md「依存方向のルール」 |
| `module-api` | rules/architecture.md「モジュールの公開API」 |
| `utils-form` | rules/architecture.md「utils の形式」 |
| `companion-object` | rules/coding.md「コンパニオンオブジェクトパターン」 |
| `immutability` | rules/coding.md「イミュータブル」 |
| `result-option` | rules/coding.md「エラーと不在の表現(Result / Option)」 |
| `signature` | rules/coding.md「関数のシグネチャ」 |
| `duplication` | rules/coding.md「同じ処理が2箇所に現れたら共通化する」 |
| `type-vocabulary` | rules/coding.md「値の語彙を型で閉じる」 |
| `illegal-state` | rules/coding.md「不正な状態を型で表現できなくする(型による境界)」 |
| `naming` | rules/naming.md |
| `comment` | rules/coding.md「コメントは実装と一致させる」「コメントは doc と Why / Why not に絞る」 |
| `test-placement` | rules/testing.md「配置と命名」 |
| `test-behavior` | rules/testing.md「古典学派のテスト」 |
| `test-nesting` | rules/testing.md「テストの書き方: ネスト禁止」 |
| `test-conditional` | rules/testing.md「テストケース内の条件分岐禁止」 |
| `effect` | rules/hooks.md「useEffect: 最終手段として扱う」 |
| `state-management` | rules/hooks.md「useState / useReducer の使い分け」 |
| `ref-guard` | rules/hooks.md「useRef の使い分け」 |
| `composition` | rules/components.md「Composition パターン」 |
| `ui-fidelity` | rules/ui-verification.md「UIの拠り所」 |
| `over-guard` | 過剰なブロック / フォールバック(implementation-flow のフェーズ 6) |
| `plan` | 計画の誤り・不足(implementation-flow のフェーズ 3〜4) |
| `なし` | 既存の規約に対応が無い(＝規約の抜けの候補) |

---

## 書き方の例

````markdown
### 1. ショートカットの一致判定が 1 本の式に並んでいた

- 分類: `naming`
- 出どころ: レビュー
- 内容: 3 つの一致条件を 1 本の連言で書いていたため、何と何を比べているのかが
  読み取れなかった。条件ごとに変数へ分けて名前を出す形へ直した
- 既存ルール: なし
- 次にどう防ぐか: 今回は記録のみ(1 回目)
````
