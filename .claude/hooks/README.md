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
| `check-test-helper-duplication.sh` | `PostToolUse` (Edit/Write) | **テストヘルパーの重複検出**(rules/testing.md「テスト用ヘルパーの置き場所」)。同じ `__tests__/` に本体が一字一句同じヘルパーが 2 つ以上あれば知らせる |
| `check-doc-comments.sh`  | `PostToolUse` (Edit/Write) | **doc コメントの検証**(rules/coding.md「コメントは doc と Why / Why not に絞る」)。doc の無い宣言と、`@param` / `@returns` / `@throws` が欠けた doc を知らせる |
| `pre-push-doc-comments.sh` | `PreToolUse` (Bash)     | **push 前の doc コメント検査**。`src/` に doc の無い宣言、または `@param` / `@returns` / `@throws` の欠けた doc があれば push をブロック |
| `pre-push-import-rules.sh` | `PreToolUse` (Bash)     | **push 前の import 規約検査**(rules/architecture.md「モジュールの公開API」「依存方向のルール」)。公開 API を迂回する import・循環参照・カテゴリの外に置かれた domains のモジュールがあれば push をブロック |
| `post-merge-review.sh`   | `PostToolUse` (Bash/MCP)  | **マージ後の振り返りの提示**。PR のマージを検知し、Issue への追記と評価の記録を促す       |
| `hook-canary.sh`         | `PreToolUse` (Bash)       | **カナリア**。`echo hook-canary` を必ず deny する。通ってしまったらフックが発火しない実行環境（後述） |
| `session-url-notice.sh`  | `SessionStart`            | **セッション URL の提示**（AGENTS.md「Issue に紐づいて起動したら、セッションの URL を Issue に残す」）。URL を組み立てて渡す。ブランチが `claude/issue-<N>-...` なら対象の番号も添える |
| `record-firings.sh`      | `SessionStart` + `PostToolUse` (Skill/Task/Agent) | **スキル・サブエージェントの発火ログ**。tmp のセッション別ログへ追記し、`harness-record` が記録を書くときに読む。SessionStart のセッション見出しで「起動しなかった」と「フック不発」を切り分ける |
| `track-verification-agent-activity.sh` | `PreToolUse` + `PostToolUse` (Task/Agent) | **検証エージェントの実行中フラグ**(`分類: subagent-control`)。`plan-reviewer` / `implementation-reviewer` の開始・終了をセッション別のマーカーで数える。`block-git-during-verification-agent.sh` が読む |
| `block-git-during-verification-agent.sh` | `PreToolUse` (Bash)   | **検証エージェント実行中の git 操作を拒否**(`分類: subagent-control`)。マーカーが立っている間は `git add` / `commit` / `push` を deny する。ミューテーション実測の途中の書き換えをコミットへ取り込む事故(pr-391 #18)を防ぐ |

## 移植元から見送ったもの

- `require-skill-before-edit.sh` — typescript-rules-plugin 固有のスキルに依存するスキルゲートのため

### 見送りを取り消したもの

- `check-jsdoc-rules.sh` / `pre-push-jsdoc.sh` — 「JSDoc 必須ルールはこのリポジトリの規約に存在しない」を理由に見送っていたが、**その前提は PR #152 で `rules/coding.md`「コメントは doc と Why / Why not に絞る」が入った時点で消えていた**。見送りの判断が更新されないまま残り、PR #157 で doc の無い関数がレビューまで残った(#157 のレビュー / `harness/records/pr-157.md`)。移植元をそのまま戻すのではなく、このリポジトリの形(型とコンパニオンオブジェクトが doc を共有する)に合わせた `check-doc-comments.sh` を書いた
- `record-skill-fired.sh` — 「plugin 固有のスキルに依存する」を理由に見送っていたが、その理由は**特定スキルへのゲート**にしか当てはまらず、発火を記録すること自体は汎用だった。`harness-record` の材料のうち発火だけが記憶(自己申告)からしか取れない穴が残っていたため、汎用版を `record-firings.sh` として書いた
- **規約が増えたら、それを理由に見送ったフックを見直す。** 見送りの理由は「今の規約に無いから」であることが多く、規約が変わると理由ごと消える

## 配線

[`.claude/settings.json`](../settings.json) の `hooks.PreToolUse` / `hooks.PostToolUse` から参照。
パスは `$CLAUDE_PROJECT_DIR` 基準。

`lib/` はフック本体からのみ読む共有部品の置き場。`settings.json` からは参照しない。

| ファイル | 使う側 | 内容 |
| --- | --- | --- |
| `lib/test-conditionals.awk` | `check-test-rules.sh` / `pre-push-test-rules.sh` | `test()` / `it()` ブロック内の `if` / `else` / `switch` を行番号付きで出力する |
| `lib/duplicate-test-helpers.py` | `check-test-helper-duplication.sh` | `__tests__/` の中で本体が完全に一致するヘルパーを探す。`--all` で全体を検査できる |
| `lib/missing-doc-comments.py` | `check-doc-comments.sh` / `pre-push-doc-comments.sh` / `harness/githooks/pre-push` | `src/` のファイル直下の宣言のうち doc コメントの無いものを探す。`--all` で全体を検査できる |
| `lib/test-rules-scan.sh` | `pre-push-test-rules.sh` / `harness/githooks/pre-push` | 指定したルート配下の `*.test.ts(x)` をすべて検査する。違反があれば exit 1 |
| `lib/lint-suppressions.py` | `block-lint-suppress.sh` / `.github/scripts/check-added-lint-suppressions.sh` | 許可されていない lint 抑制コメントの行を報告する。例外の判定もここが持つ |
| `lib/import-rule-violations.py` | `pre-push-import-rules.sh` / `harness/githooks/pre-push` / `frontend.yml` の `rules-check` | 公開 API を迂回する import（`feature-public-api` / `module-public-api`）・循環（`import-cycle` / `feature-cycle`）・カテゴリの外に置かれた domains のモジュール（`domains-category`）を報告する |

## 強制力の序列 — フックが発火しない実行環境がある

PR #168 では、biome の format 差分を含む状態で push が通り、CI で落ちた。
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
| `block-lint-suppress.sh`(編集時のブロック) | **あり**。抑制コメントは diff に残るので、`.github/scripts/check-added-lint-suppressions.sh` が**追加行の分だけ**同じ判定で落とす(許可される例外も `lib/lint-suppressions.py` で共有) |
| `block-npx.sh`(セッション中の行為の禁止) | **無し**。push の時点で痕跡が残らないため代替不能 |
| `block-git-during-verification-agent.sh`(セッション中の行為の禁止) | **無し**。この競合はセッションの実行タイミングだけが原因で、コミット後のリポジトリの状態には痕跡が残らない |
| `session-url-notice.sh`(セッション URL の提示) | **無し**。URL はセッションの中にしか無く、残す先も GitHub のコメントなので、push の時点で痕跡が残らない。落ちても穴は開かない(規約が AGENTS.md に残り、失っても情報が 1 つ足りないだけでガードは破れない) |
| `post-edit-lint.sh` / `check-test-rules.sh` / `check-doc-comments.sh` / `check-test-helper-duplication.sh`(即時フィードバック) | 結果は push 前の検査(git hooks)と CI が拾う。**即時性だけが失われる** |
| `record-firings.sh`(発火ログ) | **無し**。ただし失敗しても穴は開かない(セッション見出しが無いログは `harness-record` が「計測対象外」と書く設計で、誤ったゼロにはならない)。カナリアと同じ「失敗してもガードが破れない」検出系 |

**doc コメント・テスト規約・import 規約は CI(層 1)へ上げた**(`frontend.yml` の `rules-check`)。
**doc コメントとテスト規約の 2 つ**は層 2・層 3 にしか無かったが、**層 2 と層 3 は同じ環境で同時に抜ける**。
リモート実行環境はクローンからやり直すので `core.hooksPath` が未設定のまま
(`postCreateCommand` は DevContainer でしか走らない)で、そこは `.claude/settings.json` の
配線が読まれないことがある環境と同じだった。実際に doc の無い宣言が main へ入っている
(`src/domains/unit/elapsed`)。層 2 の配線は `pnpm install` の `prepare` が
自動でやるようにしたが、**同じ層で再発したら層を 1 つ上げる**に従い、検査そのものも
無条件に効く層へ置いた。

### 発火しているかを確かめる(カナリア)

`hook-canary.sh` は `echo hook-canary` を必ず deny する。push の前にこれを 1 度実行すると、
silent だったフックの不発が detected に変わる。

- **deny される** → このセッションではフックが発火している
- **通ってしまう** → フック不発環境。その旨を PR 本文と `harness/records/` の記録に残す
  (実行環境ごとの統計が記録に溜まる)

実測は割れている。**同じ「リモート実行環境」でも発火する場合としない場合がある**ので、
不発を前提に設計しつつ、発火する側を捨てない(層 3 に置く価値はある)。

| 実測 | 起動元 | 結果 |
| --- | --- | --- |
| PR #192(2026-08-11) | webhook 起動 | **通ってしまった** = 不発 |
| 2026-08-14 | claude.ai/code から起動 | **deny された** = 発火 |

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
- `check-test-helper-duplication.sh` は**ブロックしない**(`additionalContext` を返すだけ)。また、見るのは**編集したファイルが絡む重複だけ**
  - 判定は「本体が一字一句同じ」に限る。似ているだけのものは見ない(偽陽性で止めない)
  - push ブロックにしなかったのは、導入時点でリポジトリに既存の重複が 13 組あったため。触っていない分まで止めると、直す気の無い違反を避けるためのエスケープハッチが増える
  - **その 13 組は #153 で 0 組にしたので、絞る理由のうち「既存分がある」は消えた。** ただし格上げは #309 で改めて判断する。検出器には引数の型注釈を本体と読み違える偽陽性が残っており(#179)、偽陽性で push が止まると同じくエスケープハッチが増えるため、#179 を先に潰す
  - **「0 組」は検出器が見える範囲での 0 組**。見えていないものが 2 つある。(1) フォルダをまたぐ重複(#179 のもう 1 つの穴)。(2) `f(props: T = {})` のように**既定引数の `{}` が宣言中で最初に現れる関数** — `body_after` がそこを本体の始まりと読むため本体が `"{}"` になり、`MIN_BODY_CHARS`(20) 未満として捨てられる。#153 で足した `renderToolbar` がこの形にあたる。どちらも #309 の判断材料
  - ファイル単位で無効化: `// @duplicate-helpers-ok`
- `check-doc-comments.sh` は**ブロックしない**(`additionalContext` を返すだけ)。また、見るのは**編集したファイルの分だけ**
  - 対象は `src/` の実装ファイルのみ(`__tests__/` / `*.stories.*` / `__stories__/` は見ない)
  - 見るのは**ファイル直下の宣言**だけ(入れ子の関数・オブジェクトのメソッドは対象外)
  - **同じファイルに同名の宣言があってそちらに doc があれば対象外**。型とコンパニオンオブジェクトが doc を共有する形(`export type Size` の下に `export const Size = {`)を偽陽性にしないため
  - ファイル単位で無効化: `// @doc-comments-ok`
- `pre-push-doc-comments.sh` は **push をブロックする**。見るのは `src/` 全体
  - 導入時点では既存の抜けが 149 件あったため「このブランチで追加した行」だけに絞っていたが、#159 でその 149 件を埋めて 0 件にしたので絞る理由が無くなった(触っていない分で止まることがなく、「止まる理由が自分の変更ではない」状態にならない)
  - **doc の有無と項目(`@param` / `@returns` / `@throws`)の両方を見る**。導入時点では項目を満たさない doc が 190 件あったため `--missing-only` で有無だけに絞っていたが、#159 でその 190 件を埋めて 0 件にしたので絞る理由が無くなった
  - ファイル単位で無効化: `// @doc-comments-ok`(PostToolUse 版と共通)
- `pre-push-typecheck.sh` / `pre-push-lint.sh` は node_modules 未インストール時(ツールが実行不能な場合)は黙ってスキップする
- `post-merge-review.sh` はマージを**ブロックしない**(`additionalContext` を返すだけ)。マージは人の判断で行われるので、記録が無いことを理由に止めても記録の質は上がらないため
  - 検知対象は `mcp__github__merge_pull_request` と `gh pr merge` のみ。素の `git merge` は見ない(ベースブランチの取り込みで日常的に走るため、拾うと誤発火のほうが多くなる)
- `.oxlintrc.json` の `overrides`(`rules/architecture.md`「依存方向のルール」の強制。`分類: layer-dependency`、#257)は、`domains/` → `libs/` の辺だけ `warn`(**ブロックしない**)。導入時点で `@/libs/document-ipc`(型のみ)・`@/libs/document-json` への import が計 5 件既に存在しており(`document-save-state` は pr-261/#257 で申し送りと決めた既知の債務、残り 3 件はテストの `DocumentJson` fixture 利用)、どちらもドメインの型・モジュール再配置を伴う判断(CLAUDE.md「設計判断の確認」)のため、この回では移動を行わない。`services/` → `features/libs/components/hooks`・`components/hooks/utils/types/` → `domains/services/features`・`libs/` → `services/features/components/hooks` の 3 方向は既存違反 0 件だったため `error` でそのまま導入した
  - `features/<x>/domains/` への同種の適用は未実装
- **feature 間の deep import・循環参照・モジュール内部への deep import**(#257 のゴール 1・2・6)は `lib/import-rule-violations.py` が見る。oxlint に置かなかったのは、3 つとも**リポジトリの構造を読まないと判定できない**ため(「自分の feature を除く」は呼び出し元のパスに依存し、循環はグラフ、deep import は「そのフォルダが `index.ts` を持つか」を要する)。`overrides.files` の静的な glob では書けない(#284 の実測では同一 feature 内のドメイン間 import まで巻き込んで 38 件の偽陽性。数値の出どころは #257 のコメント)
  - **判定の根拠はスクリプトの docstring に書いてある**(入れ子モジュールの扱い・`__tests__/` の扱い・feature だけ狭い理由)。ここに写すと片方だけ古くなるので繰り返さない
  - **ゴール 6 の実効範囲は現状ほぼ fixture 専用。** 入れ子モジュールの index を許すため、`module-public-api` に当たるのは「モジュールフォルダ配下の非 index ファイルを外から読む」形だけで、実測するとテスト・ストーリーを除いた該当ファイルは 4 件しか無い(このリポジトリが「実装は `index.ts` に直接書く」を守っているため)。**将来の退行を止める枠であって、いま何かを剥がす検査ではない**
  - **エスケープハッチは置かない。** 他の push ブロック系(`@doc-comments-ok` / `@test-rules-disable`)と違い、この検査は「その import を書いてよいか」の判定で、**ファイル単位で例外にできる性質のものではない**(例外にした瞬間そのファイルからは何でも読める)。偽陽性を避ける側で手当てしてある — コメント行は数えない・入れ子の index は通す
  - 導入時点の既存違反は 8 件(feature をまたぐ fixture の直接 import)で、テスト用の公開口を置いて 0 件にしてから `error` 相当(exit 1)で入れた

## 動作確認

```bash
# 拒否されること(deny が出力される)
echo '{"tool_input":{"command":"npx create-vite"}}' | bash .claude/hooks/block-npx.sh

# 許可されること(出力なし・exit 0)
echo '{"tool_input":{"command":"pnpm run lint"}}' | bash .claude/hooks/block-npx.sh
```

```bash
# 重複が報告されること(additionalContext が出力される)
echo '{"tool_input":{"file_path":"src/features/editor/components/property-panel/__tests__/property-panel.heading.test.tsx"}}' \
  | bash .claude/hooks/check-test-helper-duplication.sh

# 全体の重複を数える
python3 .claude/hooks/lib/duplicate-test-helpers.py --all src
```

```bash
# doc の無い宣言が報告されること(additionalContext が出力される)
echo '{"tool_input":{"file_path":"src/domains/dcmp/token/index.ts"}}' \
  | bash .claude/hooks/check-doc-comments.sh

# 全体の doc 抜けを数える
python3 .claude/hooks/lib/missing-doc-comments.py --all src

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
# カナリアが deny を返すこと(セッションで実行して通ってしまったらフック不発環境)
echo '{"tool_input":{"command":"echo hook-canary"}}' | bash .claude/hooks/hook-canary.sh

# テスト規約の全体検査(git hooks と共有。違反があれば exit 1)
bash .claude/hooks/lib/test-rules-scan.sh src

# この PR で追加された lint 抑制コメントを数える(CI と同じ判定)
bash .github/scripts/check-added-lint-suppressions.sh origin/main
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

**終了コードまで見る。** 層 1(CI の `run:`)と層 2(`pre-push` の `set -e`)は**終了コードだけが配線**なので、
標準出力の文字列しか確かめないと「無条件に落ちる」というゴールの本体が守られない。
`; echo "exit=$?"` を必ず付ける。

**probe は `.tsx` でも置く。** 解消した既存違反 8 件はすべて `.test.tsx` / `.stories.tsx` で、
`src` には `index.tsx` を持つモジュールが 40 個ある。`.ts` だけで確かめると、
拡張子の取りこぼし(`SOURCE_SUFFIXES` / `INDEX_NAMES` から `.tsx` が落ちる形)を素通りさせる。

```bash
# import 規約の全体検査(git hooks・CI と共有)
python3 .claude/hooks/lib/import-rule-violations.py src; echo "exit=$?"   # → 違反 0 件・exit=0

# 他 feature の内部を読むと落ちること(feature-public-api。importer が .tsx)
printf 'import { CanvasView } from "@/features/canvas/domains/canvas-view";\nexport const Probe = () => <p>{String(CanvasView)}</p>;\n' \
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

# feature 単位の閉路が拾えること(feature-cycle。index 経由なので import-cycle には出ない)
printf 'export { ArtboardCanvas } from "@/features/canvas";\n' > src/features/tokens/probe.ts
printf 'export { TokensPanel } from "@/features/tokens";\n' > src/features/canvas/probe.ts
python3 .claude/hooks/lib/import-rule-violations.py src; echo "exit=$?"   # → [feature-cycle] 1 件・exit=1
rm src/features/tokens/probe.ts src/features/canvas/probe.ts

# コメントに書いた import のパスで止まらないこと(doc に綴りを書く箇所があるため)
printf '// かつては import { CanvasView } from "@/features/canvas/domains/canvas-view"; と書いていた\nexport const Probe = 1;\n' \
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
