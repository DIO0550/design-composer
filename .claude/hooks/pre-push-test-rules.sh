#!/usr/bin/env bash
#
# push 前の全体テストルール検査: git の push の実行前に全テストファイルを
# rules/testing.md の規約で検査し、違反があれば push をブロックする PreToolUse フック。
# 由来: d-market-typescript / typescript-rules-plugin の pre-push-test-rules.sh
#
# 検査そのものは lib/test-rules-scan.sh。同じスクリプトを harness/githooks/pre-push が
# 実行環境に依存しない最終網として使う(.claude/hooks/README.md「強制力の序列」)。
set -euo pipefail

hook_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# --- stdin から Bash コマンドを取得 ---
input="$(cat)"
command="$(jq -r '.tool_input.command // empty' <<< "$input")"

# push 以外はスルー
if ! echo "$command" | grep -qE '(^|\s|[;&|])\s*git\s+push\b'; then
  exit 0
fi

violations="$(bash "$hook_dir/lib/test-rules-scan.sh" "${CLAUDE_PROJECT_DIR:-$PWD}" || true)"

if [ -n "$violations" ]; then
  jq -Rn --arg msg "$violations" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: ("push 前の全体テストルール検査で違反が検出されたため push をブロックしました。以下の違反をすべて修正してから再度 push してください。\n\n" + $msg + "\nルール: フラット構造（describeなし）、テストケース内の条件分岐禁止（test.eachを使用）、ファイル名は {対象名}.{カテゴリ}.test.ts|tsx")
    }
  }'
fi
