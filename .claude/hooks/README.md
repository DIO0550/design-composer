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
| `check-doc-comments.sh`  | `PostToolUse` (Edit/Write) | **doc コメントの検証**(rules/coding.md「コメントは doc と Why / Why not に絞る」)。doc の無い宣言と、`@param` / `@returns` / `@throws` が欠けた doc を知らせる |
| `pre-push-doc-comments.sh` | `PreToolUse` (Bash)     | **push 前の doc コメント検査**。`src/` に doc の無い宣言、または `@param` / `@returns` / `@throws` の欠けた doc があれば push をブロック |
| `post-merge-review.sh`   | `PostToolUse` (Bash/MCP)  | **マージ後の振り返りの提示**。PR のマージを検知し、Issue への追記と評価の記録を促す       |

## 移植元から見送ったもの

- `require-skill-before-edit.sh` / `record-skill-fired.sh` — typescript-rules-plugin 固有のスキルに依存するスキルゲートのため

### 見送りを取り消したもの

- `check-jsdoc-rules.sh` / `pre-push-jsdoc.sh` — 「JSDoc 必須ルールはこのリポジトリの規約に存在しない」を理由に見送っていたが、**その前提は PR #152 で `rules/coding.md`「コメントは doc と Why / Why not に絞る」が入った時点で消えていた**。見送りの判断が更新されないまま残り、PR #157 で doc の無い関数がレビューまで残った(#157 のレビュー / `harness/records/pr-157.md`)。移植元をそのまま戻すのではなく、このリポジトリの形(型とコンパニオンオブジェクトが doc を共有する)に合わせた `check-doc-comments.sh` を書いた
- **規約が増えたら、それを理由に見送ったフックを見直す。** 見送りの理由は「今の規約に無いから」であることが多く、規約が変わると理由ごと消える

## 配線

[`.claude/settings.json`](../settings.json) の `hooks.PreToolUse` / `hooks.PostToolUse` から参照。
パスは `$CLAUDE_PROJECT_DIR` 基準。

`lib/` はフック本体からのみ読む共有部品の置き場。`settings.json` からは参照しない。

| ファイル | 使う側 | 内容 |
| --- | --- | --- |
| `lib/test-conditionals.awk` | `check-test-rules.sh` / `pre-push-test-rules.sh` | `test()` / `it()` ブロック内の `if` / `else` / `switch` を行番号付きで出力する |
| `lib/duplicate-test-helpers.py` | `check-test-helper-duplication.sh` | `__tests__/` の中で本体が完全に一致するヘルパーを探す。`--all` で全体を検査できる |
| `lib/missing-doc-comments.py` | `check-doc-comments.sh` / `pre-push-doc-comments.sh` | `src/` のファイル直下の宣言のうち doc コメントの無いものを探す。`--all` で全体を検査できる |

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
echo '{"tool_input":{"file_path":"src/domains/token/index.ts"}}' \
  | bash .claude/hooks/check-doc-comments.sh

# 全体の doc 抜けを数える
python3 .claude/hooks/lib/missing-doc-comments.py --all src

# push がブロックされること(deny が出力される。doc 無しの宣言があるとき)
echo '{"tool_input":{"command":"git push"}}' \
  | bash .claude/hooks/pre-push-doc-comments.sh
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
