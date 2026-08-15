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
| `ownership-reasoning` | rules/architecture.md「ロジックの帰属先」(帰属先の判断・理由付け。第1引数の型を見る、という判断の起点を実際に適用できていない形。置き場所自体は合っていても理由が間違っている場合を含む) |
| `domain-input-convention` | rules/architecture.md「逆向きも見る: 入力欄の約束事をドメインへ持ち込まない」 |
| `domain-scope-promotion` | rules/architecture.md「配置の判断基準」(`features/<x>/domains/` か `src/domains/` かの昇格判断) |
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
| `naming-precedent` | rules/naming.md「名前と実体を一致させる」「内容を表さない汎用語を使わない」(命名前に、その語がこのリポジトリの他の場所──既存の接頭辞・UI 案・仕様書──で既に別の意味に使われていないかを確認していない形) |
| `naming-vocabulary-gap` | rules/naming.md / rules/coding.md(綴りの流儀や外部 API 名の借用可否など、命名規約にまだ判断基準が書かれていない論点がレビューで初めて示され、その場で rules へ追記して解消する形) |
| `comment-mismatch` | rules/coding.md「コメントは実装と一致させる」(コメントの内容が実装・現状と食い違う、または確かめていない主張を含む形。書く前に確かめていれば防げた) |
| `comment-missing` | rules/coding.md「コメントは doc と Why / Why not に絞る」(書くべき Why / Why not がコードに無い形。読み手が『なぜこれではないのか』を聞くまで気づかれない) |
| `test-placement` | rules/testing.md「配置と命名」 |
| `test-default-input` | rules/testing.md「既定値・フォールバックがある処理では、既定値と違う答えになる入力を選ぶ」(確かめた入力が既定値と一致しており、規則を壊すミューテーションでも既定値側で通ってしまう形) |
| `test-coverage-gap` | rules/testing.md「古典学派のテスト」/ `implementation-review.md`「テストが守っているかの観点」(差分の中心の判断・分岐がそもそもどのテストからも参照されておらず、ミューテーションで1件も落ちない形) |
| `test-nesting` | rules/testing.md「テストの書き方: ネスト禁止」 |
| `effect` | rules/hooks.md「useEffect: 最終手段として扱う」 |
| `state-management` | rules/hooks.md「useState / useReducer の使い分け」 |
| `ref-guard` | rules/hooks.md「useRef の使い分け」 |
| `composition` | rules/components.md「Composition パターン」 |
| `ui-fidelity` | rules/ui-verification.md「UIの拠り所」 |
| `ui-fidelity-misread` | rules/ui-verification.md「見るのはスクリーンショットではなくマークアップ」/ `implementation-review.md`「UI 要素の意味の観点」(マークアップを見たうえで、UI 要素が実際に何を表しているかを他の画面・状態・属性と突き合わせずに断定して読み違える形) |
| `over-guard` | 過剰なブロック / フォールバック(implementation-flow のフェーズ 6) |
| `plan` | 計画の誤り・不足(implementation-flow のフェーズ 3〜4) |
| `なし` | 既存の規約に対応が無い(＝規約の抜けの候補) |

---

## 書き方の例

````markdown
### 1. 新しく付けた接頭辞が、既存の別ドメインの語彙とかぶっていた

- 分類: `naming-precedent`
- 出どころ: レビュー
- 内容: `AssetPreviewCard` と名付けたが、`Asset*` はこのリポジトリでは「アセットパネルの
  一覧行」に使われている（`AssetList` / `AssetSearchField`）語彙で、この部品はカンバス上の
  プレビューだった。既存の接頭辞と対象が食い違っていたため `CanvasAssetPreview` へ改名した
- 既存ルール: rules/naming.md「名前と実体を一致させる」
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

