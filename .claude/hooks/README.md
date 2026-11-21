# .claude/hooks — 実装規約の強制フック

Claude Code で `rules/` 配下の実装規約を**強制**するためのフックスクリプト置き場。[d-market-typescript の typescript-rules-plugin](https://github.com/DIO0550/d-market) の hooks から、このリポジトリの規約に合致するものを移植・適応した。

## 強制している規約

| スクリプト | イベント | 内容 |
| --- | --- | --- |
| `block-npx.sh` | `PreToolUse`（Bash） | **npx / pnpm dlx 禁止**。パッケージは `pnpm add` でインストールしてから使用する |
| `block-lint-suppress.sh` | `PreToolUse`（Edit/Write） | **lint 抑制コメント禁止**。`biome-ignore` / `eslint-disable` / `oxlint-disable` の追加を拒否する。検出器が異常終了した場合は止めずに「検査できていません」を伝える |
| `post-edit-lint.sh` | `PostToolUse`（Edit/Write） | **編集後の自動リント**。oxlint / Biome を `--fix` 付きで実行し、残った診断をフィードバックする |
| `check-test-rules.sh` | `PostToolUse`（Edit/Write） | **テスト規約検証**（`rules/testing.md`）。`describe` 禁止・テストケース内の条件分岐禁止・命名規則・置き場所（`__tests__/` 直下）をチェックする |
| `pre-push-typecheck.sh` | `PreToolUse`（Bash） | **push 前の型チェック**。`pnpm run typecheck`（`tsc -b`）でエラーがあれば push をブロックする |
| `pre-push-lint.sh` | `PreToolUse`（Bash） | **push 前の全体 lint**。oxlint / Biome のエラーがあれば push をブロックする |
| `pre-push-test-rules.sh` | `PreToolUse`（Bash） | **push 前の全体テスト規約検査**。全 `*.test.ts(x)` を検査し、違反があれば push をブロックする |
| `check-test-helper-duplication.sh` | `PostToolUse`（Edit/Write） | **テストヘルパーの重複検出**（`rules/testing.md`「テスト用ヘルパーの置き場所」）。プロジェクト全体の `__tests__/` を横断し、本体が一字一句同じヘルパーが 2 つ以上あれば通知する。検出器が異常終了した場合は止めずに「検査できていません」を伝える |
| `check-doc-comments.sh` | `PostToolUse`（Edit/Write） | **doc コメントの検証**（`rules/coding.md`「コメントは doc と Why / Why not に絞る」）。doc のない宣言と、`@param` / `@returns` / `@throws` が欠けた doc を通知する。検出器が異常終了した場合は止めずに「検査できていません」を伝える |
| `pre-push-doc-comments.sh` | `PreToolUse`（Bash） | **push 前の doc コメント検査**。`src/` に doc のない宣言、または `@param` / `@returns` / `@throws` の欠けた doc があれば push をブロックする |
| `pre-push-import-rules.sh` | `PreToolUse`（Bash） | **push 前の import 規約検査**（`rules/architecture.md`「モジュールの公開API」「依存方向のルール」）。import 規約の違反（種別は `lib/import-rule-violations.py` の docstring）があれば push をブロックする |
| `pre-push-story-titles.sh` | `PreToolUse`（Bash） | **push 前の story の title 検査**（対応する規範は `rules/` になく、フックだけが持つ）。story の `title` の違反（種別は `lib/story-title-violations.py` の docstring）があれば push をブロックする |
| `pre-push-named-paths.sh` | `PreToolUse`（Bash） | **push 前の名指ししたパスの検査**（対応する規範は `rules/` になく、フックだけが持つ）。コメント・doc が名指ししたパスの違反（種別は `lib/named-path-violations.py` の docstring）があれば push をブロックする |
| `pre-push-test-helper-duplication.sh` | `PreToolUse`（Bash） | **push 前のテストヘルパーの重複検査**（`rules/testing.md`「テスト用ヘルパーの置き場所」）。`src/` の `__tests__/` を横断し、本体が一字一句同じヘルパーが 2 つ以上あれば push をブロックする |
| `post-merge-review.sh` | `PostToolUse`（Bash/MCP） | **マージ後の振り返りの提示**。PR のマージを検知し、Issue への追記・続きの Issue・評価の記録を促す |
| `hook-canary.sh` | `PreToolUse`（Bash） | **カナリア**。`echo hook-canary` を必ず deny する（連ねたコマンドの中にあっても切り出して判定する）。通ってしまったときの読み方は後述（**通った = 不発、ではない**） |
| `session-url-notice.sh` | `SessionStart` | **セッション URL の提示**（`AGENTS.md`「Issue に紐づいて起動したら、セッションの URL を Issue に残す」）。URL を組み立てて渡し、ブランチが `claude/issue-<N>-...` なら対象番号も添える。コメント前に他セッションの URL コメントや自分以外の assignee がないか確認するよう促す（`parallel-issue-work`） |
| `record-firings.sh` | `SessionStart` + `PostToolUse`（Skill/Task/Agent） | **スキル・サブエージェントの発火ログ**。tmp のセッション別ログへ追記し、`harness-record` の記録作成と `block-parent-session-edit.sh` の flow 判定に使う。SessionStart の見出し行で「起動しなかった」と「フック不発」を切り分ける |
| `track-verification-agent-activity.sh` | `PreToolUse` + `PostToolUse`（Task/Agent） | **作業ツリーを書き換えるサブエージェントの実行中フラグ**。`plan-reviewer` / `test-reviewer` / `implementer` の開始・終了をセッション別・種類別のマーカーで数え、`block-git-during-verification-agent.sh` が読む。この 3 つの起動のうち **`run_in_background: true` を明示したものは拒否する**（塞いでいない形はフック冒頭を参照） |
| `block-git-during-verification-agent.sh` | `PreToolUse`（Bash） | **作業ツリーを書き換えるサブエージェント実行中の git 操作を拒否**。マーカーがある間は `git add` / `commit` / `push` を deny し、ミューテーション実測や実装途中の書き換えがコミットへ混入する事故を防ぐ。古いマーカーは無視する（種類ごとの有効期間と理由はフック本文。拒否文にマーカーのディレクトリを出す） |
| `block-parent-session-edit.sh` | `PreToolUse`（Edit/Write） | **`implementation-flow` 中の親セッションによる編集を拒否**（`implementation-flow`「役割の分担」）。入力に `agent_id` がない（親の）Edit / Write で、リポジトリ内のファイルを指し、発火ログの最後の区切りが flow 内なら deny する（区切りになる起動と通す入力はフック冒頭を参照） |
| `block-issue-without-flow-kind.sh` | `PreToolUse`（Bash/MCP） | **作業の種類を決めていない Issue 作成を拒否**（`implementation-flow` フェーズ 1「種類の確定」の手順 4）。作成とみなす形・通す条件・行の書式は `lib/issue-flow-kind-violations.py` の docstring と定数を参照。python3 が使えなければ通し、検出器が異常終了したら deny する |

## 移植元から見送ったもの

- `require-skill-before-edit.sh` — typescript-rules-plugin 固有のスキルに依存するスキルゲートのため

### 見送りを取り消したもの

- `check-jsdoc-rules.sh` / `pre-push-jsdoc.sh` — 「JSDoc 必須ルールはこのリポジトリの規約に存在しない」という理由で見送っていたが、**その前提は PR #152 で `rules/coding.md`「コメントは doc と Why / Why not に絞る」が入った時点で消えていた**。判断が更新されないまま残り、PR #157 で doc のない関数がレビューまで残った（#157 のレビュー / `harness/records/pr-157.md`）。移植元をそのまま戻すのではなく、このリポジトリの形（型とコンパニオンオブジェクトが doc を共有する）に合わせた `check-doc-comments.sh` を書いた
- `record-skill-fired.sh` — 「plugin 固有のスキルに依存する」という理由で見送っていたが、その理由は**特定スキルへのゲート**にしか当てはまらず、発火の記録自体は汎用だった。`harness-record` の材料のうち発火だけが記憶（自己申告）頼みになっていたため、汎用版を `record-firings.sh` として書いた
- **規約が増えたら、それを理由に見送ったフックを見直す。** 見送りの理由は「今の規約にないから」であることが多く、規約が変わると理由ごと消える

## 配線

[`.claude/settings.json`](../settings.json) の `hooks.PreToolUse` / `hooks.PostToolUse` から参照する。パスは `${CLAUDE_PROJECT_DIR:-.}` 基準。

`lib/` はフック本体から読む共有部品と、フックの判定を固定する判定表（`*-cases.sh`）の置き場であり、`settings.json` からは参照しない。

| ファイル | 使う側 | 内容 |
| --- | --- | --- |
| `lib/test-conditionals.awk` | `check-test-rules.sh` / `pre-push-test-rules.sh` | `test()` / `it()` ブロック内の `if` / `else` / `switch` を行番号付きで出力する |
| `lib/duplicate-test-helpers.py` | `check-test-helper-duplication.sh` / `pre-push-test-helper-duplication.sh` / `harness/githooks/pre-push` / `frontend.yml` の `rules-check` / `.github/scripts/check-added-test-helper-duplication.sh`（CI と `pre-push`） | プロジェクト全体の `__tests__/` を横断して本体が完全一致するヘルパーを探す。`--all` で全体、`--lines` で 1 ファイルの重複行を `<行番号>:<名前>` 形式で出力し、`--base-root` を足すと base より本体の数が増えた重複だけを出す |
| `lib/missing-doc-comments.py` | `check-doc-comments.sh` / `pre-push-doc-comments.sh` / `harness/githooks/pre-push` / `frontend.yml` の `rules-check` | `src/` のファイル直下の宣言とコンパニオンオブジェクト直下のメソッドのうち、doc コメントのないもの・項目の欠けたものを探す。`--all` で全体を見る |
| `lib/test-rules-scan.sh` | `pre-push-test-rules.sh` / `harness/githooks/pre-push` | 指定ルート配下の `*.test.ts(x)` をすべて検査する。違反があれば exit 1 |
| `lib/lint-suppressions.py` | `block-lint-suppress.sh` / `.github/scripts/check-added-lint-suppressions.sh`（CI と `pre-push`） | 許可されていない lint 抑制コメントの行を報告する。例外判定もここで持つ |
| `lib/import-rule-violations.py` | `pre-push-import-rules.sh` / `harness/githooks/pre-push` / `frontend.yml` の `rules-check` | import 規約の違反を報告する。種別の一覧と意味は検出器の docstring を参照 |
| `lib/ts_sources.py` | `lib/import-rule-violations.py` / `lib/story-title-violations.py` / `lib/named-path-violations.py`（報告の形のみ） | `src/` の走査対象の集め方・報告形式・CLI 引数受け取り・feature 階層の辿り方（`feature_of()`）。Python の import 名にするため、このファイルだけアンダースコア区切り |
| `lib/named-path-violations.py` | `pre-push-named-paths.sh` / `harness/githooks/pre-push` / `frontend.yml` の `rules-check` | コメント（`.ts` / `.tsx`）と Markdown 全文が名指ししているパスのうち、実体のないものを報告する。種別の一覧と意味は検出器の docstring を参照 |
| `lib/pre-push-detector.sh` | `pre-push-import-rules.sh` / `pre-push-story-titles.sh` / `pre-push-named-paths.sh` / `pre-push-doc-comments.sh` / `pre-push-test-helper-duplication.sh` | `git push` のときだけ検出器を走らせ、違反があれば deny の JSON を返す。`deny_on_violations <検出器> <検査名> <直し方>` は走査ルートを渡さず（検出器の既定を使用）、`[種別]` 行で違反を読み、異常終了時は「検査できなかった」の deny を返す（判定は `.github/scripts/lib/detector-report.sh` を `check-added-*` と共有）。`deny_on_all_src_failure`（引数同じ）は `--all src` で呼び終了コードで判定する（報告が `[` で始まらない検出器向け） |
| `lib/edit-detector.sh` | `block-lint-suppress.sh` / `check-doc-comments.sh` / `check-test-helper-duplication.sh` | 編集時検査フックの共通処理。`.github/scripts/lib/detector-report.sh` の `detector_report` で検出器を走らせ、異常終了時は `print_edit_unchecked_context <イベント名> <検査名> <検出器>` で `permissionDecision` なしの `additionalContext`（「検査できていません」）を返し編集は止めない。PostToolUse の違反報告も `print_additional_context` で共通化し、python3 の疎通は `detector-precondition.sh` の `python3_usable` で確認する |
| `lib/story-title-violations.py` | `pre-push-story-titles.sh` / `harness/githooks/pre-push` / `frontend.yml` の `rules-check` | story の `title` の違反を報告する。種別の一覧と意味は検出器の docstring を参照 |
| `lib/cases-report.sh` | `lib/*-cases.sh`・`.github/scripts/*-cases.sh`・`harness/records/count-cases.sh`・`harness/githooks/lib/check-tally-cases.sh` の各判定表（19 本） | 判定表が共有する 5 機能を提供する: (1) 判定の読み取り（`decide` / `decide_by_permission` / `normalize_miss` / `all_in_category` / `hook_verdict_by_permission`）、(2) 結果報告（関数 `report`・変数 `cases_failed`）、(3) 検出器種別の照合（`report_documented_kinds` / `report_covered_kinds` / `kinds_in_categories`）、(4) 判定表末尾文の照合（`last_statement` / `report_exits_with_cases_failed`）、(5) 1 件以上走ったかの照合（関数 `report_cases_ran`・変数 `cases_reported`）。ケースの並べ方と検出器の呼び方は各判定表が持つ |
| `lib/cases-report-cases.sh` | `harness/githooks/pre-push` / `frontend.yml` の `rules-check` | `lib/cases-report.sh` 自身の判定表。種別照合・`report` の出力と `cases_failed`・`decide*` / `hook_verdict_by_permission` の判定（pass / deny / broken / miss）・各判定表の末尾が `exit "$cases_failed"` であること・`report_cases_ran` の挙動を検証する（詳細は冒頭コメントとケース名）。食い違いがあれば exit 1 |
| `lib/cases-fixtures.sh` | `lib/pre-push-detector-cases.sh` / `lib/edit-detector-cases.sh` / `lib/import-rule-cases.sh` / `lib/verification-agent-cases.sh` / `lib/parent-session-edit-cases.sh` / `lib/issue-flow-kind-cases.sh` | 判定表が共有する前提の組み立て関数。落ちる検出器スタブ（`place_failing_detector`）・起動不能なコマンド（`broken_command_path_prefix`）・同一本体のテストヘルパー（`place_duplicate_helpers`）・サブエージェント呼び出し入力フィールド（`subagent_call_fields`）・フックの一時ディレクトリへの写し（`copy_repo_files`）を提供する |
| `lib/import-rule-cases.sh` | `harness/githooks/pre-push` / `frontend.yml` の `rules-check`（「動作確認」でも手動実行） | `import-rule-violations.py` の判定表。種別・件数・全種別の網羅・`scan()` と docstring の並び一致・スタブ検出器の broken 判定を検証する。食い違いがあれば exit 1 |
| `lib/named-path-cases.sh` | `harness/githooks/pre-push` / `frontend.yml` の `rules-check`（「動作確認」でも手動実行） | `named-path-violations.py` の判定表。deny / pass / miss と、検出器種別の並びと docstring の一致を検証する。食い違いがあれば exit 1 |
| `lib/pre-push-detector-cases.sh` | `harness/githooks/pre-push` / `frontend.yml` の `rules-check` | `lib/pre-push-detector.sh` の判定表。`deny_on_all_src_failure`（一時ディレクトリの `pre-push-test-helper-duplication.sh`）と `deny_on_violations`（スタブ検出器）で、deny（違反 / 検査できなかった）と pass を検証する。食い違いがあれば exit 1 |
| `lib/edit-detector-cases.sh` | `harness/githooks/pre-push` / `frontend.yml` の `rules-check`（「動作確認」でも手動実行） | `lib/edit-detector.sh` を使うフック 3 本を一時ディレクトリへ複製し、スタブまたは実物検出器で拒否 / 検査できていない / 違反報告 / 素通りを検証する。食い違いがあれば exit 1 |
| `lib/canary-cases.sh` | `harness/githooks/pre-push` / `frontend.yml` の `rules-check`（「動作確認」でも手動実行） | `hook-canary.sh` の判定表。deny / pass / miss を検証する。食い違いがあれば exit 1 |
| `lib/story-title-cases.sh` | `harness/githooks/pre-push` / `frontend.yml` の `rules-check`（「動作確認」でも手動実行） | `story-title-violations.py` の判定表。deny / pass / miss と、検出器種別の並びと docstring の一致を検証する。食い違いがあれば exit 1 |
| `lib/missing-doc-comments-cases.sh` | `harness/githooks/pre-push` / `frontend.yml` の `rules-check`（「動作確認」でも手動実行） | `missing-doc-comments.py` の判定表。deny / pass / miss を終了コードと報告見出しで検証する。食い違いがあれば exit 1 |
| `lib/duplicate-test-helpers-cases.sh` | `harness/githooks/pre-push` / `frontend.yml` の `rules-check`（「動作確認」でも手動実行） | `duplicate-test-helpers.py` の判定表。単一ファイル指定と `--lines` の両方で deny / pass / miss を検証する。食い違いがあれば exit 1 |
| `lib/verification-agent-cases.sh` | `harness/githooks/pre-push` / `frontend.yml` の `rules-check`（「動作確認」でも手動実行） | `track-verification-agent-activity.sh` と `block-git-during-verification-agent.sh` の判定表。Task / Agent と git の呼び出し、相対パス実行・リポジトリ外 cwd からの絶対パス実行での拒否を検証する（詳細は冒頭コメントとケース名）。食い違いがあれば exit 1 |
| `lib/hook-input.sh` | `record-firings.sh` / `track-verification-agent-activity.sh` / `block-git-during-verification-agent.sh` / `block-parent-session-edit.sh` | 標準入力の JSON から文字列値を取り出す `extract`。jq を使わず bash の組み込みだけで読む |
| `lib/firings-log.sh` | `record-firings.sh` / `block-parent-session-edit.sh` | 発火ログのパスを組み立てる `firings_log_path <session_id>` |
| `lib/parent-session-edit-cases.sh` | `harness/githooks/pre-push` / `frontend.yml` の `rules-check`（「動作確認」でも手動実行） | 実物の `record-firings.sh` に発火ログを書かせたうえで `block-parent-session-edit.sh` へ Edit / Write を流し、親セッション編集の拒否と素通りを検証する（詳細は各ケース名）。食い違いがあれば exit 1 |
| `lib/issue-flow-kind-violations.py` | `block-issue-without-flow-kind.sh` | Issue を作る呼び出しが作業の種類を決めているかを見る。Bash は bash と同じ規則で字句に分けてから読む。種別の一覧と意味、行の書式は検出器の docstring と定数を参照 |
| `lib/issue-flow-kind-cases.sh` | `harness/githooks/pre-push` / `frontend.yml` の `rules-check`（「動作確認」でも手動実行） | `issue-flow-kind-violations.py` と `block-issue-without-flow-kind.sh` の判定表。検出器の表は python3 を 1 回だけ起動して検出器を import し、ケースごとに判定の関数を呼ぶ。フックの表はフックを一時ディレクトリへ複製し、検出器を CLI として走らせて deny / pass と拒否文の並びを検証する。食い違いがあれば exit 1 |

## 強制力の序列 — フックが発火しない実行環境がある

Biome の format 差分を含む状態で push が通り CI で落ちた回がある。**`pre-push-lint.sh` 単体は正しく動く**（一時ファイルを置いてフックへ直接 JSON を流し、`&&` で連結した push コマンドへのマッチと format 差分での deny 返却を実測済み）。それでも push が通り、同じセッションでは `post-edit-lint.sh` の自動整形も一度も動いていなかった。リモート実行環境（Claude Code on the web など）では `.claude/settings.json` の配線が読み込まれないことがある。

**フェイルオープンかつサイレント**なため、通ったのか検査されなかったのかを区別できない。したがって **Claude Code のフックを強制力の最上位として数えることはできない**。序列は次のとおり。

| # | 層 | 効く範囲 | タイミング | 置き場所 |
| --- | --- | --- | --- | --- |
| 1 | CI | 無条件 | push の後 | `.github/workflows/` |
| 2 | git hooks | クライアント非依存 | push の前 | [`harness/githooks/`](../../harness/githooks/README.md) |
| 3 | Claude Code hooks | CLI 起動セッションのみ | 編集・コマンドの直前 | ここ |
| 4 | skill / rules | お願いベース | 読まれたとき | `.claude/skills/` / `rules/` |

**push 前検査の強制は git hooks が担う。** ここにある `pre-push-*` は、同じスクリプト（`lib/`）を編集中に走らせる**最速フィードバック層**の位置づけになる。`harness-growth` が「層 1（`hook`）に置く」と判断したときは、`harness/githooks/` か CI のどちらかに置き、Claude Code 側はその共有版として足す。

### カバー範囲と残る穴

git hooks へ移せるのは **push 前に痕跡が残る検査だけ**。下の表で CI の代替が「**無し**」の行は、フックが発火しない環境では効かず、git イベントに対応物もないため移設できない。

| 効かなくなるもの | CI の代替 |
| --- | --- |
| `block-lint-suppress.sh`（編集時のブロック） | **あり**。抑制コメントは diff に残るため、`.github/scripts/check-added-lint-suppressions.sh` が**追加行の分だけ**同じ判定（例外も `lib/lint-suppressions.py` で共有）で落とす。CI と push 前（git hooks）の両方で実行する。push 前は `python3` がある環境だけ（「飛ばします」を出してスキップ。CI は落とす → `.github/scripts/lib/detector-precondition.sh`）。検出器が途中で落ちた場合は push 前も CI も落とす（`.github/scripts/lib/detector-report.sh`） |
| `block-npx.sh`（セッション中の行為の禁止） | **無し**。push 時点で痕跡が残らないため代替不能 |
| `block-git-during-verification-agent.sh`（セッション中の行為の禁止） | **無し**。競合はセッション実行タイミングだけが原因で、コミット後の状態に痕跡が残らない |
| `session-url-notice.sh`（セッション URL の提示） | **無し**。Issue コメントは CI から読めるが、CI が走るのは規約の起点（着手時）より後で事後に貼らせるしか直せない（`harness/case-law/process.md`）。不発でも情報が 1 つ欠けるだけでガードは破れない |
| `post-edit-lint.sh` / `check-test-rules.sh` / `check-doc-comments.sh`（即時フィードバック） | 結果は push 前検査（git hooks）と CI が拾う。**即時性だけが失われる** |
| `check-test-helper-duplication.sh`（即時フィードバック） | 結果は push 前検査（git hooks の `duplicate-test-helpers.py --all src`。`python3` がある環境のみ）と CI（`rules-check`）が `src/` 全体で拾う。**即時性だけが失われる** |
| `record-firings.sh`（発火ログ） | **無し**。`harness-record` の計測は、セッション見出しのないログを「計測対象外」と扱う設計のため誤ったゼロにはならない（ただし Skill ツールを通らない起動では見出しがあっても発火行が書かれない → 下表「区切りがログに残らない起動」）。一方、同じログを読む `block-parent-session-edit.sh` は区切りがないと素通りするため、こちらが不発だと親の編集拒否も効かなくなる |
| `block-parent-session-edit.sh`（セッション中の行為の禁止） | **無し**。親とサブエージェントのどちらが編集したかはコミットに残らない。発火する環境でも残る穴は下表 |
| `block-issue-without-flow-kind.sh`（セッション中の行為の禁止） | **無し**。Issue の作成は push と関係なく起き、リポジトリに痕跡が残らない。発火する環境でも残る穴は下の 2 つ目の表 |

`block-parent-session-edit.sh` が発火する環境でも残る穴は 5 つある。

| 残る穴 | 内容 |
| --- | --- |
| 区切りがログに残らない起動 | Skill ツールを通らない起動（利用者のスラッシュコマンド入力、手順を直接読んで `implementation-flow` を進める回）は `skill` 行がログに書かれない。**実測は `/implementation-flow` を打った回のみ**で、`skill` 行が書かれず `planner` 起動前の親の Write は通り、起動後は deny された（[#1277 の実測](https://github.com/DIO0550/design-composer/issues/1277#issuecomment-6708032746)）。仕組み（プロンプト直接展開により Skill の PostToolUse が発火しない点）や他のスラッシュコマンド、手順直読みの回（#1046 はフック不発環境だった）は**推論**。この推論では、`implementation-flow` 後に `/harness-record` / `/harness-growth` を打っても前の区切りが残り拒否が続く（回避策は「例外（エスケープハッチ）」、対策は #1309） |
| matcher の外の道具 | `NotebookEdit` / `MultiEdit` は matcher（`Edit\|Write`）外のため見ない。入力キーが異なり（`NotebookEdit` は `notebook_path`）、#1046 のゴールも Edit / Write に限定されている |
| Bash 経由の書き換え | `sed -i` やリダイレクトでの書き換えは見ない。コマンド文字列から書き換え先パスを確定できないため |
| 正規化しないパス | `..` を挟んだ絶対パスや symlink 越しのパスは、綴りがルートと前方一致しないとリポジトリ外として通る（パス正規化はしない） |
| 発火しない起動の形 | フック自体が発火しない起動形態（「発火しているかを確かめる（カナリア）」の実測）では効かない |

`block-issue-without-flow-kind.sh` が発火する環境でも残る穴は次のとおり。取りこぼす形は判定表 `lib/issue-flow-kind-cases.sh` が `miss` で、止めすぎる形・読む位置を誤る形の多くは `deny` で固定している。

| 残る穴 | 内容 |
| --- | --- |
| 取りこぼす | `bash -c` / `sh -c` / `eval` / `xargs` / スクリプトの中 / `gh alias` / GraphQL の `createIssue` / `curl` / GitHub の UI からの作成は見ない。入れ子のコマンドを解くと字句解析が二重になり、回避を防ぐことは目的にしない |
| 止めすぎる | `export GH_REPO` を先に実行する形と `cd <他リポジトリ>` の後の作成は、1 回の入力から作成先が決まらないので自リポジトリとして止める。展開を含むラベル・`-R`・`gh api` の作成先も同じ（ラベルは数えず、作成先は自リポジトリとみなす）。展開はまねないので、ダブルクォートの中と区切りをクォートしないヒアドキュメントの本文は `$` `` ` `` `\` を 1 つでも含めば確定できないとして止め（`$(cat <<D …)` の形を除く）、クォートの外の `$` は `$'…'` `$"…"` も展開とみなす |
| 止めすぎる（算術） | 算術の `((…))` の中の `<<` をヒアドキュメントの開始と読むので、`gh` を含むコマンド全体を読めないとして止める（`$((…))` は中身を別のコマンドとして読むので止めない） |
| 読む位置を誤る | `cd sub && … --body-file rel.md` の相対パスは入力の `cwd` から読む |
| 区別しない | 対話中かどうか、ラベルを人が選んだかどうかは見ない（手順 4 の (a)・(b) の使い分けは拒否文の案内に頼る） |
| 字面で読む | `$(cat <<…)` の形なら、作成と無関係でも本文として読む。範囲の閉じ括弧は、中のヒアドキュメントや `case` を考えずに数える（bash との突き合わせは未検証） |
| プラグインの作成 | `issues-workflow-plugin` のスキルが作る Issue も止まる（`flow:*` を付けない形のため）。拒否文の案内に従ってラベルか行を足して作り直す |
| MCP の発火 | `mcp__github__issue_write` で PreToolUse が発火するかは、本物のセッションで確かめるまで未検証 |

### 「代替不能」が実際に不発だったとき、手動で肩代わりする

`block-npx.sh` / `block-git-during-verification-agent.sh` / `block-parent-session-edit.sh` / `block-issue-without-flow-kind.sh` は上表のとおり CI の代替が**無し**。カナリア（次項）で不発が確定したら「記録のみ」で終わらせず、そのフックが止めるはずだった操作を手動で確認する（不発のままミューテーションがコミットへ混入した回と、任意の `npx` 実行が素通りした回がある）。

| 不発したフック | 手動で確認すること |
| --- | --- |
| `block-npx.sh` | 実行した `npx` コマンドがリポジトリへ何か書き込んでいないか `git status` で確認する |
| `block-git-during-verification-agent.sh` | 作業ツリーを書き換えるサブエージェントの実行中に作られたコミットの diff を、そのエージェントが返したはずの内容と照合する（意図しない変更の混入がないか） |
| `block-parent-session-edit.sh` | このセッションの親の Edit / Write 履歴を見直し、`implementation-flow` 中にリポジトリ内のファイルを編集していないか確認する |
| `block-issue-without-flow-kind.sh` | このセッションで作った Issue に、`flow:*` ラベル 1 つか、本文の提案の行・通さない行があるか確認する。無ければ `implementation-flow` フェーズ 1「種類の確定」の手順 4 で決めて付ける |

`session-url-notice.sh` の不発は対応不要（上表のとおり、情報が 1 つ欠けるだけでガードは破れない）。

**`frontend.yml` の `rules-check` は、git hooks（層 2）にしかなかった検査を CI（層 1）へ上げるために作った**（内容は下の「判定表をどの層へ置くか」と `harness/githooks/README.md` を参照）。**doc コメントとテスト規約の 2 つ**は層 2・層 3 にしかなかったが、**層 2 と層 3 は同じ環境で同時に抜ける**。リモート実行環境は毎回クローンから始まるため `core.hooksPath` が未設定のまま（`postCreateCommand` は DevContainer でしか走らない）であり、`.claude/settings.json` が読まれない環境と重なっていた。実際に doc のない宣言が main へ入っている（`src/domains/unit/elapsed`）。層 2 の配線は `pnpm install` の `prepare` で自動化する一方、**同じ層で再発したら層を 1 つ上げる**方針に従い、検査自体も無条件に効く層 1 へ置いた。

**行数のラチェット**（`harness/records/count.sh --ratchet`）は、上げたのではなく**新設時から層 1 と層 2 に置いた**（同じ `rules-check` ジョブと `harness/githooks/pre-push`）。

#### 判定表をどの層へ置くか

**判定表（`*-cases.sh`）の配置判断はここで管理する。** 検出器本体をゲートで呼んでいても、`src` や記録に違反がない限り緑のままになるため、**取りこぼす向きの退行**（意図した取りこぼしの広がり・走査対象の抜け・報告の切り詰め）は判定表でしか捕まえられない。

| 判定表 | 層 1（CI） | 層 2（`pre-push`） |
| --- | --- | --- |
| `harness/records/count-cases.sh` | あり | あり |
| `lib/import-rule-cases.sh` | あり | あり（`python3` がある環境のみ） |
| `lib/story-title-cases.sh` | あり | あり（`python3` がある環境のみ） |
| `lib/named-path-cases.sh` | あり | あり（`python3` がある環境のみ） |
| `lib/missing-doc-comments-cases.sh` | あり | あり（`python3` がある環境のみ） |
| `lib/duplicate-test-helpers-cases.sh` | あり | あり（`python3` がある環境のみ） |
| `lib/issue-flow-kind-cases.sh` | あり | あり（`python3` がある環境のみ） |
| `lib/canary-cases.sh` | あり | あり（`python3` と `jq` が揃う環境のみ） |
| `lib/pre-push-detector-cases.sh` | あり | あり（`python3` と `jq` が揃う環境のみ） |
| `lib/edit-detector-cases.sh` | あり | あり（`python3` と `jq` が揃う環境のみ） |
| `lib/verification-agent-cases.sh` | あり | あり |
| `lib/parent-session-edit-cases.sh` | あり | あり |
| `lib/cases-report-cases.sh` | あり | あり |
| `.github/scripts/check-added-cases.sh` | あり（`lint-suppress` ジョブ） | あり（`python3` がある環境のみ） |
| `.github/scripts/check-pr-closing-issue-cases.sh` | あり | あり（`jq` がある環境のみ） |
| `.github/scripts/check-duplicate-issue-pr-cases.sh` | あり | **無し（残る穴）** |
| `.github/scripts/upsert-sticky-comment-cases.sh` | あり | あり（`jq` がある環境のみ） |
| `.github/scripts/build-pr-change-map-cases.sh` | あり | あり（`python3` がある環境のみ） |
| `.github/scripts/pr-explain-pages-cases.sh` | あり | あり（`python3` がある環境のみ） |
| `.github/scripts/build-pr-explain-cases.sh` | あり | あり（`python3` がある環境のみ） |
| `.github/scripts/check-pr-explain-template-cases.sh` | あり | あり（`python3` がある環境のみ） |
| `.github/scripts/pr-explain-core-cases.sh` | あり | あり（`python3` と Node 20 以上がある環境のみ） |
| `harness/githooks/lib/check-tally-cases.sh` | あり | あり |

- **層 3 の部品を検査する 6 本（`canary-cases.sh` / `verification-agent-cases.sh` / `parent-session-edit-cases.sh` / `pre-push-detector-cases.sh` / `edit-detector-cases.sh` / `issue-flow-kind-cases.sh`）も層 2・層 1 で走らせる。** ゲートが見ているのは「リポジトリ内のスクリプト判定が変わっていないか」であり、使用層とは独立している。フェーズ 7 はカナリア出力で不発を判定し、フェーズ 5・6 は検証エージェント実行中の git ブロックを前提にしているため、判定が黙って変わると手順が破綻する。また `lib/pre-push-detector.sh` と `lib/edit-detector.sh` は壊れても git hooks や CI が検出器を直接呼ぶため緑のまま残る。`edit-detector-cases.sh` は対象フック 3 本ごと一時ディレクトリへ複製して検証する。`issue-flow-kind-violations.py` を呼ぶ層は層 3 しか無く、字句への分け方が退行しても判定表のほかに落ちるものが無い
- **`check-added-cases.sh` だけは層 1 のジョブが `rules-check` ではなく `lint-suppress`。** 対象の `check-added-*` と同じジョブに置き、`python3` と git だけで完結させる
- **層 2 に載せる判断基準は、`pre-push` 全体の所要時間への影響。** `pre-push` 全体は 73.0 秒（実測・`node_modules` あり）。各判定表の実測時間は次のとおり: `check-pr-closing-issue-cases.sh` 0.8 秒（5xx 再試行待ちを差し替え口で 0 化、#1034）・`lib/canary-cases.sh` 1.0 秒（ともに全体 105.8 秒の別環境実測）、解説ページ 5 本合計 16.2 秒（地図 3.4・置き場 5.6［再試行待ち 0 化］・解説の検査 4.3・枠の検査 2.8・核 0.1）、`check-tally-cases.sh` 0.1 秒未満、`lib/import-rule-cases.sh` 2.2 秒、`lib/edit-detector-cases.sh` 1.5 秒、`upsert-sticky-comment-cases.sh` 0.9 秒（再試行待ち 0 化）、`lib/issue-flow-kind-cases.sh` 1.1 秒（検出器の表は python3 を 1 回だけ起動して回す。ケースごとに起動した形は 8.0 秒）
- **`check-duplicate-issue-pr-cases.sh` は層 1 のみ。** 問い合わせの再試行待ちで 22.0 秒（実測）かかり基準に収まらないため、`check-duplicate-issue-pr.sh` を触ったときは手動で走らせる（「動作確認」）。待ちを 0 にできるかは #1377 で扱う
- 層 3（`pre-push-*.sh`）には足さない。層 1・層 2 に置く以上、守る範囲が増えないため

#### 撮影範囲の検査は層 1 と層 4 にしかない

`Storybook Visual Regression` は視覚差分を取る前に、**ストーリーが撮影ビューポートに収まっているか**を検査する。この検査は CI（層 1）と push 前手順（層 4、`implementation-flow` フェーズ 7）にだけあり、**層 2・層 3 には置いていない。**

| 計測対象 | 実測（ストーリー 179 本・`node_modules` あり） |
| --- | --- |
| `pnpm build-storybook` | 10.7 秒 |
| `pnpm visual:capture` | 3 分 26.7 秒 |
| 合計 | 3 分 37 秒 |

- **層 2 へ載せない理由は所要時間。** `pre-push` 全体の約 3 倍（合計 3 分 37 秒）かかり、上の基準に収まらない
- **層 3 へも置かない。** 3 分半の検査は「編集中に走らせる最速フィードバック層」という位置づけと合わない
- **層 4 が止めるのは、はみ出しを入れる側の PR。** `harness/records/pr-634.md` 指摘 25 では PropertyPanel の 6 ストーリーが枠外へ出たまま main へ入った

**層 4 に残る穴は 5 つある。** ゲートは層 1 が持つため、いずれも踏んだ先で CI が落とす。

| 残る穴 | 内容 |
| --- | --- |
| 走らせ忘れ | 層 4 は指示ベースなので飛ばせる |
| フォントの差 | **手元で通っても CI と等価ではない。** CI は `fonts-noto-cjk` を入れて撮影するため、書体が違う環境では折り返しが変わって高さが再現しない（`harness/records/pr-651.md` 指摘 20: 手元で 180 本すべて通ったのに CI で 6 本が枠外）。撮影前のフォント検査は日本語の豆腐化しか見ないため、**書体違いは素通りして偽の成功になる** |
| Chrome | PATH になければ走らない（devDependencies になく、`CHROME_BIN` で指定する） |
| 踏む側は止まらない | main が壊れている間は、自分の差分と無関係な PR が赤を踏む（`pr-639.md` 指摘 19 / `pr-654.md` 指摘 21 はどちらも `src/` を 1 行も触っていない）。手順の条件にも当たらない |
| 比較は含まない | 手順が走らせるのは撮影まで。`visual:compare` は baseline を gh-pages から取る手間があるため入れていない。**撮影が通っても視覚差分が緑とは限らない** |

検査が読むのは `documentElement` の実寸（`scrollWidth` / `scrollHeight`）のみ。[`.github/scripts/storybook-visual-regression.mjs`](../../.github/scripts/storybook-visual-regression.mjs) の doc には「クリップされた中身は数に入らない」とあるが、その前提が崩れていることは `harness/records/pr-634.md` 指摘 26 で実測されている（#645）。

#### Rust の検査は層 1 と層 4 にしかない

`src-tauri/` の `cargo clippy` と `cargo test`（`TAURI_SETUP.md`「Rust 側の検査」）は、CI（層 1、`src-tauri.yml`）と push 前手順（層 4、`implementation-flow` フェーズ 7）にだけあり、**層 2・層 3 には置いていない。**

- **層 2 へ載せない理由は所要時間と環境。** 初回実測で clippy 74 秒 + test 92 秒と `pre-push` 全体（73.0 秒）の 2 倍を超え、基準に収まらない。また WebKit のシステムライブラリがない環境では飛ばすしかなく、スキップ環境が多いほど層 2 で守れない
- **層 3 へも置かない。** 最速フィードバック層の位置づけと合わないため

### 発火しているかを確かめる（カナリア）

`hook-canary.sh` は `echo hook-canary` を必ず deny する。push 前にこれを 1 度実行すると、サイレントだったフック不発を検知できる。

**通った = 不発、ではない。** カナリアは自分の取りこぼしと本当の不発を区別できないため、通ったときは PreToolUse の痕跡を見て判定する。

| カナリア | 実行中フラグのマーカー | 発火ログの見出し | 読み方 |
| --- | --- | --- | --- |
| deny された | — | — | **発火している** |
| 通った | ある | — | **カナリアの取りこぼし**。Task / Agent のフックは発火している（不発と書かない） |
| 通った | ない | ある | SessionStart は発火している。PreToolUse は不明 |
| 通った | ない | ない | **本当に不発**（`分類: hook-environment`） |

発火ログのパス組み立ては `lib/firings-log.sh` が担う。

```bash
ls -d "${TMPDIR:-/tmp}/design-composer-verification-agents-${CLAUDE_CODE_SESSION_ID:-}"
grep -c $'\tsession\t' "${TMPDIR:-/tmp}/design-composer-firings-${CLAUDE_CODE_SESSION_ID:-}.log"
```

**マーカーは作業ツリーを書き換えるサブエージェントを 1 度でも通した後にしか現れない。** `track-verification-agent-activity.sh` がその Task / Agent でしか作らないため、着手直後にカナリアを実行した回は 2 行目に当たらずマーカーなしの枝へ落ちる。2 行目で判定できるのは `implementation-flow` フェーズ 7（`plan-reviewer` を通した後）以降。

マーカーが証明できるのは **`Task|Agent` の PreToolUse か PostToolUse のどちらかが発火した**ことまで。`mkdir -p` が `hook_event_name` の分岐より前にあるため PostToolUse だけでも作られる（実測）。それでも見出し（SessionStart）より PreToolUse に近いため枝を分けている。

見出しは `record-firings.sh` が **SessionStart** で書く。ログファイル自体は PostToolUse の追記でも作られるため、**ファイルの有無ではなく見出し行を数える**（見出しのないログは `harness-record` が計測対象外として扱う）。

`CLAUDE_CODE_SESSION_ID` がない環境では、`…-*` の glob で出たものが**別セッションの残骸**でないかを見出しの時刻で確かめる（tmp はコンテナに残るため）。

実測は割れている。**同じ「リモート実行環境」でも発火する場合としない場合がある**ため、不発を前提に設計しつつ発火する側も活かしている（層 3 に置く価値がある）。

| 実測 | 起動元 | 結果 |
| --- | --- | --- |
| PR #192（2026-08-11） | webhook 起動 | **通ってしまった** = 不発 |
| 2026-08-14 | claude.ai/code から起動 | **deny された** = 発火 |
| 2026-09-12 | claude.ai/code から起動 | `echo hook-canary` は **deny され**、同じセッションの `echo hook-canary && echo done` は**通った** = カナリアの取りこぼし |
| 2026-10-10（#1032） | Issue の assigned で起動した routine（3 リポジトリを並べ、作業ディレクトリ `/home/user`） | **通った** = 不発（マーカーも見出しもない） |
| 2026-10-10（#1032） | 前のセッションが `create_session` で起動（design-composer のみ、作業ディレクトリはリポジトリルート） | **deny された** = 発火 |
| 2026-11-07（#1277） | 前のセッションが `create_session` で起動（design-composer のみ、作業ディレクトリはリポジトリルート） | **deny された** = 発火。スラッシュコマンドで再開すると、同じログに SessionStart の見出しが 2 行目として書かれ、ログが続いた |

#1032 の 2 行の読み方は `harness/case-law/process.md`「起動の形で発火が割れた対照」を参照。

**2026-09-12 の行が、この表の読み方を変えた実測。** ただし**連ねて実行した回に限る**。素の `echo hook-canary` は修正前の実装でも deny されるため（旧実装で実測）、素で実行して通った回の結論は今も有効であり、#192 は不発のまま。

**カナリアだけは外部コマンドに依存しない。** PreToolUse は exit 2 以外の異常終了を「非ブロックのエラー」として素通りさせるため、`jq` がない環境では他フックと同様にカナリアも exit 127 で終わり、**配線が読まれていない場合とまったく同じ見え方**になる（実測: `jq` を PATH から外すと deny が出ず exit 127）。それでは「フックは動いていたのに不発と報告する」ことになり検出自体が信用できない。そのため判定も出力も bash の組み込みだけで行い、`jq` はあれば使う程度に留めている。

deny メッセージには `jq` / `python3` が欠けていればその名前も併せて出す。**カナリアが通っても、これらを使う他のフックは同じフェイルオープンで黙って素通りする**ため。

検出自体は指示ベースだが、**失敗しても穴は開かない**。ゲートは git hooks と CI にあり、カナリアはそれが効いているかを知るためだけのもの。指示ベースに置いてよいのは、失敗してもガードが破れない検出系に限る。

## 例外（エスケープハッチ）

- `block-parent-session-edit.sh` が `implementation-flow` 外の作業でも拒否した場合は、その Edit / Write を `implementer` / `general-purpose` に渡す。正規の抜け方はこれだけとする（残る穴は「カバー範囲と残る穴」）。拒否を外すためだけに `harness-record` / `harness-growth` を起動しない
- `block-git-during-verification-agent.sh` が拒否したのに該当サブエージェントが動いていない場合は、中断で PostToolUse が来ずに残ったマーカーである。拒否文に出るディレクトリの `active.<種類>.*` が該当し、種類ごとの有効期間（フック本文）を過ぎれば無視される。**待たずに消すかは利用者に確認してから** `rm` で消す（本当に実行中のマーカーを消すと終了前に git 操作が通る）
- `block-lint-suppress.sh` は以下を許可する:
  - `useExhaustiveDependencies` / `react-hooks/exhaustive-deps`（`useEffect` マウント時）
  - `noUnusedVariables` / `no-unused-vars`（ブランド型 `declare const ... unique symbol` の直前行のみ）
  - 対象ファイルに `// @lint-suppress-ok` を記載した場合（本当に必要なときのみ）
- 編集時の検査フック 3 本（`block-lint-suppress.sh` / `check-doc-comments.sh` / `check-test-helper-duplication.sh`）は、**検出器が異常終了しても編集を止めない**（`lib/edit-detector.sh` が「検査できていません」を `additionalContext` で伝えるだけ）
  - 層 3 は即時フィードバック層であり、`block-lint-suppress.sh` が deny すると検出器故障中に JS / TS を編集できなくなる（PostToolUse の 2 本は止めても編集が戻らない）。止める役は層 1・2 が担う
  - ただし層 1・2 は検出器を編集時と異なる呼び方（ファイルパス / `--lines` / `--all src`）で呼ぶため、編集時の呼び方（標準入力 / 編集した 1 ファイル）でのみ落ちる場合は層 1・2 でも拾えない
  - 起動できない python3 は `lib/pre-push-detector.sh` と同じく python3 がないものとみなして何も伝えない（ここで扱うのは検出器の異常終了であり、python3 の有無は環境の前提。層 1 の `check-added-*` は `require_runnable_detector` で落とす）
  - 報告行を出したあとに落ちた検出器は違反として読む（`.github/scripts/lib/detector-report.sh` の既知の制限）
- テスト規約チェックの「条件分岐禁止」が見るのは **`test()` / `it()` のブロック内だけ**（`lib/test-conditionals.awk`）。セットアップやファクトリなどヘルパー関数内の分岐は対象外
  - `rules/testing.md` が禁じているのは「テストケースが入力によって形を変える」ことであり、セットアップの分岐ではないため
  - ファイル全体を見ていた頃は、テストが 1 件も分岐していないファイルでもヘルパーの 1 行で push が止まっていた。誤検知で止まるフックはエスケープハッチ乱用を招き全体の信用を落とす
- テスト規約チェック（`check-test-rules.sh` / `pre-push-test-rules.sh`）は以下で個別に無効化できる:
  - ファイル単位: `// @test-rules-disable [no-describe|no-conditional|file-naming|test-location ...]`（引数なしで全ルール無効化）
  - プロジェクト単位: 最寄りの `.test-rules.yml` に `<ルール名>: false` を記載
- テスト規約チェックの `test-location`（テストは対象モジュールの `__tests__/` 直下に置く）は、`分類: test-placement` が未介入のまま 5 回出たため #233 で追加した
  - 判定は「親フォルダ名が `__tests__` か」だけ。`rules/testing.md`「配置と命名」のうち機械判定できるのはここまでであり、「実装を `index.ts` に直接書く」「分割はサブフォルダで」は判定できない
  - 導入時点で `src/` の 321 件すべてが既に `__tests__/` 直下にあり、偽陽性 0 件で導入できた（絞る理由がない）
- `check-test-helper-duplication.sh`（層 3・PostToolUse）は**ブロックしない**（`additionalContext` を返すだけ）。対象は**編集したファイルが絡む重複だけ**だが、探索範囲はプロジェクト全体の `__tests__/`（同じフォルダに限らない）
  - ブロックしないのは、PostToolUse は編集後に走るため止めても編集が戻らず、止める役は push 前と CI（`pre-push-test-helper-duplication.sh`・`harness/githooks/pre-push`・`rules-check`）が担うため。触っていないファイルの重複を並べないのは、今書いた分が埋もれるのを防ぐため（検出器の `groups_for_file`）
  - 判定は「本体が一字一句同じ」に限る。似ているだけのものは見ない（偽陽性で止めないため）
  - 導入時点の既存重複 13 組を #153 で一旦 0 組にしたが、当時は検出器がフォルダをまたぐ重複（#179）を見ていなかった。探索範囲をプロジェクト全体へ広げると新たに 11 組見つかり（#866 着手時点で 8 組・18 箇所）、#866 で 0 組にした（`--all src` が exit 0）
  - 本体の切り出し方（引数・戻り値の型注釈の読み飛ばし、式本体アロー関数）と意図した取りこぼしは検出器の docstring、判定表は `lib/duplicate-test-helpers-cases.sh` を参照。型注釈の `{}` を本体と誤認する偽陽性（#179・#406）や既定引数 `f(props: T = {})` の見逃しは解消済み
  - **エスケープハッチは置かない。** 以前は `// @duplicate-helpers-ok` で無効化できたが `src` での使用が導入以来 0 件であり、`--all`（push 前と `rules-check`）が読まないため層によって効き方が割れることから、`check-doc-comments.sh` と同じ理由で撤去した（#309）
- `.github/scripts/check-added-test-helper-duplication.sh`（層 1・CI の `lint-suppress` ジョブ。`harness/githooks/pre-push` も引数なしで呼び、base を `origin/main` として push 前にも通す。検出器を走らせられない・途中で落ちた場合は exit 2 → `.github/scripts/lib/detector-precondition.sh` / `detector-report.sh`）は、`--all` 格上げ（#309）より前から置いている追加行限定の検査であり、現在は `--all` と一部重複している（撤去するかは #954 で判断）。`duplicate-test-helpers.py --lines` を使い、**このブランチで追加された行に載り、かつ同じ本体の数が base（merge-base）より増えたものだけ**を違反にする
  - ファイル分割や rename 検出されない大幅書き換えを伴う移動では移先が全行「追加行」になるため（pr-240 と同じ形）、追加行に候補が出たときだけ merge-base の `src` を展開して `--base-root` で本体の数を比べる。有無ではなく数で比べる理由と取りこぼしは検出器の `grown_since` と docstring「意図した取りこぼし」を参照
- `check-doc-comments.sh` は**ブロックしない**（`additionalContext` を返すだけ）。対象は**編集したファイルの分だけ**
  - 対象は `src/` の実装ファイルのみ（`__tests__/` / `*.stories.*` / `__stories__/` は除外）
  - 対象箇所は**ファイル直下の宣言とコンパニオンオブジェクト直下のメソッド**だけ（入れ子の関数・さらに深いオブジェクトのメソッドは対象外）
  - メソッドとみなすのは `const` で始まるオブジェクト直下にあり、引数括弧の後ろに本体（`{` か `=>`）が続くものだけ。判定の仕組みと意図した取りこぼし（入れ子オブジェクトのメソッド）は検出器の docstring、判定表は `lib/missing-doc-comments-cases.sh` を参照
  - **同じファイルに同名の宣言がありそちらに doc があれば対象外**とする。型とコンパニオンオブジェクトが doc を共有する形（`export type Size` の下に `export const Size = {`）を偽陽性にしないため
  - **エスケープハッチは置かない。** `src` での使用が導入以来 0 件で、`--all`（`rules-check`・`harness/githooks/pre-push`）が読まないため層によって効き方が割れていた（#756）
- `pre-push-doc-comments.sh` は **push をブロックする**。対象は `src/` 全体
  - 導入時点では既存の抜け 149 件と項目不足 190 件があったため追加行・`--missing-only` に絞っていたが、#159 で両方 0 件にしたため絞る理由がなくなった
  - **コンパニオンオブジェクトのメソッドも検査する**（`frontend.yml` の `rules-check` と `harness/githooks/pre-push` の `--all` も同じ）。導入時点の抜け（doc なし 110 件・項目欠け 260 件）を #720 で 0 件にしたため追加行限定を解除した
  - エスケープハッチは置かない（PostToolUse 版と同じ）
  - 検出器は `--all src` で 1 回呼ぶ（`rules-check`・`harness/githooks/pre-push` と同じ）。ファイルごとに別走査を持つと除外条件が片方だけずれ層ごとに判定が割れる
- `pre-push-test-helper-duplication.sh` は **push をブロックする**。対象は `src/` の `__tests__/` 全体（`rules-check`・`harness/githooks/pre-push` と同じ `--all src`）
  - 既存重複があった間は PostToolUse 報告のみに留めていたが、#866 で 0 組にしたため絞る理由がなくなった
  - エスケープハッチは置かない（PostToolUse 版と同じ）
- `pre-push-typecheck.sh` / `pre-push-lint.sh` は `node_modules` 未インストール時（ツール実行不能時）は黙ってスキップする
- `post-merge-review.sh` はマージを**ブロックしない**（`additionalContext` を返すだけ）。マージは人の判断であり、記録がないことを理由に止めても記録の質は上がらないため
  - 検知対象は `mcp__github__merge_pull_request` と `gh pr merge` のみ。素の `git merge` はベースブランチ取り込みで日常的に走るため対象外とする
- `.oxlintrc.json` の `overrides`（`rules/architecture.md`「依存方向のルール」の強制）は、`domains/` → `libs/` の辺だけ `warn`（**ブロックしない**）。導入時点で `@/libs/document-ipc`（型のみ）・`@/libs/document-json` への import が計 5 件存在し（`document-save-state` は申し送りの既知債務、残り 3 件はテストの `DocumentJson` fixture 利用）、ドメインの型・モジュール再配置を伴う判断（`AGENTS.md`「設計判断の確認」）のため導入回では移動していない。`services/` → `features/` `libs/` `components/` `hooks/`・`components/` `hooks/` `utils/` `types/` → `domains/` `services/` `features/`・`libs/` → `services/` `features/` `components/` `hooks/` の 3 方向は既存違反 0 件だったため `error` で導入した
  - `features/<x>/domains/` への同種の適用は未実装
- `.oxlintrc.json` の `overrides`（`rules/architecture.md`「モジュールの公開API」の「複数ファイルへの分割が必要になったら」の閾値）は、`src/**/*.tsx` に `max-lines: 600` を `error` で置く。防ぎたいのは 1 ファイルに 11 コンポーネント・716 行が同居したような肥大化
  - **数えるのは空行とコメントを除いた行**（`skipBlankLines` / `skipComments` を `true` に設定。既定は両方 false で `wc -l` 相当）。これにより `__tests__/` を除外せずに導入時点の違反 0 件が成立している（生 620 行の `use-editor-state.actions.test.tsx` が空行 96 行を引いて 600 行以内に収まる）
  - **対象は `src/` の `.tsx` すべて**であり、`__tests__/`・`.stories.tsx`・`__stories__/` の共有コンテナも含む（実測: 実行行 601 行なら `__tests__/` 配下でも発火）。`.ts` は対象外（`design-document/index.ts` が 1449 行、`editor-state/index.ts` が 1273 行あり違反 0 件で入れられないため）
  - **`.ts` が対象外なため、中身を兄弟 `.ts` へ逃がす経路は開いたまま。** 抑止しているのは `rules/architecture.md`「実装は `index.ts` に直接書く」だけであり、`import-rule-violations.py` は「外から非 index ファイルを読む」形を見るため `index.tsx` のみから読む兄弟 `.ts` は検出しない（probe で実測。該当ファイルは現状 0 件）
  - エスケープハッチは他の oxlint ルールと共通で、`// @lint-suppress-ok` を書くと抑制コメント禁止が**そのファイル全体で**外れる。分割の判断を迂回する用途には使わない
  - 導入時点では `lib/lint-suppressions.py` が `biome-ignore` / `eslint-disable` しか見ておらず `oxlint-disable` が素通りしていた（実測: `// oxlint-disable eslint/max-lines` で `@lint-suppress-ok` なしに無効化できた）。検出側へ `oxlint-disable` を追加して塞ぎ済み（既存抑制は `biome-ignore` の 3 件のみで新違反 0 件）
- `.oxlintrc.json` の `overrides`（#1066）は、`src/**/*.tsx` に `react/forbid-elements` を `error` で置き、生の `<button>` を禁じる（対応する規範は `rules/` になく lint のみが持つ）。押せるものは `src/components/button` の `Button` で描く。除外対象（`src/components/**`・`src/**/__tests__/**`・基本ボタンに当たらない行やレールを描くファイル）の一覧と理由は `.oxlintrc.json` のコメントで管理する（ここに写さない）。導入時点の違反 0 件
  - **`"plugins": ["react"]` は `error` 側・`off` 側の両方の override に必要。** 欠けると発火しない／`off` が効かない（probe で実測）。また `off` の override は `error` より後ろに置く（前に置くと `error` で上書きされる。実測）
  - `react` プラグイン有効化により `src/**/*.tsx` へ `react` の correctness 規則が `warn` で入る（導入時 0 件）。そのうち `jsx-props-no-spread-multi` は自動修正を持つため、`post-edit-lint.sh` の `oxlint --fix` が同一 props の二重 spread を黙って 1 つにまとめる（実測）
  - **残る穴は恒久の判断として受け入れる（#1066）。** 除外ファイル内の生 `<button>`（`artboard-list` / `token-list` の見出し `+` 等）や `role="button"` の生要素（既存例 `artboard-frame/index.tsx`）は見ず、`// @lint-suppress-ok` でファイル単位の抑制もできる。また違反 0 件のため `error` override 自体を消しても落ちる検査はない（他の oxlint 規則と同じく判定表は置かず、削除時に `pnpm run lint` が 0 件で通ることを実測済み）
  - 許可を要素単位まで狭めない。`overrides.files` の glob はファイル単位しか書けず、要素単位にするには Python 検出器が必要になり配線先が増えて編集時（`post-edit-lint.sh`）に効かなくなるため
- **feature 間の deep import・循環参照・モジュール内部への deep import**（#257 のゴール 1・2・6）は `lib/import-rule-violations.py` が検査する。oxlint に置かなかったのは 3 つとも**リポジトリ構造を読まないと判定できない**ためであり、`overrides.files` の静的 glob では書けない（#284 実測で同一 feature 内ドメイン間 import まで巻き込み 38 件の偽陽性。数値出典は #257 コメント）
  - **判定根拠はスクリプトの docstring に記載している**（入れ子モジュール・`__tests__/` の扱い・feature だけ狭い理由）。二重管理を避けるためここには写さない。判定表は `lib/import-rule-cases.sh`
  - **ゴール 6 の実効範囲は現状ほぼ fixture 専用。** 入れ子モジュールの index を許すため `module-public-api` に該当するのは「モジュールフォルダ配下の非 index ファイルを外から読む」形だけで、テスト・ストーリーを除いた該当ファイルは実測 4 件のみ（`index.ts` 直書き規約が守られているため）。**将来の退行を止める枠**としての位置づけ
  - **エスケープハッチは置かない。** ファイル単位で例外にするとそのファイルから何でも読めてしまうため。代わりにコメント行の無視・入れ子 index の許可で偽陽性を避けている
  - 導入時の既存違反 8 件（feature をまたぐ fixture の直接 import）はテスト用公開口を設けて 0 件にしてから `error` 相当（exit 1）で導入した
- **story の title**（`lib/story-title-violations.py`）は **push をブロックする**。対象は `src/` 全体。**対応する規範は `rules/` にない**（機械判定できるためフックのみで持つ → `AGENTS.md`「規約の更新」）
  - **エスケープハッチは置かない。** 葉（ツリー表示名）を検査外とすることで実装都合を吸収済みであり、導入時の違反 0 件・偽陽性 0 件のため不要な逃げ道を足さない
  - 導入時は違反 0 件・49 本（PR #679 で揃えた状態を維持する検査）
  - **`title` は story の id でもある。** この検査に合わせてフォルダを動かすと VRT のベースラインと `iframe.html?id=` の参照が**すべて**変わる（実例は `harness/case-law/process.md`）。移動時はその入れ替わりを織り込んで計画する
  - 判定の仕組み（導出手順・葉を見ない意図した取りこぼし）はスクリプトの docstring、判定表は `lib/story-title-cases.sh` を参照
- **名指ししたパス**（`lib/named-path-violations.py`）は **push をブロックする**。対象はリポジトリ全体の `.ts` / `.tsx`（コメント内のみ）と `.md`（全文）。**対応する規範は `rules/` にない**（story の title と同じ扱い）
  - **エスケープハッチは置かない。** 免除条件は規則側で定義済み（拡張子のない PascalCase 名・`-` 終わりのプレースホルダ・相対表記・除外フォルダ・このファイルのフェンス内 probe）であり、導入時の違反 0 件・偽陽性 0 件のため不要な逃げ道を足さない
  - 導入時の違反 **15 件**（`src/` 6 件、`harness/case-law/` 9 件）を同じ PR で 0 件にして導入した。#690 マージ前の木へ当てると #690 が直した **14 箇所を 14/14** 検出する（`harness-growth`「採用前の再生」）
  - **`.claude/hooks/README.md`（このファイル）も走査し、免除するのはフェンス内の probe だけ**（動作確認レシピがこれから作るファイルを名指しするため）。probe の判定条件とファイル丸ごと除外しない理由は検出器の docstring を参照
  - **このファイルにレシピを書くときは、probe を docstring の条件に合わせる。** 条件外の綴り（`canvas/features/deep` のような作成途中のフォルダ名・非実在パス例）は違反になる。層を並べるときは `/` で繋がず 1 語ずつコードにする（`components/` `hooks/`）
  - **`harness/records/` は走査しない**（`harness/records/README.md`「過去の記録は書き換えない」。当てると 206 件出るが当時の綴りとして正しい）。一方 `harness/case-law/` は走査する（あちらが禁じるのは**判断**の書き換えであり、実体を指さなくなったパスは直す対象。`pr-330` で指摘実績あり）
  - **走査対象は git が追跡しているファイルのみ。** フォルダを歩くと `.gitignore` 済みの生成物（`storybook-static/` 等）で環境依存に止まるため。コミット前の新規ファイルは見えないが、push 時点ではコミット済みなのでゲートに穴は開かない
  - 判定の仕組み（実在判定手順・意図した取りこぼし）はスクリプトの docstring、判定表は `lib/named-path-cases.sh` を参照

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

# テストヘルパーの重複の判定表(`ok` だけなら期待どおり・`NG` が出たら判定が変わっている)。pre-push と CI も走らせる
bash .claude/hooks/lib/duplicate-test-helpers-cases.sh; echo "exit=$?"

# push がブロックされること(deny が出力される。重複があるとき)
echo '{"tool_input":{"command":"git push"}}' \
  | bash .claude/hooks/pre-push-test-helper-duplication.sh

# push 以外はスルーされること(出力なし・exit 0)
echo '{"tool_input":{"command":"git status"}}' \
  | bash .claude/hooks/pre-push-test-helper-duplication.sh
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
echo '{"hook_event_name":"PreToolUse","session_id":"probe","tool_name":"Task","tool_input":{"subagent_type":"test-reviewer"}}' \
  | bash .claude/hooks/track-verification-agent-activity.sh
echo '{"session_id":"probe","tool_input":{"command":"git add -A"}}' \
  | bash .claude/hooks/block-git-during-verification-agent.sh

# 終了すれば通ること(出力なし・exit 0)
echo '{"hook_event_name":"PostToolUse","session_id":"probe","tool_name":"Task","tool_input":{"subagent_type":"test-reviewer"}}' \
  | bash .claude/hooks/track-verification-agent-activity.sh
echo '{"session_id":"probe","tool_input":{"command":"git add -A"}}' \
  | bash .claude/hooks/block-git-during-verification-agent.sh; echo "exit=$?"
rm -rf "${TMPDIR}/design-composer-verification-agents-probe"

# バックグラウンド起動の拒否を含む判定表（`ok` だけなら期待どおり・`NG` が出たら判定が変わっている）。pre-push と CI も走らせる
bash .claude/hooks/lib/verification-agent-cases.sh; echo "exit=$?"
```

```bash
# implementation-flow の中の親セッションの編集の判定表(`ok` だけなら期待どおり・`NG` が出たら判定が変わっている)。pre-push と CI も走らせる
bash .claude/hooks/lib/parent-session-edit-cases.sh; echo "exit=$?"
```

```bash
# 種類を決めていない Issue の作成が拒否されること(deny が出力される。理由に行の書式と手順 4 が載る)
echo '{"tool_name":"Bash","tool_input":{"command":"gh issue create -t x -b y"}}' \
  | bash .claude/hooks/block-issue-without-flow-kind.sh

# flow:* ラベルがあれば通ること(出力なし・exit 0)
echo '{"tool_name":"Bash","tool_input":{"command":"gh issue create -t x -b y --label flow:feature"}}' \
  | bash .claude/hooks/block-issue-without-flow-kind.sh; echo "exit=$?"

# Issue の作業の種類の判定表(`ok` だけなら期待どおり・`NG` が出たら判定が変わっている)。pre-push と CI も走らせる
bash .claude/hooks/lib/issue-flow-kind-cases.sh; echo "exit=$?"
```

```bash
# カナリアの判定表(`ok` だけなら期待どおり・`NG` が出たら判定が変わっている)。pre-push と CI も走らせる
bash .claude/hooks/lib/canary-cases.sh; echo "exit=$?"

# 編集時の検査フックが、検出器が落ちたときに「検査できていません」を伝えるかの判定表(`ok` だけなら期待どおり)。pre-push と CI も走らせる
bash .claude/hooks/lib/edit-detector-cases.sh; echo "exit=$?"

# テスト規約の全体検査(git hooks と共有。違反があれば exit 1)
bash .claude/hooks/lib/test-rules-scan.sh src

# この PR で追加された lint 抑制コメントを数える(CI と同じ判定)
bash .github/scripts/check-added-lint-suppressions.sh origin/main

# この PR で追加されたテストヘルパーの重複を数える(CI と同じ判定)
bash .github/scripts/check-added-test-helper-duplication.sh origin/main

# 上の 2 つの判定表(`ok` だけなら期待どおり)。exit 2 = 検査できなかった、も覆う
bash .github/scripts/check-added-cases.sh; echo "exit=$?"

# PR が閉じる Issue の検査の判定表(`ok` だけなら期待どおり)。pre-push と CI も走らせる
bash .github/scripts/check-pr-closing-issue-cases.sh; echo "exit=$?"

# 同じ Issue を閉じる他の PR の検査の判定表(`ok` だけなら期待どおり)。CI だけが走らせるので、
# check-duplicate-issue-pr.sh を触ったときはここで走らせる(20 秒ほどかかる)
bash .github/scripts/check-duplicate-issue-pr-cases.sh; echo "exit=$?"

# sticky コメントの投稿・差し替えの判定表(`ok` だけなら期待どおり)。pre-push と CI も走らせる
bash .github/scripts/upsert-sticky-comment-cases.sh; echo "exit=$?"

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

**終了コードまで見る。** 層 1（CI の `run:`）と層 2（`pre-push` の `run_check`）は**終了コードだけが配線**なので、標準出力の文字列しか確かめないと「無条件に落ちる」というゴールの本体が守られない。`; echo "exit=$?"` を必ず付ける。

**カナリアだけは例外で、判定は標準出力に出る。** PreToolUse の deny は JSON を返して `exit 0` で終わるため、終了コードでは deny と pass が区別できない。`canary-cases.sh` が見ているのも出力の有無で、そちらの終了コードは「ケース表と食い違ったか」を表す。

**カナリアのケースはコマンドへ直接書かずファイルに置く。** `cd /tmp && echo hook-canary` のような行は本物の呼び出しとして切り出されるため、表を書いたコマンド自体が deny される（実測）。

**probe は `.tsx` でも置く。** 解消した既存違反 8 件はすべて `.test.tsx` / `.stories.tsx` で、`src` には `index.tsx` を持つモジュールが 40 個ある。`.ts` だけで確かめると、拡張子の取りこぼし（`SOURCE_SUFFIXES` / `INDEX_NAMES` から `.tsx` が落ちる形）を素通りさせる。

```bash
# import 規約の判定表(`ok` だけなら期待どおり・`NG` が出たら判定が変わっている)。pre-push と CI も走らせる
bash .claude/hooks/lib/import-rule-cases.sh; echo "exit=$?"

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

# 兄弟が読み合って閉路になっても、出るのは feature-sibling だけ(feature 単位の閉路は見ない)
printf 'export * from "@/features/editor/features/sidebar";\n' > src/features/editor/features/tokens/probe.ts
python3 .claude/hooks/lib/import-rule-violations.py src; echo "exit=$?"   # → [feature-sibling] 2 件・exit=1
rm src/features/editor/features/sidebar/probe.ts src/features/editor/features/tokens/probe.ts

# トップレベルの feature 同士が読むと落ちること(feature-sibling。これを通すようにしたら feature 単位の閉路の検査を戻す)
mkdir -p src/features/probe-a src/features/probe-b
printf 'export const A = 1;\n' > src/features/probe-a/index.ts
printf 'export { A } from "@/features/probe-a";\n' > src/features/probe-b/index.ts
python3 .claude/hooks/lib/import-rule-violations.py src; echo "exit=$?"   # → [feature-sibling] 1 件・exit=1
rm -rf src/features/probe-a src/features/probe-b

# 子が親を読むと落ちること(feature-ancestor。親がその子を読んでいて閉路になっても、出るのはこれだけ)
printf 'export { EditorScreen } from "@/features/editor";\n' > src/features/editor/features/canvas/probe.ts
python3 .claude/hooks/lib/import-rule-violations.py src; echo "exit=$?"   # → [feature-ancestor] 1 件・exit=1
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
# 層 2（git hooks）が落ちた検査のあとも最後まで走り、結果の行が失敗を言うこと。
# **probe は doc 付き・整形済みにして、typecheck が見る `src/` の中に置く。** 層 2 は Biome /
# doc コメントも同じ回に走らせるため、doc のない・整形していない 1 行を置くとそれらも落ち、
# exit 1 が型から来たのかを「失敗した検査」の行で切り分けることになる
printf '/**\n * 型で落ちる検査の probe。\n *\n * @param count 数\n * @returns 表示\n */\nexport const Probe = (count: number): string => count;\n' \
  > src/features/editor/probe.ts
bash harness/githooks/pre-push; echo "exit=$?"   # → 「失敗した検査: typecheck」・exit=1
rm src/features/editor/probe.ts
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

| スキル | 内容 |
| --- | --- |
| `.claude/skills/implementation-flow/` | 実装の手順（計画・サブエージェントによる検証・Issue への記録・マージ後の追記） |
| `.claude/skills/harness-record/` | マージ後の評価記録（`harness/records/` へ 1 ファイル） |
| `.claude/skills/harness-growth/` | 記録の集計と、規約 / フックの改善 |

`post-merge-review.sh` は後ろ 2 つ（`harness-record`・`harness-growth`）のスキルへの入口として働く。
