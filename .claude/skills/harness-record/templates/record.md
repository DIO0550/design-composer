# 記録のテンプレート

`harness/records/pr-<番号>.md` へコピーして使う。書き方の実例は直近の記録を見る。

## テンプレート

````markdown
# PR #<番号> <タイトル>

- マージ日: <YYYY-MM-DD>
- 関連 Issue: #<番号>
- 差分規模: <変更ファイル数> ファイル / +<追加行> -<削除行>

## ゴールと結果

<Issue に書いたゴールと、達成できたか。ずれていたらそのずれ>

## 指摘

### 1. <一行で内容>

- 分類: `<語彙>`
- 出どころ: `<語彙>`
- 内容: <何が起きたか。3 行まで>
- 既存ルール: rules/<file>.md「<見出し>」 / なし

### 2. <一行で内容>

...

## 手戻り

<計画から外れた箇所と、外れた理由。無ければ「無し」>

## 発火

<発火ログ(record-firings.sh)から。次の 3 書式のどれか。読み方は harness-record スキル Step 1>

- 発火: `<スキル・エージェント名>` <回数>回
- 発火: 無し
- 発火: 計測対象外(フック不発)

## 規約への反映

<介入した分類と置いた場所。無ければ「無し」とその理由>

- 対策済: `<分類>` 層=<hook|skill|case-law> at pr-<番号>
````

**`対策済` の行を書くのは `harness-growth` だけ。** `count.sh` はこれを「ここから数え直す」の
起点として読むので、介入していない回に書くと再発数が 0 に戻る。現在の分類名で
書いた行は、その分類へ畳まれる旧語彙すべての窓を閉じる。

## 層の語彙

`対策済` の `層=` に書く。強制力の強い順。

| 層 | 置いた場所 |
| --- | --- |
| `hook` | linter 設定(`.oxlintrc.json` / Biome)・自前の検出器(`.claude/hooks/lib/`)・git hooks(`harness/githooks/`)・CI |
| `skill` | `.claude/skills/` の手順、`.claude/agents/` の観点 |
| `case-law` | `harness/case-law/` の判例 |

## 出どころの語彙

**ちょうど 1 つ**選ぶ。括弧の中に自由記述を足さない(詳細は「内容」に書く)。
人・bot・CI へ届いた指摘を `count.sh` が「再発」として数え、残りは「内部」として数える。

| 出どころ | 何を指すか | 再発 |
| --- | --- | :---: |
| `レビュー（人）` | 人が書いたレビュー。GitHub 上のものと、セッション中に受けた指示の両方 | ○ |
| `レビュー（bot）` | Copilot など GitHub 上の自動レビュー | ○ |
| `CI` | CI の失敗・報告(カバレッジ・VRT を含む) | ○ |
| `レビュー（plan-reviewer）` | 計画検証のサブエージェント | |
| `レビュー（implementation-reviewer）` | 実装検証のサブエージェント | |
| `フック` | git hooks / `.claude/hooks/` が止めた | |
| `自己修正` | 上のどれでもなく、自分で気づいて直した | |

## 分類の語彙

ここから選ぶ。**勝手に増やさない。** どれにも当てはまらないなら `なし` と書く。
分類は規範の単位で、その中のどの形かは「内容」と判例(`harness/case-law/`)が持つ。
旧語彙は `count.sh` が読むときに畳む(過去の記録は書き換えない)。

| 分類 | 対応する規範 | 旧語彙 |
| --- | --- | --- |
| `ownership` | rules/architecture.md「ロジックの帰属先」「配置の判断基準」「services」「utils の形式」 | `ownership-*` `domain-*` `logic-ownership` `service-placement` `utils-form` |
| `dependency` | rules/architecture.md「モジュールの公開API」「依存方向のルール」 | `layer-dependency` `module-api` |
| `type` | rules/coding.md「コンパニオンオブジェクト」「イミュータブル」「Result / Option」「関数のシグネチャ」「値の語彙」「型による境界」 | `companion-object` `immutability` `result-option` `signature` `type-vocabulary` `illegal-state` |
| `duplication` | rules/coding.md「同じ処理が2箇所に現れたら共通化する」/ rules/testing.md「テスト用ヘルパーの置き場所」 | `duplication-*` |
| `naming` | rules/naming.md | `naming-*` |
| `comment` | rules/coding.md「コメントは doc と Why / Why not に絞る」 | `comment-*` |
| `test` | rules/testing.md | `test-*` |
| `react` | rules/hooks.md / rules/components.md | `effect` `state-management` `ref-guard` `composition` `nested-interactive-event-boundary` |
| `ui` | rules/ui-verification.md | `ui-*` `vrt-blind-spot` `drag-feedback-incomplete` |
| `over-guard` | 過剰なブロック / フォールバック(`implementation-reviewer`) | — |
| `plan` | `implementation-flow` フェーズ 3〜4 / `plan-reviewer` | `plan-*` `version-bump-unverified` |
| `harness` | ハーネス自身(規約の矛盾・フック環境・サブエージェント制御・検査スクリプト・外部の挙動の未確認) | `rules-consistency` `docs-consistency` `subagent-control` `hook-environment*` `tooling-rule-scope-gap` `harness-process-drift` `tool-behavior-unverified` |
| `parallel-issue-work` | 同じ Issue を 2 つ以上の PR / セッションが並行して進める形（検査は `.github/workflows/pr-closing-issue.yml` の `duplicate-issue-pr`） | — |
| `なし` | 対応する規範が無い | — |
