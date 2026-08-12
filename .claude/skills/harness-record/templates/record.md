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

**`対策済` の行を書くのは `harness-growth` だけ。** `count.sh` はこれを「ここから
数え直す」の起点として読むので、介入していない回に書くと再発数が 0 に戻る。
記録を書く時点(`harness-record`)では、介入が無ければ「規約への反映」に
**無しとその理由**を書いて終える。

---

## 層の語彙

`対策済` の行に書く `層=` はこの 4 つ。**強制力の強い順**で、
`harness/records/count.sh` が次回の起点として読む
(`.claude/skills/harness-growth/SKILL.md`「Step 2」)。

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
| `duplication-test` | rules/testing.md「テスト用ヘルパーの置き場所」(`__tests__/` のヘルパー・定数・フィクスチャの重複。本体比較で機械判定できる形) |
| `duplication-logic` | rules/coding.md「同じ処理が2箇所に現れたら共通化する」(テスト以外の重複。同じ事実を複数箇所で独立に導出している等、判断が要る形) |
| `type-vocabulary` | rules/coding.md「値の語彙を型で閉じる」 |
| `illegal-state` | rules/coding.md「不正な状態を型で表現できなくする(型による境界)」 |
| `naming` | rules/naming.md |
| `comment-mismatch` | rules/coding.md「コメントは実装と一致させる」(コメントの内容が実装・現状と食い違う、または確かめていない主張を含む形。書く前に確かめていれば防げた) |
| `comment-missing` | rules/coding.md「コメントは doc と Why / Why not に絞る」(書くべき Why / Why not がコードに無い形。読み手が『なぜこれではないのか』を聞くまで気づかれない) |
| `test-placement` | rules/testing.md「配置と命名」 |
| `test-behavior` | rules/testing.md「古典学派のテスト」 |
| `test-nesting` | rules/testing.md「テストの書き方: ネスト禁止」 |
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

`分類: なし` が 10 件溜まったら語彙へ昇格させる
(`.claude/skills/harness-growth/SKILL.md`「`なし` の逃し弁」)。
**この表を更新するのは `harness-growth` の 2c と逃し弁だけ**で、
各記録を書く時点(`harness-record`)では増やさない。

`duplication` は pr-192 時点で `duplication-test` / `duplication-logic` へ分割した
(hook 層まで介入済みなのに再発 11 件で飽和 — `.claude/skills/harness-growth/SKILL.md`
「2c. 介入後 5 回以上」)。過去の記録の `分類: duplication` は書き換えない。

`comment` は pr-192 時点で `comment-mismatch` / `comment-missing` へ分割した
(観点層まで介入済みなのに再発 6 件で飽和 — 同じく「2c. 介入後 5 回以上」)。
6 件中 5 件が「書いた主張・説明が実装や事実と食い違う」形、1 件が「聞かれるまで
Why が無かった」形で、内容の誤りと欠如という別種の問題が 1 タグに畳まれていた。
過去の記録の `分類: comment` は書き換えない。
