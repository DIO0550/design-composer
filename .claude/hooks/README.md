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
| `check-test-rules.sh`    | `PostToolUse` (Edit/Write) | **テスト規約検証**(rules/testing.md)。describe 禁止・テストケース内の条件分岐禁止・命名規則をチェック |
| `pre-push-typecheck.sh`  | `PreToolUse` (Bash)       | **push 前の型チェック**。`pnpm run typecheck`(tsc -b)でエラーがあれば push をブロック    |
| `pre-push-lint.sh`       | `PreToolUse` (Bash)       | **push 前の全体 lint**。oxlint / Biome のエラーがあれば push をブロック                   |
| `pre-push-test-rules.sh` | `PreToolUse` (Bash)       | **push 前の全体テスト規約検査**。全 `*.test.ts(x)` を検査し違反があれば push をブロック   |
| `check-test-helper-duplication.sh` | `PostToolUse` (Edit/Write) | **テストヘルパーの重複検出**(rules/testing.md「テスト用ヘルパーの置き場所」)。同じ `__tests__/` に本体が一字一句同じヘルパーが 2 つ以上あれば知らせる |
| `post-merge-review.sh`   | `PostToolUse` (Bash/MCP)  | **マージ後の振り返りの提示**。PR のマージを検知し、Issue への追記と評価の記録を促す       |

## 移植元から見送ったもの

- `check-jsdoc-rules.sh` / `pre-push-jsdoc.sh` — JSDoc 必須ルールはこのリポジトリの規約に存在しないため
- `require-skill-before-edit.sh` / `record-skill-fired.sh` — typescript-rules-plugin 固有のスキルに依存するスキルゲートのため

## 配線

[`.claude/settings.json`](../settings.json) の `hooks.PreToolUse` / `hooks.PostToolUse` から参照。
パスは `$CLAUDE_PROJECT_DIR` 基準。

`lib/` はフック本体からのみ読む共有部品の置き場。`settings.json` からは参照しない。

| ファイル | 使う側 | 内容 |
| --- | --- | --- |
| `lib/test-conditionals.awk` | `check-test-rules.sh` / `pre-push-test-rules.sh` | `test()` / `it()` ブロック内の `if` / `else` / `switch` を行番号付きで出力する |
| `lib/duplicate-test-helpers.py` | `check-test-helper-duplication.sh` | `__tests__/` の中で本体が完全に一致するヘルパーを探す。`--all` で全体を検査できる |

## 例外(エスケープハッチ)

- `block-lint-suppress.sh` は以下を許可する:
  - `useExhaustiveDependencies` / `react-hooks/exhaustive-deps`(useEffect マウント時)
  - `noUnusedVariables` / `no-unused-vars`(ブランド型 `declare const ... unique symbol` の直前行のみ)
  - 対象ファイルに `// @lint-suppress-ok` を記載した場合(本当に必要なときのみ)
- テスト規約チェックの「条件分岐禁止」が見るのは **`test()` / `it()` のブロック内だけ**(`lib/test-conditionals.awk`)。セットアップやファクトリなどヘルパー関数内の分岐は対象外
  - `rules/testing.md` が禁じているのは「テストケースが入力によって形を変える」ことであって、セットアップの分岐ではないため
  - ファイル全体を見ていた頃は、テストが1件も分岐していないファイルでもヘルパーの1行で push が止まっていた。誤検知で止まるフックは、エスケープハッチを足す運用を招いて全体が信用されなくなる
- テスト規約チェック(`check-test-rules.sh` / `pre-push-test-rules.sh`)は以下で個別に無効化できる:
  - ファイル単位: `// @test-rules-disable [no-describe|no-conditional|file-naming ...]`(引数なしで全ルール無効化)
  - プロジェクト単位: 最寄りの `.test-rules.yml` に `<ルール名>: false` を記載
- `check-test-helper-duplication.sh` は**ブロックしない**(`additionalContext` を返すだけ)。また、見るのは**編集したファイルが絡む重複だけ**
  - 判定は「本体が一字一句同じ」に限る。似ているだけのものは見ない(偽陽性で止めない)
  - push ブロックにしなかったのは、導入時点でリポジトリに既存の重複が 13 組あったため。触っていない分まで止めると、直す気の無い違反を避けるためのエスケープハッチが増える(既存分の解消は #153)
  - ファイル単位で無効化: `// @duplicate-helpers-ok`
- `pre-push-typecheck.sh` / `pre-push-lint.sh` は node_modules 未インストール時(ツールが実行不能な場合)は黙ってスキップする
- `post-merge-review.sh` はマージを**ブロックしない**(`additionalContext` を返すだけ)。マージは人の判断で行われるので、記録が無いことを理由に止めても記録の質は上がらないため
  - 検知対象は `mcp__github__merge_pull_request` と `gh pr merge` のみ。素の `git merge` は見ない(ベースブランチの取り込みで日常的に走るため、拾うと誤発火のほうが多くなる)

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
| `.claude/skills/harness-growth/`      | マージ後の評価記録と、規約 / フックの改善(`harness/records/`)   |

`post-merge-review.sh` はこの2つのスキルへの入口として働く。