`logic-ownership` は pr-192 時点で `ownership-reasoning` / `domain-input-convention` /
`domain-scope-promotion` へ分割した(rules 層まで介入済みなのに再発 5 件で飽和 —
同じく「2c. 介入後 5 回以上」)。5 件の内訳は「第1引数の型を見る、という判断の起点を
適用できていなかった」形が 3 件(置き場所自体は合っていて理由だけが誤っていた場合を含む)、
「入力欄の約束事(空文字を未設定と読む等)をドメインへ持ち込んだ」形が 1 件、
「feature 固有か `src/domains/` かの昇格判断を誤った」形が 1 件で、判断の性質が異なる
3 種が 1 タグに畳まれていた。過去の記録の `分類: logic-ownership` は書き換えない。

`test-behavior` は pr-211 時点で `test-default-input` / `test-coverage-gap` へ分割した
(rules 層まで介入済みなのに再発 5 件で飽和 — 同じく「2c. 介入後 5 回以上」)。5 件の
内訳は「確かめた入力が既定値と一致しており、ミューテーションでも既定値側で通ってしまう」
形が 2 件(pr-173#12・pr-192#5)、「差分の中心の判断・分岐がそもそもどのテストからも
参照されていない」形が 2 件(pr-185#7・pr-211#1)で、原因の性質が異なる 2 種が 1 タグに
畳まれていた。残り 1 件(pr-173#13)は happy-dom が Tailwind を解決しないため原理的に
テストで確かめられない形で、既存ルールどおりコメントで対処済みのケースであり、1 件しか
無いためどちらの新語彙にも割らない。過去の記録の `分類: test-behavior` は書き換えない。

`naming` は pr-211 時点で `naming-precedent` / `naming-vocabulary-gap` へ分割した
(rules 層まで介入済みなのに再発 5 件で飽和 — 同じく「2c. 介入後 5 回以上」)。5 件の
内訳は「命名前に、その語がこのリポジトリの他の場所(既存の接頭辞・UI 案・仕様書)で
既に別の意味に使われていないかを確認していなかった」形が 3 件(pr-173#15 の `Document*`
接頭辞・pr-205#1 の `install`・pr-211#9 の `Legend`)、「綴りの流儀や外部 API 名の借用可否など、
命名規約にまだ判断基準が書かれていない論点がレビューで初めて示され、その場で rules へ
追記して解消した」形が 2 件(pr-185#1・pr-185#2)で、原因の性質が異なる 2 種が 1 タグに
畳まれていた。後者はいずれも指摘と同じ PR で rules へ追記して以降の再発が無いため
層=rules のまま据え置き、前者は既存ルールがあるのに気づく手段が無く出どころがすべて
レビューだったため、`implementation-review.md`「命名の観点」へ引き上げた。過去の記録の
`分類: naming` は書き換えない。

`ui-fidelity` は pr-199 時点で `ui-fidelity-misread` へ部分分割した(rules 層まで介入済み
なのに再発 5 件で飽和 — 同じく「2c. 介入後 5 回以上」)。5 件のうち 3 件(pr-162#9・pr-173#9・
pr-199#1)は「マークアップを見たうえで、UI 要素が実際に何を表しているかを他の画面・状態・
属性と突き合わせずに断定する」という同じ形で、原因の性質が共通していた。残り 2 件
(pr-157#6・pr-171#12)はそれぞれ「UI 案に無い配置を提案しかけた」「VRT の閾値未満の差を
赤くなると見込んだ」で性質が異なる単発の指摘のため、新語彙には割らず旧タグに残す
(1 件しか出ていない分類は何もしない)。層は `implementation-review.md`「UI 要素の意味の
観点」と `plan-review.md`「UI 案の要素が実際に何を表しているか」へ引き上げた(観点)。
フック化は不成立(要素が何を表すかの判断には意味理解が要り、機械判定できない)、新しい
スキルも不要(段取りが増えるのではなく判断基準が増えただけ)。過去の記録の
`分類: ui-fidelity` は書き換えない。
