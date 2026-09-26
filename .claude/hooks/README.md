# .claude/hooks — 実装規約の強制フック

Claude Code で `rules/` 配下の実装規約を**強制**するためのフックスクリプト置き場。
[d-market-typescript の typescript-rules-plugin](https://github.com/DIO0550/d-market) の hooks から、
このリポジトリの規約に合致するものを移植・適応したもの。

## 強制している規約

| スクリプト               | イベント                  | 内容                                                                                     |
| ------------------------ | ------------------------- | ---------------------------------------------------------------------------------------- |
| `block-npx.sh`           | `PreToolUse` (Bash)       | **npx / pnpm dlx 禁止**。パッケージは `pnpm add` でインストールしてから使用する           |
| `block-lint-suppress.sh` | `PreToolUse` (Edit/Write) | **lint 抑制コメント禁止**。`biome-ignore` / `eslint-disable` の追加を拒否する             |
| `post-edit-lint.sh`      | `PostToolUse` (Edit/Write) | **編集後の自動リント**。oxlint / Biome を `--fix` 付きで実行し、残った診断をフィードバック |
| `check-test-rules.sh`    | `PostToolUse` (Edit/Write) | **テスト規約検証**(rules/testing.md)。describe 禁止・テストケース内の条件分岐禁止・命名規則・置き場所(`__tests__/` 直下)をチェック |
| `pre-push-typecheck.sh`  | `PreToolUse` (Bash)       | **push 前の型チェック**。`pnpm run typecheck`(tsc -b)でエラーがあれば push をブロック    |
| `pre-push-lint.sh`       | `PreToolUse` (Bash)       | **push 前の全体 lint**。oxlint / Biome のエラーがあれば push をブロック                   |
| `pre-push-test-rules.sh` | `PreToolUse` (Bash)       | **push 前の全体テスト規約検査**。全 `*.test.ts(x)` を検査し違反があれば push をブロック   |
| `check-test-helper-duplication.sh` | `PostToolUse` (Edit/Write) | **テストヘルパーの重複検出**(rules/testing.md「テスト用ヘルパーの置き場所」)。プロジェクト全体の `__tests__/` を横断し、本体が一字一句同じヘルパーが 2 つ以上あれば知らせる |
| `check-doc-comments.sh`  | `PostToolUse` (Edit/Write) | **doc コメントの検証**(rules/coding.md「コメントは doc と Why / Why not に絞る」)。doc の無い宣言と、`@param` / `@returns` / `@throws` が欠けた doc を知らせる |
| `pre-push-doc-comments.sh` | `PreToolUse` (Bash)     | **push 前の doc コメント検査**。`src/` に doc の無い宣言、または `@param` / `@returns` / `@throws` の欠けた doc があれば push をブロック |
| `pre-push-import-rules.sh` | `PreToolUse` (Bash)     | **push 前の import 規約検査**(rules/architecture.md「モジュールの公開API」「依存方向のルール」)。公開 API を迂回する import・循環参照・カテゴリの外に置かれた domains のモジュールがあれば push をブロック |
| `pre-push-result-option-reads.sh` | `PreToolUse` (Bash) | **push 前の判別子の直読み検査**(rules/coding.md「エラーと不在の表現」)。`Result` / `Option` の判別子(`ok` / `some`)を、その判別子を型宣言で定義していないファイルで直読みしていれば push をブロック |
| `pre-push-story-titles.sh` | `PreToolUse` (Bash)     | **push 前の story の title 検査**(対応する規範は `rules/` に無く、フックだけが持つ)。story の `title` が、最後のセグメント(葉に出る表示名)を除いてフォルダ階層と食い違っていれば push をブロック |
| `pre-push-named-paths.sh` | `PreToolUse` (Bash)    | **push 前の名指ししたパスの検査**(対応する規範は `rules/` に無く、フックだけが持つ)。コメント・doc が名指ししているパスに当たる実体が無ければ push をブロックする |
| `post-merge-review.sh`   | `PostToolUse` (Bash/MCP)  | **マージ後の振り返りの提示**。PR のマージを検知し、Issue への追記・続きの Issue・評価の記録を促す       |
| `hook-canary.sh`         | `PreToolUse` (Bash)       | **カナリア**。`echo hook-canary` を必ず deny する。連ねたコマンドの中にあっても切り出して見る。通ってしまったときの読み方は後述（**通った = 不発、ではない**） |
| `session-url-notice.sh`  | `SessionStart`            | **セッション URL の提示**（AGENTS.md「Issue に紐づいて起動したら、セッションの URL を Issue に残す」）。URL を組み立てて渡す。ブランチが `claude/issue-<N>-...` なら対象の番号も添える。コメントする前に、他セッションの URL コメント・自分以外の assignee が無いかを確認するよう促す（`parallel-issue-work`） |
| `record-firings.sh`      | `SessionStart` + `PostToolUse` (Skill/Task/Agent) | **スキル・サブエージェントの発火ログ**。tmp のセッション別ログへ追記し、`harness-record` が記録を書くときに読む。SessionStart のセッション見出しで「起動しなかった」と「フック不発」を切り分ける |
| `track-verification-agent-activity.sh` | `PreToolUse` + `PostToolUse` (Task/Agent) | **検証エージェントの実行中フラグ**。`plan-reviewer` / `implementation-reviewer` の開始・終了をセッション別のマーカーで数える。`block-git-during-verification-agent.sh` が読む |
| `block-git-during-verification-agent.sh` | `PreToolUse` (Bash)   | **検証エージェント実行中の git 操作を拒否**。マーカーが立っている間は `git add` / `commit` / `push` を deny する。ミューテーション実測の途中の書き換えをコミットへ取り込む事故を防ぐ |

## 移植元から見送ったもの

- `require-skill-before-edit.sh` — typescript-rules-plugin 固有のスキルに依存するスキルゲートのため

### 見送りを取り消したもの

- `check-jsdoc-rules.sh` / `pre-push-jsdoc.sh` — 「JSDoc 必須ルールはこのリポジトリの規約に存在しない」を理由に見送っていたが、**その前提は PR #152 で `rules/coding.md`「コメントは doc と Why / Why not に絞る」が入った時点で消えていた**。見送りの判断が更新されないまま残り、PR #157 で doc の無い関数がレビューまで残った(#157 のレビュー / `harness/records/pr-157.md`)。移植元をそのまま戻すのではなく、このリポジトリの形(型とコンパニオンオブジェクトが doc を共有する)に合わせた `check-doc-comments.sh` を書いた
- `record-skill-fired.sh` — 「plugin 固有のスキルに依存する」を理由に見送っていたが、その理由は**特定スキルへのゲート**にしか当てはまらず、発火を記録すること自体は汎用だった。`harness-record` の材料のうち発火だけが記憶(自己申告)からしか取れない穴が残っていたため、汎用版を `record-firings.sh` として書いた
- **規約が増えたら、それを理由に見送ったフックを見直す。** 見送りの理由は「今の規約に無いから」であることが多く、規約が変わると理由ごと消える

## 配線

[`.claude/settings.json`](../settings.json) の `hooks.PreToolUse` / `hooks.PostToolUse` から参照。
パスは `$CLAUDE_PROJECT_DIR` 基準。

`lib/` はフック本体から読む共有部品と、フックの判定を固定する判定表(`*-cases.sh`)の置き場。
`settings.json` からは参照しない。

| ファイル | 使う側 | 内容 |
| --- | --- | --- |
| `lib/test-conditionals.awk` | `check-test-rules.sh` / `pre-push-test-rules.sh` | `test()` / `it()` ブロック内の `if` / `else` / `switch` を行番号付きで出力する |
| `lib/duplicate-test-helpers.py` | `check-test-helper-duplication.sh` / `.github/scripts/check-added-test-helper-duplication.sh`(CI と `harness/githooks/pre-push`) | プロジェクト全体の `__tests__/` を横断して本体が完全に一致するヘルパーを探す。`--all` で全体、`--lines` で 1 ファイルの重複行を `<行番号>:<名前>` で機械可読に出力できる |
| `lib/missing-doc-comments.py` | `check-doc-comments.sh` / `pre-push-doc-comments.sh` / `harness/githooks/pre-push` / `frontend.yml` の `rules-check` | `src/` のファイル直下の宣言とコンパニオンオブジェクトの直下のメソッドのうち、doc コメントの無いもの・項目の欠けたものを探す。`--all` で全体を見る |
| `lib/test-rules-scan.sh` | `pre-push-test-rules.sh` / `harness/githooks/pre-push` | 指定したルート配下の `*.test.ts(x)` をすべて検査する。違反があれば exit 1 |
| `lib/lint-suppressions.py` | `block-lint-suppress.sh` / `.github/scripts/check-added-lint-suppressions.sh`(CI と `harness/githooks/pre-push`) | 許可されていない lint 抑制コメントの行を報告する。例外の判定もここが持つ |
| `lib/import-rule-violations.py` | `pre-push-import-rules.sh` / `harness/githooks/pre-push` / `frontend.yml` の `rules-check` | 公開 API を迂回する import（`feature-public-api` / `module-public-api`）・循環（`import-cycle` / `feature-cycle`）・カテゴリの外に置かれた domains のモジュール（`domains-category`）を報告する |
| `lib/ts_sources.py` | `lib/import-rule-violations.py` / `lib/result-option-read-violations.py` / `lib/story-title-violations.py` / `lib/named-path-violations.py`（報告の形だけ） | `src/` の走査対象の集め方・報告の形・コマンドラインの受け方と、feature の連なりの辿り方（`feature_of()`）。ファイル名だけアンダースコアなのは、ハイフンを含む名前が Python の import 名にならないため |
| `lib/named-path-violations.py` | `pre-push-named-paths.sh` / `harness/githooks/pre-push` / `frontend.yml` の `rules-check` | コメント（`.ts` / `.tsx`）と Markdown の全文が名指ししているパスのうち、実体を持たないもの（`named-path-missing`）を報告する |
| `lib/pre-push-detector.sh` | `pre-push-import-rules.sh` / `pre-push-result-option-reads.sh` / `pre-push-story-titles.sh` / `pre-push-named-paths.sh` | `git push` のときだけ検出器を走らせ、違反があれば deny の JSON を返す（`deny_on_violations <検出器> <検査の名前> <直し方の一文>`）。**走査ルートは渡さない**（検出器が自分の既定で決める） |
| `lib/story-title-violations.py` | `pre-push-story-titles.sh` / `harness/githooks/pre-push` / `frontend.yml` の `rules-check` | story の `title` が、最後のセグメント（葉に出る表示名）を除いてフォルダ階層から導出した綴りと違うもの（`story-title-tree`）と、`title` をリテラル 1 行として取れないもの（`story-title-missing`）を報告する |
| `lib/result-option-read-violations.py` | `pre-push-result-option-reads.sh` / `harness/githooks/pre-push` / `frontend.yml` の `rules-check` | `Result` / `Option` の判別子（`ok` / `some`）を、その判別子を型宣言で定義していないファイルで直読みしている箇所（`result-option-read`）を報告する |
| `lib/cases-report.sh` | `lib/result-option-read-cases.sh` / `lib/story-title-cases.sh` / `lib/named-path-cases.sh` / `lib/missing-doc-comments-cases.sh` | 判定表が共有する、判定の読み取り（`decide` / `normalize_miss`）と報告（`report` / `cases_failed`）。ケースの並べ方と検出器の呼び方は判定表ごとに違うので、そこは各判定表が持つ |
| `lib/named-path-cases.sh` | `harness/githooks/pre-push` / `frontend.yml` の `rules-check`（「動作確認」でも手で走らせる） | `named-path-violations.py` へ判定表を流し、deny / pass / miss が期待どおりかを終了コードで報告する。食い違いがあれば exit 1 |
| `lib/canary-cases.sh` | `harness/githooks/pre-push` / `frontend.yml` の `rules-check`（「動作確認」でも手で走らせる） | `hook-canary.sh` へ判定表を流し、deny / pass / miss が期待どおりかを報告する。食い違いがあれば exit 1 |
| `lib/result-option-read-cases.sh` | `harness/githooks/pre-push` / `frontend.yml` の `rules-check`（「動作確認」でも手で走らせる） | `result-option-read-violations.py` へ判定表を流し、deny / pass / miss が期待どおりかを終了コードで報告する。食い違いがあれば exit 1 |
| `lib/story-title-cases.sh` | `harness/githooks/pre-push` / `frontend.yml` の `rules-check`（「動作確認」でも手で走らせる） | `story-title-violations.py` へ判定表を流し、deny / pass / miss が期待どおりかを終了コードで報告する。食い違いがあれば exit 1 |
| `lib/missing-doc-comments-cases.sh` | `harness/githooks/pre-push` / `frontend.yml` の `rules-check`（「動作確認」でも手で走らせる） | `missing-doc-comments.py` へ判定表を流し、deny / pass / miss が期待どおりかを終了コードで報告する。食い違いがあれば exit 1 |

## 強制力の序列 — フックが発火しない実行環境がある

biome の format 差分を含む状態で push が通り、CI で落ちた回がある。
**`pre-push-lint.sh` 単体は正しく動く**(一時ファイルを置いてフックへ直接 JSON を流し、
`&&` で連結した push コマンドにマッチすること・format 差分を検出して deny を返すことを実測)。
それでも push は通り、同じセッションでは `post-edit-lint.sh` による編集後の自動整形も
一度も働いていなかった。リモート実行環境(Claude Code on the web など)では
`.claude/settings.json` の配線が読み込まれないことがある。

**フェイルオープンかつサイレント**なので、通ったのか検査されなかったのかを区別できない。
したがって **Claude Code のフックを enforcement の最上位として数えることはできない**。
序列は次のとおり。

| # | 層 | 効く範囲 | タイミング | 置き場所 |
| --- | --- | --- | --- | --- |
| 1 | CI | 無条件 | push の後 | `.github/workflows/` |
| 2 | git hooks | クライアント非依存 | push の前 | [`harness/githooks/`](../../harness/githooks/README.md) |
| 3 | Claude Code hooks | CLI 起動セッションのみ | 編集・コマンドの直前 | ここ |
| 4 | skill / rules | お願いベース | 読まれたとき | `.claude/skills/` / `rules/` |

**push 前検査の enforcement は git hooks が担う。** ここにある `pre-push-*` は、同じ
スクリプト(`lib/`)を編集中に走らせる**最速フィードバック層**という位置づけになる。
`harness-growth` が「層 1(`hook`)に置く」と判断したときは、`harness/githooks/` か CI の
どちらかに置き、Claude Code 側はその共有版として足す。

### カバー範囲と残る穴

git hooks へ移せるのは **push 前に痕跡が残る検査だけ**。次の 2 つは発火しない環境では
効かず、git のイベントに対応物が無いので移設もできない。

| 効かなくなるもの | CI の代替 |
| --- | --- |
| `block-lint-suppress.sh`(編集時のブロック) | **あり**。抑制コメントは diff に残るので、`.github/scripts/check-added-lint-suppressions.sh` が**追加行の分だけ**同じ判定で落とす(許可される例外も `lib/lint-suppressions.py` で共有)。CI と push 前(git hooks)の両方が走らせる。**push 前は `python3` が使える環境だけ**(無ければ「飛ばします」と出して飛ぶ。CI は落とす → `.github/scripts/lib/detector-precondition.sh`) |
| `block-npx.sh`(セッション中の行為の禁止) | **無し**。push の時点で痕跡が残らないため代替不能 |
| `block-git-during-verification-agent.sh`(セッション中の行為の禁止) | **無し**。この競合はセッションの実行タイミングだけが原因で、コミット後のリポジトリの状態には痕跡が残らない |
| `session-url-notice.sh`(セッション URL の提示) | **無し**。URL はセッションの中にしか無く、残す先も GitHub のコメントなので、push の時点で痕跡が残らない。落ちても穴は開かない(規約が AGENTS.md に残り、失っても情報が 1 つ足りないだけでガードは破れない) |
| `post-edit-lint.sh` / `check-test-rules.sh` / `check-doc-comments.sh`(即時フィードバック) | 結果は push 前の検査(git hooks)と CI が拾う。**即時性だけが失われる** |
| `check-test-helper-duplication.sh`(即時フィードバック) | **部分的にあり**。`.github/scripts/check-added-test-helper-duplication.sh` が CI(層 1)と push 前(層 2 の git hooks。`python3` が使える環境だけ)で拾うが、既存の重複が `src` に残っているため**このブランチで追加された行だけ**が対象。触っていない既存分は push 時点でも拾えない |
| `record-firings.sh`(発火ログ) | **無し**。ただし失敗しても穴は開かない(セッション見出しが無いログは `harness-record` が「計測対象外」と書く設計で、誤ったゼロにはならない)。カナリアと同じ「失敗してもガードが破れない」検出系 |

### 「代替不能」が実際に不発だったとき、手動で肩代わりする

`block-npx.sh` / `block-git-during-verification-agent.sh` は上の表のとおり CI の代替が
**無し**。カナリア(次項)で不発が確定したら、「記録のみ」で終わらせず、そのフックが
止めるはずだった操作を手動で確認する(不発のままミューテーションがコミットへ混入した回と、
任意の `npx` 実行が素通りした回がある)。

| 不発したフック | 手動で確認すること |
| --- | --- |
| `block-npx.sh` | 実行した `npx` コマンドがリポジトリへ何か書き込んでいないか `git status` で確認する |
| `block-git-during-verification-agent.sh` | 検証エージェント実行中に作られたコミットの diff を、そのエージェントが直したはずの内容とだけ照合する(意図しない変更が紛れていないか) |

`session-url-notice.sh` の不発は対応不要(上の表のとおり、失っても情報が 1 つ
足りないだけでガードは破れない)。

**`frontend.yml` の `rules-check` は、git hooks(層 2)にしか無かった検査を CI(層 1)へ上げるために作った**(いま何を持っているかは下の「判定表をどの層へ置くか」と `harness/githooks/README.md`)。
**doc コメントとテスト規約の 2 つ**は層 2・層 3 にしか無かったが、**層 2 と層 3 は同じ環境で同時に抜ける**。
リモート実行環境はクローンからやり直すので `core.hooksPath` が未設定のまま
(`postCreateCommand` は DevContainer でしか走らない)で、そこは `.claude/settings.json` の
配線が読まれないことがある環境と同じだった。実際に doc の無い宣言が main へ入っている
(`src/domains/unit/elapsed`)。層 2 の配線は `pnpm install` の `prepare` が
自動でやるようにしたが、**同じ層で再発したら層を 1 つ上げる**に従い、検査そのものも
無条件に効く層へ置いた。

**行数のラチェット**(`harness/records/count.sh --ratchet`)は、上げたのではなく
**新設時から層 1 と層 2 に置いた**(同じ `rules-check` ジョブと `harness/githooks/pre-push`)。

#### 判定表をどの層へ置くか

**判定表(`*-cases.sh`)の置き場は、ここが持つ。** 検出器そのものをゲートが呼んで
いても、そちらは `src` や記録に違反が無い限り緑のままなので、**取りこぼす向きの退行**
(意図した取りこぼしの広がり・走査対象の抜け・報告の切り詰め)は判定表でしか捕まらない。

| 判定表 | 層 1(CI) | 層 2(`pre-push`) |
| --- | --- | --- |
| `harness/records/count-cases.sh` | あり | あり |
| `lib/result-option-read-cases.sh` | あり | あり(`python3` がある環境だけ) |
| `lib/story-title-cases.sh` | あり | あり(`python3` がある環境だけ) |
| `lib/named-path-cases.sh` | あり | あり(`python3` がある環境だけ) |
| `lib/missing-doc-comments-cases.sh` | あり | あり(`python3` がある環境だけ) |
| `lib/canary-cases.sh` | あり | あり(`python3` と `jq` が揃う環境だけ) |
| `.github/scripts/check-added-cases.sh` | あり(`lint-suppress` ジョブ) | あり(`python3` がある環境だけ) |
| `.github/scripts/check-pr-closing-issue-cases.sh` | あり | **無し(残る穴)** |
| `harness/githooks/lib/check-tally-cases.sh` | あり | あり |

- **`canary-cases.sh` だけは層 3 の部品(`hook-canary.sh`)を層 2・層 1 で検査する。**
  ゲートが見ているのは「リポジトリに入っているスクリプトの判定が変わっていないか」で、
  その部品がどの層で使われるかとは別。push 前手順(`implementation-flow` フェーズ 7)は
  カナリアの出力を読んで不発かどうかを決めるので、判定が黙って変わると手順の読みが嘘になる
- **`check-added-cases.sh` だけは層 1 のジョブが `rules-check` ではなく `lint-suppress`。**
  当てる 2 本(`check-added-*`)と同じジョブに置き、`python3` と git だけで完結する
- **`check-pr-closing-issue-cases.sh` は層 1 だけ。** 再試行と問い合わせ直しの待ち時間だけで
  60.5 秒かかる(実測)。`pre-push` 全体は 35.9 秒(実測・`node_modules` のある環境)で、載せると
  2.5 倍を超える。ここへ載せた 2 本は合わせて 2.2 秒、`harness/githooks/lib/check-tally-cases.sh` は 0.1 秒未満(実測)。**この穴は残したままなので、
  `check-pr-closing-issue.sh` を触ったときは手で走らせる**(「動作確認」)
- 層 3(`pre-push-*.sh`)には足さない。層 1 と層 2 の両方に置く以上、守る範囲が増えない

#### 撮影範囲の検査は層 1 と層 4 にしかない

`Storybook Visual Regression` は、視覚差分を取る前に**ストーリーが撮影のビューポートに
収まっているか**を見る。この検査は CI(層 1)と push 前手順(層 4。`implementation-flow`
フェーズ 7)にだけあり、**層 2 にも層 3 にも置いていない。**

| 計測したもの | 実測(ストーリー 179 本・`node_modules` のある環境) |
| --- | --- |
| `pnpm build-storybook` | 10.7 秒 |
| `pnpm visual:capture` | 3 分 26.7 秒 |
| 合計 | 3 分 37 秒 |

- **層 2 へ載せない理由は所要時間。** `pre-push` 全体の 6 倍かかり、上の
  `check-pr-closing-issue-cases.sh` を層 1 だけに置いた物差しに載らない
- **層 3 へも置かない。** かかる時間は同じで、3 分半の検査は「編集中に走らせる最速
  フィードバック層」という位置づけと合わない
- **層 4 が止めるのは、はみ出しを入れる側の PR。** `harness/records/pr-634.md` 指摘 25 が
  その形で、PropertyPanel の 6 ストーリーが枠の外へ出たまま main へ入った

**層 4 に残る穴は 5 つ。** ゲートは層 1 が持つので、どれも踏んだ先で CI が落とす。

| 残る穴 | 内容 |
| --- | --- |
| 走らせ忘れ | 層 4 は指示ベースなので飛ばせる |
| フォントの差 | **手元で通っても CI と等価ではない。** CI は `fonts-noto-cjk` を入れてから撮るので、書体が違う環境では折り返しが変わって高さが出ない(`harness/records/pr-651.md` 指摘 20。手元で 180 本すべて撮れたのに CI では 6 本が枠外)。撮影前のフォント検査は日本語が豆腐になっていないかしか見ないので、**書体違いは素通りして偽の成功になる** |
| Chrome | PATH に無ければ走らない(devDependencies に無く、`CHROME_BIN` で与える) |
| 踏む側は止まらない | main が壊れている間は、自分の差分と無関係な PR が赤を踏む(`pr-639.md` 指摘 19 / `pr-654.md` 指摘 21 はどちらも `src/` を 1 行も触っていない)。手順の条件にも当たらない |
| 比較は含まない | 手順が走らせるのは撮影まで。`visual:compare` は baseline を gh-pages から取る手間があるので入れていない。**撮影が通っても視覚差分が緑とは限らない** |

検査が読むのは `documentElement` の実寸(`scrollWidth` / `scrollHeight`)だけ。
[`.github/scripts/storybook-visual-regression.mjs`](../../.github/scripts/storybook-visual-regression.mjs)
の doc はこれに加えて「クリップされた中身は数に入らない」と書くが、その前提が崩れていることは
`harness/records/pr-634.md` 指摘 26 が実測している(#645)。

### 発火しているかを確かめる(カナリア)

`hook-canary.sh` は `echo hook-canary` を必ず deny する。push の前にこれを 1 度実行すると、
silent だったフックの不発が detected に変わる。

**通った = 不発、ではない。** カナリアは自分の取りこぼしと本当の不発を区別できないので、
通ったときは PreToolUse の痕跡を見て決める。

| カナリア | 検証エージェントのマーカー | 発火ログの見出し | 読み方 |
| --- | --- | --- | --- |
| deny された | — | — | **発火している** |
| 通った | ある | — | **カナリアの取りこぼし**。Task/Agent のフックは発火している(不発と書かない) |
| 通った | 無い | ある | SessionStart は発火している。PreToolUse は不明 |
| 通った | 無い | 無い | **本当に不発**(`分類: hook-environment`) |

```bash
ls -d "${TMPDIR:-/tmp}/design-composer-verification-agents-${CLAUDE_CODE_SESSION_ID:-}"
grep -c $'\tsession\t' "${TMPDIR:-/tmp}/design-composer-firings-${CLAUDE_CODE_SESSION_ID:-}.log"
```

**マーカーは `plan-reviewer` / `implementation-reviewer` を 1 度でも通した後にしか現れない。**
`track-verification-agent-activity.sh` がこの 2 つの Task/Agent でしか作らないため、着手直後に
カナリアを実行した回は 2 行目に当たらず、マーカー無しの枝へ落ちる。2 行目で読めるのは
`implementation-flow` フェーズ 7(`plan-reviewer` を通した後)以降。

マーカーが言えるのは **`Task|Agent` の PreToolUse か PostToolUse のどちらかが発火した**まで。
`mkdir -p` が `hook_event_name` の分岐より手前にあるので、PostToolUse だけでも作られる
(実測)。それでも見出し(SessionStart)より近いので枝を分けてある。

見出しのほうは `record-firings.sh` が **SessionStart** で書く。ログファイル自体は PostToolUse の
追記でも作られるので、**ファイルの有無ではなく見出し行を数える**(見出しの無いログは
`harness-record` が計測対象外として扱う)。

`CLAUDE_CODE_SESSION_ID` が無い環境では、`…-*` の glob で出たものが**別セッションの残骸**で
ないかを見出しの時刻で確かめる(tmp はコンテナに残る)。

実測は割れている。**同じ「リモート実行環境」でも発火する場合としない場合がある**ので、
不発を前提に設計しつつ、発火する側を捨てない(層 3 に置く価値はある)。

| 実測 | 起動元 | 結果 |
| --- | --- | --- |
| PR #192(2026-08-11) | webhook 起動 | **通ってしまった** = 不発 |
| 2026-08-14 | claude.ai/code から起動 | **deny された** = 発火 |
| 2026-09-12 | claude.ai/code から起動 | `echo hook-canary` は **deny され**、同じセッションの `echo hook-canary && echo done` は**通った** = カナリアの取りこぼし |

**2026-09-12 の行が、この表の読み方を変えた実測。** ただし**連ねて実行した回に限る**。
素の `echo hook-canary` は修正前の実装でも deny されるので(旧実装で実測)、素で実行して
通った回の結論は今も有効。#192 はその形で、不発のまま。

**カナリアだけは外部コマンドに依存しない。** PreToolUse は exit 2 以外の異常終了を
「非ブロックのエラー」として素通りさせるので、`jq` の無い環境では他のフックと同様に
カナリアも exit 127 で終わり、**配線が読まれていない場合とまったく同じ見え方**になる
(実測: `jq` を PATH から外すと deny が出ずに exit 127)。それでは「フックは動いていたのに
不発と報告する」ことになり、検出そのものが信用できない。判定も出力も bash の組み込みだけで
行い、`jq` は在れば使う程度に留めている。

deny のメッセージは、`jq` / `python3` が欠けていればその名前も併せて出す。**カナリアが
通っても、これらを使う他のフックは同じフェイルオープンで黙って素通りする**ため。

検出そのものは指示ベースだが、**失敗しても穴は開かない**。ゲートは git hooks と CI にあり、
カナリアはそれが効いているかを知るためだけのもの。指示ベースに置いてよいのは、
失敗してもガードが破れない検出系だけ。

## 例外(エスケープハッチ)

- `block-lint-suppress.sh` は以下を許可する:
  - `useExhaustiveDependencies` / `react-hooks/exhaustive-deps`(useEffect マウント時)
  - `noUnusedVariables` / `no-unused-vars`(ブランド型 `declare const ... unique symbol` の直前行のみ)
  - 対象ファイルに `// @lint-suppress-ok` を記載した場合(本当に必要なときのみ)
- テスト規約チェックの「条件分岐禁止」が見るのは **`test()` / `it()` のブロック内だけ**(`lib/test-conditionals.awk`)。セットアップやファクトリなどヘルパー関数内の分岐は対象外
  - `rules/testing.md` が禁じているのは「テストケースが入力によって形を変える」ことであって、セットアップの分岐ではないため
  - ファイル全体を見ていた頃は、テストが1件も分岐していないファイルでもヘルパーの1行で push が止まっていた。誤検知で止まるフックは、エスケープハッチを足す運用を招いて全体が信用されなくなる
- テスト規約チェック(`check-test-rules.sh` / `pre-push-test-rules.sh`)は以下で個別に無効化できる:
  - ファイル単位: `// @test-rules-disable [no-describe|no-conditional|file-naming|test-location ...]`(引数なしで全ルール無効化)
  - プロジェクト単位: 最寄りの `.test-rules.yml` に `<ルール名>: false` を記載
- テスト規約チェックの `test-location`(テストは対象モジュールの `__tests__/` 直下に置く)は、`分類: test-placement` が未介入のまま 5 回出たため #233 で足した
  - 判定は「親フォルダ名が `__tests__` か」だけ。`rules/testing.md`「配置と命名」のうち機械判定できるのはここまでで、「実装を `index.ts` に直接書く」「分割はサブフォルダで」は判定できない
  - 導入時点で `src/` の 321 件すべてが既に `__tests__/` 直下にあり、偽陽性 0 件で入れられた(絞る理由が無い)
- `check-test-helper-duplication.sh`(層 3・PostToolUse)は**ブロックしない**(`additionalContext` を返すだけ)。見るのは**編集したファイルが絡む重複だけ**だが、探す範囲はプロジェクト全体の `__tests__/`(同じフォルダに限らない)
  - 判定は「本体が一字一句同じ」に限る。似ているだけのものは見ない(偽陽性で止めない)
  - 導入時点でリポジトリに既存の重複が 13 組あり、#153 で一旦 0 組にした。**ただしそれは検出器が見える範囲での 0 組**で、フォルダをまたぐ重複(#179)は検出器自体が見ておらず数に入っていなかった。探索範囲をプロジェクト全体へ広げたところ、フォルダをまたぐ重複が新たに 11 組見つかっている(個別の解消は別 Issue)
  - `f(props: T = {})` のように**既定引数の `{}` が宣言中で最初に現れる関数**は、本体が `"{}"` と読まれて `MIN_BODY_CHARS`(20)未満で捨てられ、重複があっても見えない(#153 で足した `renderToolbar` がこの形にあたる。未解消)
  - 引数の型注釈が `Readonly<{ x: number }>` のように `{}` を含む場合に本体と読み違える偽陽性(#179)は、引数リストの閉じ括弧より後ろから本体を探すよう直して解消した(`duplicate-test-helpers.py` の `params_end`)
  - ファイル単位で無効化: `// @duplicate-helpers-ok`
- `.github/scripts/check-added-test-helper-duplication.sh`(層 1・CI、`frontend.yml` の `lint-suppress` ジョブ。同じスクリプトを `harness/githooks/pre-push` も引数なしで呼び、base を `origin/main` として push 前にも通す。**検出器を走らせられなければ exit 2** → `.github/scripts/lib/detector-precondition.sh`)は、Claude Code hook(層 3)が発火しない実行環境向けの無条件の代替。**既存の 11 組を理由に `--all` を無条件でブロックにはしない**(`check-added-lint-suppressions.sh` と同じ考え方)。`duplicate-test-helpers.py --lines` で対象ファイルの重複行を機械可読に出し、**このブランチで新しく追加された行に載っているものだけ**を違反にする。既存の 11 組を 0 組にすれば `--all` を無条件のブロックへ格上げできる(その時点でこの限定は不要になる)
  - `check-added-lint-suppressions.sh` と違い、**base に同じ本体を持つファイルがあっても除外しない**。ファイル分割でヘルパーが新しいファイルへ移ると、移った側は全行が追加行になり、既存の重複が「新規」として引っかかる余地が残っている(pr-240 で lint 抑制コメントが踏んだのと同じ形)。単純な `git mv` はリネーム検出で diff に載らないため踏まないが、**分割**は対象
- `check-doc-comments.sh` は**ブロックしない**(`additionalContext` を返すだけ)。また、見るのは**編集したファイルの分だけ**
  - 対象は `src/` の実装ファイルのみ(`__tests__/` / `*.stories.*` / `__stories__/` は見ない)
  - 見るのは**ファイル直下の宣言とコンパニオンオブジェクトの直下のメソッド**だけ(入れ子の関数・それより深いオブジェクトのメソッドは対象外)
  - メソッドと読むのは `const` で始まるオブジェクトの直下にあって、引数の括弧の後ろに本体(`{` か `=>`)が続くものだけ。判定の仕組みと意図した取りこぼし(入れ子のオブジェクトのメソッド)は検出器の docstring、判定表は `lib/missing-doc-comments-cases.sh`
  - **同じファイルに同名の宣言があってそちらに doc があれば対象外**。型とコンパニオンオブジェクトが doc を共有する形(`export type Size` の下に `export const Size = {`)を偽陽性にしないため
  - **エスケープハッチは置かない。** `src` での使用が導入以来 0 件で、`--all`(`rules-check`・`harness/githooks/pre-push`)が読まなかったため層によって効き方が割れていた(#756)
- `pre-push-doc-comments.sh` は **push をブロックする**。見るのは `src/` 全体
  - 導入時点では既存の抜けが 149 件あったため「このブランチで追加した行」だけに絞っていたが、#159 でその 149 件を埋めて 0 件にしたので絞る理由が無くなった(触っていない分で止まることがなく、「止まる理由が自分の変更ではない」状態にならない)
  - **doc の有無と項目(`@param` / `@returns` / `@throws`)の両方を見る**。導入時点では項目を満たさない doc が 190 件あったため `--missing-only` で有無だけに絞っていたが、#159 でその 190 件を埋めて 0 件にしたので絞る理由が無くなった
  - **コンパニオンオブジェクトのメソッドも見る**(`frontend.yml` の `rules-check` と `harness/githooks/pre-push` の `--all` も同じ)。導入時点ではメソッドの抜けが doc の無いもの 110 件・項目の欠けたもの 260 件あったため「このブランチで追加した行」だけを見る別の検査に分けていたが、#720 でそれを 0 件にしたので絞る理由が無くなった
  - エスケープハッチは置かない(PostToolUse 版と同じ)
  - 検出器は `--all src` で 1 回呼ぶ(`rules-check`・`harness/githooks/pre-push` と同じ)。ファイルごとに呼ぶ走査を別に持つと、片方にだけ除外が載って層ごとに判定が割れる
- `pre-push-typecheck.sh` / `pre-push-lint.sh` は node_modules 未インストール時(ツールが実行不能な場合)は黙ってスキップする
- `post-merge-review.sh` はマージを**ブロックしない**(`additionalContext` を返すだけ)。マージは人の判断で行われるので、記録が無いことを理由に止めても記録の質は上がらないため
  - 検知対象は `mcp__github__merge_pull_request` と `gh pr merge` のみ。素の `git merge` は見ない(ベースブランチの取り込みで日常的に走るため、拾うと誤発火のほうが多くなる)
- `.oxlintrc.json` の `overrides`(`rules/architecture.md`「依存方向のルール」の強制)は、`domains/` → `libs/` の辺だけ `warn`(**ブロックしない**)。導入時点で `@/libs/document-ipc`(型のみ)・`@/libs/document-json` への import が計 5 件既に存在しており(`document-save-state` は申し送りと決めた既知の債務、残り 3 件はテストの `DocumentJson` fixture 利用)、どちらもドメインの型・モジュール再配置を伴う判断(CLAUDE.md「設計判断の確認」)のため、この回では移動を行わない。`services/` → `features/` `libs/` `components/` `hooks/`・`components/` `hooks/` `utils/` `types/` → `domains/` `services/` `features/`・`libs/` → `services/` `features/` `components/` `hooks/` の 3 方向は既存違反 0 件だったため `error` でそのまま導入した
  - `features/<x>/domains/` への同種の適用は未実装
- `.oxlintrc.json` の `overrides`(`rules/architecture.md`「モジュールの公開API」の「複数ファイルへの分割が必要になったら」の閾値)は、`src/**/*.tsx` に `max-lines: 600` を `error` で置く。捕まえたいのは 1 ファイルに 11 コンポーネント・716 行が同居した形
  - **数えるのは空行とコメントを除いた行**(`skipBlankLines` / `skipComments` を `true` にしている。既定はどちらも false で、素の `wc -l` と同じ数え方になる)。この 2 つがあるため `__tests__/` を対象から外さずに導入時点の違反 0 件が成立している。生の行数では 620 行ある `use-editor-state.actions.test.tsx` が、空行 96 行を引いて閾値の内側に収まる
  - **対象は `src/` の `.tsx` すべて**で、`__tests__/` も `.stories.tsx` も `__stories__/` の共有の器も入る(実測: 実行行 601 行のファイルは `__tests__/` 配下でも発火する)。`.ts` は対象外で、`design-document/index.ts` が 1449 行、`editor-state/index.ts` が 1273 行あり違反 0 件では入れられない
  - **`.ts` が対象外なので、中身を兄弟の `.ts` へ逃がす経路は開いたまま。** 止めているのは `rules/architecture.md`「実装は `index.ts` に直接書く」という観点だけで、`import-rule-violations.py` が見るのは「外から非 index ファイルを読む」形なので、`index.tsx` からだけ読む兄弟 `.ts` は検出しない(probe を置いて実測。該当する兄弟実装ファイルは現状 0 件)
  - エスケープハッチは他の oxlint ルールと共通で、ファイルに `// @lint-suppress-ok` を書くと `block-lint-suppress.sh` / `check-added-lint-suppressions.sh` の抑制コメント禁止が**そのファイル全体で**外れる。分割の判断を迂回する使い方はしない
  - **導入時点では、上の一文は事実ではなかった。** `lib/lint-suppressions.py` の検出は `biome-ignore` / `eslint-disable` の 2 綴りしか見ておらず、oxlint が同じく読む `oxlint-disable` の綴りは素通りしていた(実測: `// oxlint-disable eslint/max-lines` の 1 行で、`@lint-suppress-ok` 無しにこのルールを無効化できた)。検出側へ `oxlint-disable` を足して塞いである。既存の抑制は `biome-ignore` の 3 件だけなので、追加による新しい違反は 0 件
- **feature 間の deep import・循環参照・モジュール内部への deep import**(#257 のゴール 1・2・6)は `lib/import-rule-violations.py` が見る。oxlint に置かなかったのは、3 つとも**リポジトリの構造を読まないと判定できない**ため(「自分の feature を除く」は呼び出し元のパスに依存し、循環はグラフ、deep import は「そのフォルダが `index.ts` を持つか」を要する)。`overrides.files` の静的な glob では書けない(#284 の実測では同一 feature 内のドメイン間 import まで巻き込んで 38 件の偽陽性。数値の出どころは #257 のコメント)
  - **判定の根拠はスクリプトの docstring に書いてある**(入れ子モジュールの扱い・`__tests__/` の扱い・feature だけ狭い理由)。ここに写すと片方だけ古くなるので繰り返さない
  - **ゴール 6 の実効範囲は現状ほぼ fixture 専用。** 入れ子モジュールの index を許すため、`module-public-api` に当たるのは「モジュールフォルダ配下の非 index ファイルを外から読む」形だけで、実測するとテスト・ストーリーを除いた該当ファイルは 4 件しか無い(このリポジトリが「実装は `index.ts` に直接書く」を守っているため)。**将来の退行を止める枠であって、いま何かを剥がす検査ではない**
  - **エスケープハッチは置かない。** 他の push ブロック系(`@test-rules-disable` / `@lint-suppress-ok`)と違い、この検査は「その import を書いてよいか」の判定で、**ファイル単位で例外にできる性質のものではない**(例外にした瞬間そのファイルからは何でも読める)。偽陽性を避ける側で手当てしてある — コメント行は数えない・入れ子の index は通す
  - 導入時点の既存違反は 8 件(feature をまたぐ fixture の直接 import)で、テスト用の公開口を置いて 0 件にしてから `error` 相当(exit 1)で入れた
- **判別子の直読み**(`lib/result-option-read-violations.py`。#523)は **push をブロックする**。見るのは `src/` 全体で、`rules/coding.md`「エラーと不在の表現」の「判定は `Option.isSome` / `Result.isOk` を通す」に対応する
  - **エスケープハッチは置かない。** この検査は**ファイル単位の免除を規則として持っている**(その判別子を型宣言で定義しているファイルの中は許す)ので、逃げ道は既に規則の側にある。導入時点の違反 0 件・偽陽性 0 件で、呼び出しの無い逃げ道を先回りで足さない
  - 導入時点の違反は 0 件。読み側の移行は #423 / #502 / #504 / #509 で終わっており、`src/` に残る直読みは `src/utils/Result.ts` / `src/utils/Option.ts` / `src/libs/json-lexical-scanner/index.ts`(`ok` を判別子にした別の直和を 2 つ持つ)の中だけ
  - **構築側・比較側のリテラル**(`toEqual({ ok: false, error: e })`)は対象外。読み側だけで 0 件になるので無条件のブロックで入れられる(→ #524)
  - **外の語彙が同じ綴りを持つ形**(Fetch API の `response.ok` など)は、いま `src/` に無いのでそのまま違反になる。出てきたら `libs/` の境界で詰め替えるか、検出器の表を見直す
  - 判定の仕組み(型宣言の領域の見分け方・意図した取りこぼし)はスクリプトの docstring が持つ。判定表は `lib/result-option-read-cases.sh`
  - oxlint にも Biome にも置けなかった(理由は `frontend.yml` の `rules-check` にある「判別子の直読み」ステップのコメント)
- **story の title**(`lib/story-title-violations.py`)は **push をブロックする**。見るのは `src/` 全体。**対応する規範は `rules/` に無い**(機械で判定できるのでフックだけが持つ → `AGENTS.md`「規約の更新」の「ルールに書くくらいならフックにする」)
  - **エスケープハッチは置かない。** 免除は既に規則の側にある(葉 = ツリーに出る表示名は見ない)ので、`title` の綴りが実装の都合で必要になる余地はそこで吸収される。導入時点の違反 0 件・偽陽性 0 件で、呼び出しの無い逃げ道を先回りで足さない
  - 導入時点の違反は 0 件・49 本。綴りを揃えたのは PR #679 で、この検査はその状態が剥がれないようにするもの
  - **`title` は story の id でもある。** この検査に合わせてフォルダを動かすと、VRT のベースラインと `iframe.html?id=` の参照が**全部**変わる(同じ形の実例は `harness/case-law/process.md`)。揃えるための移動は、その入れ替わりを織り込んで計画する
  - 判定の仕組み(導出の 3 手・葉を見ない意図した取りこぼし)はスクリプトの docstring が持つ。判定表は `lib/story-title-cases.sh`
- **名指ししたパス**(`lib/named-path-violations.py`)は **push をブロックする**。見るのはリポジトリ全体の `.ts` / `.tsx`(コメントの中だけ)と `.md`(全文)。**対応する規範は `rules/` に無い**(story の title と同じ扱い)
  - **エスケープハッチは置かない。** 免除は既に規則の側にある(拡張子の無い PascalCase の名前・`-` で終わる切れたプレースホルダ・相対の綴り・走査しないフォルダ・このファイルのフェンスの中の probe)。導入時点の違反 0 件・偽陽性 0 件で、呼び出しの無い逃げ道を先回りで足さない
  - 導入時点の違反は **15 件**(`src/` の 6 件と `harness/case-law/` の 9 件)で、同じ PR で 0 件にしてから入れた。#690 のマージ前の木へ当てると、#690 が直した **14 箇所を 14/14** 報告する(`harness-growth`「採用前の再生」)
  - **`.claude/hooks/README.md`(このファイル)も走査する。免除するのはフェンスの中の probe だけ**(下の動作確認のレシピは、これから作るファイルを意図して名指しする)。probe と見る条件とファイルを丸ごと外さない理由は検出器の docstring が持つ
  - **このファイルにレシピを書くときは、probe を docstring の条件に合わせる。** 合わない綴り(`canvas/features/deep` のような作るフォルダの途中・実在しない綴りの見本)は違反として報告される。層を並べるときは `/` で繋がず、1 語ずつコードにする(`components/` `hooks/`)
  - **`harness/records/` も走査しない**(`harness/records/README.md`「過去の記録は書き換えない」。この検出器を当てると 206 件出るが、どれも当時の綴りとして正しい)。`harness/case-law/` は走査する — あちらが禁じているのは**判断**の書き換えで、実体を指さなくなった綴りは直す側(判例自身が `pr-330`「判例が古いパスを指したまま残る」で指摘を受けている)
  - **走査対象は git が追跡しているファイル**。フォルダを歩くと `.gitignore` 済みの生成物(`storybook-static/` 等)まで対象になり、手元に成果物が残っている環境だけで push が止まる。コミット前の新しいファイルは見えないが、push の時点では差分がコミットされているのでゲートに穴は開かない
  - 判定の仕組み(解決の 2 手・意図した取りこぼし 7 つ)はスクリプトの docstring が持つ。判定表は `lib/named-path-cases.sh`

## 動作確認

```bash
# 拒否されること(deny が出力される)
echo '{"tool_input":{"command":"npx create-vite"}}' | bash .claude/hooks/block-npx.sh

# 許可されること(出力なし・exit 0)
echo '{"tool_input":{"command":"pnpm run lint"}}' | bash .claude/hooks/block-npx.sh
```

```bash
# 重複が報告されること(additionalContext が出力される)
echo '{"tool_input":{"file_path":"src/features/editor/features/inspector/components/property-panel/__tests__/property-panel.heading.test.tsx"}}' \
  | bash .claude/hooks/check-test-helper-duplication.sh

# 全体の重複を数える
python3 .claude/hooks/lib/duplicate-test-helpers.py --all src
```

```bash
# doc の無い宣言が報告されること(additionalContext が出力される)
echo '{"tool_input":{"file_path":"src/domains/dcmp/token/index.ts"}}' \
  | bash .claude/hooks/check-doc-comments.sh

# 全体の doc 抜けを数える(コンパニオンオブジェクトのメソッドを含む)
python3 .claude/hooks/lib/missing-doc-comments.py --all src

# doc コメントの判定表(`ok` だけなら期待どおり・`NG` が出たら判定が変わっている)。pre-push と CI も走らせる
bash .claude/hooks/lib/missing-doc-comments-cases.sh; echo "exit=$?"

# push がブロックされること(deny が出力される。doc 無しの宣言があるとき)
echo '{"tool_input":{"command":"git push"}}' \
  | bash .claude/hooks/pre-push-doc-comments.sh
```

```bash
# 検証エージェント実行中は git add が拒否されること
export TMPDIR=/tmp
echo '{"hook_event_name":"PreToolUse","session_id":"probe","tool_name":"Task","tool_input":{"subagent_type":"implementation-reviewer"}}' \
  | bash .claude/hooks/track-verification-agent-activity.sh
echo '{"session_id":"probe","tool_input":{"command":"git add -A"}}' \
  | bash .claude/hooks/block-git-during-verification-agent.sh

# 終了すれば通ること(出力なし・exit 0)
echo '{"hook_event_name":"PostToolUse","session_id":"probe","tool_name":"Task","tool_input":{"subagent_type":"implementation-reviewer"}}' \
  | bash .claude/hooks/track-verification-agent-activity.sh
echo '{"session_id":"probe","tool_input":{"command":"git add -A"}}' \
  | bash .claude/hooks/block-git-during-verification-agent.sh; echo "exit=$?"
rm -rf "${TMPDIR}/design-composer-verification-agents-probe"
```

```bash
# カナリアの判定表(`ok` だけなら期待どおり・`NG` が出たら判定が変わっている)。pre-push と CI も走らせる
bash .claude/hooks/lib/canary-cases.sh; echo "exit=$?"

# テスト規約の全体検査(git hooks と共有。違反があれば exit 1)
bash .claude/hooks/lib/test-rules-scan.sh src

# この PR で追加された lint 抑制コメントを数える(CI と同じ判定)
bash .github/scripts/check-added-lint-suppressions.sh origin/main

# この PR で追加されたテストヘルパーの重複を数える(CI と同じ判定)
bash .github/scripts/check-added-test-helper-duplication.sh origin/main

# 上の 2 つの判定表(`ok` だけなら期待どおり)。exit 2 = 検査できなかった、も覆う
bash .github/scripts/check-added-cases.sh; echo "exit=$?"

# PR が閉じる Issue の検査の判定表(`ok` だけなら期待どおり)。CI だけが走らせるので、
# check-pr-closing-issue.sh を触ったときはここで走らせる(1 分かかる)
bash .github/scripts/check-pr-closing-issue-cases.sh; echo "exit=$?"

# 同じ Issue を閉じる他の PR の検査の判定表(`ok` だけなら期待どおり)
bash .github/scripts/check-duplicate-issue-pr-cases.sh; echo "exit=$?"

# 記録の集計の判定表(見ている観点は count-cases.sh 冒頭)。pre-push と CI も走らせる
bash harness/records/count-cases.sh; echo "exit=$?"
```

```bash
# 発火ログが書き出されること(見出し + skill + agent の 3 行)
echo '{"hook_event_name":"SessionStart","session_id":"probe"}' | bash .claude/hooks/record-firings.sh
echo '{"session_id":"probe","tool_name":"Skill","tool_input":{"skill":"implementation-flow"}}' | bash .claude/hooks/record-firings.sh
echo '{"session_id":"probe","tool_name":"Task","tool_input":{"subagent_type":"plan-reviewer"}}' | bash .claude/hooks/record-firings.sh
cat "${TMPDIR:-/tmp}/design-composer-firings-probe.log"
rm "${TMPDIR:-/tmp}/design-composer-firings-probe.log"

# 対象外のツールでは書かれないこと(出力なし・exit 0・ファイルも増えない)
echo '{"session_id":"probe","tool_name":"Bash","tool_input":{"command":"ls"}}' | bash .claude/hooks/record-firings.sh; echo "exit=$?"
```

**終了コードまで見る。** 層 1(CI の `run:`)と層 2(`pre-push` の `run_check`)は**終了コードだけが配線**なので、
標準出力の文字列しか確かめないと「無条件に落ちる」というゴールの本体が守られない。
`; echo "exit=$?"` を必ず付ける。

**カナリアだけは例外で、判定は標準出力に出る。** PreToolUse の deny は JSON を返して
`exit 0` で終わるので、終了コードでは deny と pass が区別できない。`canary-cases.sh` が
見ているのも出力の有無で、そちらの終了コードは「ケース表と食い違ったか」を表す。

**カナリアのケースはコマンドへ直接書かずファイルに置く。** `cd /tmp && echo hook-canary` の
ような行は本物の呼び出しとして切り出されるので、表を書いたコマンド自体が deny される(実測)。

**probe は `.tsx` でも置く。** 解消した既存違反 8 件はすべて `.test.tsx` / `.stories.tsx` で、
`src` には `index.tsx` を持つモジュールが 40 個ある。`.ts` だけで確かめると、
拡張子の取りこぼし(`SOURCE_SUFFIXES` / `INDEX_NAMES` から `.tsx` が落ちる形)を素通りさせる。

```bash
# import 規約の全体検査(git hooks・CI と共有)
python3 .claude/hooks/lib/import-rule-violations.py src; echo "exit=$?"   # → 違反 0 件・exit=0

# 他 feature の内部を読むと落ちること(feature-public-api。importer が .tsx)
printf 'import { CanvasView } from "@/features/editor/features/canvas/domains/canvas-view";\nexport const Probe = () => <p>{String(CanvasView)}</p>;\n' \
  > src/features/editor/probe.tsx
python3 .claude/hooks/lib/import-rule-violations.py src; echo "exit=$?"   # → [feature-public-api] 1 件・exit=1
rm src/features/editor/probe.tsx

# feature の外(app 層)からでも落ちること — 呼び出し元ではなく行き先で決めている根拠
printf 'export { EditorScreen } from "@/features/editor/components/editor-screen";\n' > src/app/probe.ts
python3 .claude/hooks/lib/import-rule-violations.py src; echo "exit=$?"   # → [feature-public-api] 1 件・exit=1
rm src/app/probe.ts

# 入れ子モジュールの index は通ること(`libs/<x>/fake` を例外リスト無しで通す根拠)
printf 'import { FakeDocumentIpc } from "@/libs/document-ipc/fake";\nexport const Probe = FakeDocumentIpc;\n' \
  > src/features/editor/probe.ts
python3 .claude/hooks/lib/import-rule-violations.py src; echo "exit=$?"   # → 違反 0 件・exit=0
rm src/features/editor/probe.ts

# モジュールの内部(index 以外)を外から読むと落ちること(module-public-api。index.tsx を持つモジュール)
printf 'export const InternalProbe = 1;\n' > src/components/type-glyph/internal-probe.ts
printf 'export { InternalProbe } from "@/components/type-glyph/internal-probe";\n' > src/components/probe.ts
python3 .claude/hooks/lib/import-rule-violations.py src; echo "exit=$?"   # → [module-public-api] 1 件・exit=1
rm src/components/type-glyph/internal-probe.ts src/components/probe.ts

# 3 ファイルの閉路が拾えること(import-cycle。相互参照だけを見る実装では通らない)
printf 'import "./probe-b";\nexport const A = 1;\n' > src/utils/probe-a.ts
printf 'import "./probe-c";\nexport const B = 1;\n' > src/utils/probe-b.ts
printf 'import "./probe-a";\nexport const C = 1;\n' > src/utils/probe-c.ts
python3 .claude/hooks/lib/import-rule-violations.py src; echo "exit=$?"   # → [import-cycle] 1 件・exit=1
rm src/utils/probe-a.ts src/utils/probe-b.ts src/utils/probe-c.ts

# 子 feature 同士が読み合うと落ちること(feature-sibling。公開口を通っていても通さない)
printf 'export { TokenList } from "@/features/editor/features/tokens";\n' > src/features/editor/features/sidebar/probe.ts
python3 .claude/hooks/lib/import-rule-violations.py src; echo "exit=$?"   # → [feature-sibling] 1 件・exit=1
rm src/features/editor/features/sidebar/probe.ts

# 子が親を読むと落ちること(feature-ancestor)
# 親がその子を読んでいる間は feature-cycle も一緒に出るが、**親が import をやめると
# cycle は消える**。子から祖先への向きを押さえているのは feature-ancestor のほう。
printf 'export { EditorScreen } from "@/features/editor";\n' > src/features/editor/features/canvas/probe.ts
python3 .claude/hooks/lib/import-rule-violations.py src; echo "exit=$?"   # → [feature-ancestor] 1 件 + [feature-cycle] 1 件・exit=1
rm src/features/editor/features/canvas/probe.ts

# 親から直下の子は通ること(繋ぐのは親、の向き)
printf 'export { TokenList } from "@/features/editor/features/tokens";\n' > src/features/editor/probe.ts
python3 .claude/hooks/lib/import-rule-violations.py src; echo "exit=$?"   # → 違反 0 件・exit=0
rm src/features/editor/probe.ts

# 入れ子が 3 段目になると落ちること(feature-nest-depth。import が 1 つも無くても出る)
mkdir -p src/features/probe/features/a/features/b
printf 'export const Probe = 1;\n' > src/features/probe/features/a/features/b/index.ts
python3 .claude/hooks/lib/import-rule-violations.py src; echo "exit=$?"   # → [feature-nest-depth] 1 件・exit=1
rm -rf src/features/probe

# コメントに書いた import のパスで止まらないこと(doc に綴りを書く箇所があるため)
printf '// かつては import { CanvasView } from "@/features/editor/features/canvas/domains/canvas-view"; と書いていた\nexport const Probe = 1;\n' \
  > src/features/editor/probe.ts
python3 .claude/hooks/lib/import-rule-violations.py src; echo "exit=$?"   # → 違反 0 件・exit=0
rm src/features/editor/probe.ts

# push がブロックされること(deny が出力される。違反があるとき)
printf 'export { EditorScreen } from "@/features/editor/components/editor-screen";\n' > src/app/probe.ts
echo '{"tool_input":{"command":"git push"}}' \
  | bash .claude/hooks/pre-push-import-rules.sh
rm src/app/probe.ts

# 通ること(違反 0 のとき。出力なし・exit 0)
echo '{"tool_input":{"command":"git push"}}' \
  | bash .claude/hooks/pre-push-import-rules.sh; echo "exit=$?"
```

```bash
# 判別子の直読みの判定表(`ok` だけなら期待どおり・`NG` が出たら判定が変わっている)。pre-push と CI も走らせる
bash .claude/hooks/lib/result-option-read-cases.sh; echo "exit=$?"

# 判別子の直読みの全体検査(git hooks・CI と共有)
python3 .claude/hooks/lib/result-option-read-violations.py src; echo "exit=$?"   # → 違反 0 件・exit=0

# 定義元の外で直読みすると落ちること(probe が .tsx でも拾えること)。
# **probe は doc 付き・整形済みで、モジュールフォルダの外に置く。** 層 2 は typecheck /
# oxlint / biome / doc コメント / import 規約も同じ回に走らせるので、素の 1 行を置くとそれらも
# 落ち、exit 1 がこの検査から来たのかを「失敗した検査」の行で切り分けることになる
printf '/**\n * 判別子の直読み検査の probe。\n *\n * @param result 成否を持つ値\n * @returns 成否に応じた表示\n */\nexport const Probe = (result: { ok: boolean }) =>\n  result.ok ? <p>y</p> : <p>n</p>;\n' \
  > src/features/editor/probe.tsx
python3 .claude/hooks/lib/result-option-read-violations.py src; echo "exit=$?"   # → [result-option-read] 1 件・exit=1

# 層 2(git hooks)が止めること。最後まで走ったあと結果の行が失敗を言う
bash harness/githooks/pre-push; echo "exit=$?"                                   # → 「失敗した検査: 判別子の直読み」・exit=1

# 層 3(Claude Code の PreToolUse)が deny を返すこと
echo '{"tool_input":{"command":"git push"}}' \
  | bash .claude/hooks/pre-push-result-option-reads.sh
rm src/features/editor/probe.tsx

# 通ること(違反 0 のとき。出力なし・exit 0)
echo '{"tool_input":{"command":"git push"}}' \
  | bash .claude/hooks/pre-push-result-option-reads.sh; echo "exit=$?"
```

```bash
# story の title の判定表(`ok` だけなら期待どおり)。pre-push と CI も走らせる
bash .claude/hooks/lib/story-title-cases.sh; echo "exit=$?"

# story の title の全体検査(git hooks・CI と共有)
python3 .claude/hooks/lib/story-title-violations.py src; echo "exit=$?"   # → 違反 0 件・exit=0

# 親を飛ばした title が落ちること(story-title-tree)。**probe の置き場所が期待出力を決める**
# ので、パスと title は対で書く。導出は `features/editor/features/canvas/<表示名>`。
# doc コメントは要らない(missing-doc-comments.py が `*.stories.*` を対象外にしている)
mkdir -p src/features/editor/features/canvas/components/probe
printf 'export default {\n  title: "features/canvas/Probe",\n};\n' \
  > src/features/editor/features/canvas/components/probe/index.stories.tsx
python3 .claude/hooks/lib/story-title-violations.py src; echo "exit=$?"   # → [story-title-tree] 1 件・exit=1

# 層 3(Claude Code の PreToolUse)が deny を返すこと
echo '{"tool_input":{"command":"git push"}}' \
  | bash .claude/hooks/pre-push-story-titles.sh

# 導出どおりなら通ること(同じ置き場所で title だけを変える)
printf 'export default {\n  title: "features/editor/features/canvas/Probe",\n};\n' \
  > src/features/editor/features/canvas/components/probe/index.stories.tsx
python3 .claude/hooks/lib/story-title-violations.py src; echo "exit=$?"   # → 違反 0 件・exit=0

# title を書かないと落ちること(story-title-missing。検査できないものを通さない根拠)
printf 'export default {};\n' > src/features/editor/features/canvas/components/probe/index.stories.tsx
python3 .claude/hooks/lib/story-title-violations.py src; echo "exit=$?"   # → [story-title-missing] 1 件・exit=1
rm -rf src/features/editor/features/canvas/components/probe
```

```bash
# 名指ししたパスの全体検査(git hooks・CI と共有。走査ルートはリポジトリルート)
python3 .claude/hooks/lib/named-path-violations.py; echo "exit=$?"   # → 違反 0 件・exit=0

# 走査対象は git が追跡しているファイル。probe は `git add -N` で索引へ入れる
# (入れずに置くと、綴りが実在しなくても報告されない)。
printf '// 参照: features/probe-sidebar\nexport const Probe = 1;\n' > src/app/probe.ts
python3 .claude/hooks/lib/named-path-violations.py; echo "exit=$?"   # → 違反 0 件・exit=0
git add -N src/app/probe.ts
python3 .claude/hooks/lib/named-path-violations.py; echo "exit=$?"   # → [named-path-missing] 1 件・exit=1

# 実体のある綴りなら通ること(同じファイルで綴りだけを変える)
printf '// 参照: features/editor/features/sidebar\nexport const Probe = 1;\n' > src/app/probe.ts
python3 .claude/hooks/lib/named-path-violations.py; echo "exit=$?"   # → 違反 0 件・exit=0

# Markdown の全文も見ること(コメントの外側に綴りを置ける唯一の形)
printf '参照: features/probe-sidebar\n' > docs/probe.md
git add -N docs/probe.md
python3 .claude/hooks/lib/named-path-violations.py; echo "exit=$?"   # → [named-path-missing] 1 件・exit=1
git rm -q --cached docs/probe.md; rm docs/probe.md

# push がブロックされること(deny が出力される。違反があるとき)
printf '// 参照: features/probe-sidebar\nexport const Probe = 1;\n' > src/app/probe.ts
echo '{"tool_input":{"command":"git push"}}' \
  | bash .claude/hooks/pre-push-named-paths.sh
git rm -q --cached src/app/probe.ts; rm src/app/probe.ts

# 通ること(違反 0 のとき。出力なし・exit 0)
echo '{"tool_input":{"command":"git push"}}' \
  | bash .claude/hooks/pre-push-named-paths.sh; echo "exit=$?"
```

```bash
# 振り返りが提示されること(additionalContext が出力される)
echo '{"tool_name":"mcp__github__merge_pull_request","tool_input":{"pullNumber":115},"tool_response":{}}' \
  | bash .claude/hooks/post-merge-review.sh

# 提示されないこと(出力なし・exit 0)
echo '{"tool_name":"Bash","tool_input":{"command":"git merge origin/main"},"tool_response":{}}' \
  | bash .claude/hooks/post-merge-review.sh
```

## 関連するスキル

| スキル                                | 内容                                                                   |
| ------------------------------------- | ---------------------------------------------------------------------- |
| `.claude/skills/implementation-flow/` | 実装の手順(計画・サブエージェントによる検証・Issue への記録・マージ後の追記) |
| `.claude/skills/harness-record/`      | マージ後の評価記録(`harness/records/` へ 1 ファイル)            |
| `.claude/skills/harness-growth/`      | 記録の集計と、規約 / フックの改善                               |

`post-merge-review.sh` はこの2つのスキルへの入口として働く。
