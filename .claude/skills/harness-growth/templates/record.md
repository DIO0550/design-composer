# 記録のテンプレート

`harness/records/pr-<番号>.md` へコピーして使う。

## Contents

- テンプレート
- 層の語彙
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

## 規約への反映

<介入した分類ごとに、置いた場所と、それより上の層を採らなかった理由。
 介入が無ければ「無し」とその理由>

**この回の介入（`count.sh` が数える行）:**

- 対策済: `<分類>` 層=<hook|skill|観点|rules> at pr-<番号>
````

---

## 層の語彙

`対策済` の行に書く `層=` はこの 4 つ。**強制力の強い順**で、
`harness/records/count.sh` が次回の起点として読む(SKILL.md「Step 4」)。

| 層 | 置いた場所 |
| --- | --- |
| `hook` | git hooks(`harness/githooks/`)・CI・`.claude/hooks/` |
| `skill` | `.claude/skills/` の新しいスキル |
| `観点` | 既存スキルの手順・観点(`implementation-flow` と `references/`) |
| `rules` | `rules/` への追記・表現の修正 |

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
| `effect` | rules/hooks.md「useEffect: 最終手段として扱う」 |
| `state-management` | rules/hooks.md「useState / useReducer の使い分け」 |
| `ref-guard` | rules/hooks.md「useRef の使い分け」 |
| `composition` | rules/components.md「Composition パターン」 |
| `ui-fidelity` | rules/ui-verification.md「UIの拠り所」 |
| `ui-affordance` | rules/ui-verification.md「UI案の見た目と、操作性・入力値域は別に確かめる」 |
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

`分類: なし` が 10 件溜まったら語彙へ昇格させる(SKILL.md「`なし` の逃し弁」)。
語彙を割る・足すのはそこと 4c だけで、各記録を書く時点では増やさない。
