#!/usr/bin/env bash
#
# フックのカナリア: `echo hook-canary` を必ず deny する PreToolUse フック。
#
# Claude Code のフックは発火しない実行環境があり、しかも**フェイルオープンかつ
# サイレント**なので、「通った」のか「検査されなかった」のかが区別できない
# (.claude/hooks/README.md「フックが発火しない実行環境がある」)。
# 意図的に必ず止まるコマンドを 1 つ置くことで、silent を detected に変える。
#
# 使い方: push の前に `echo hook-canary` を実行する。
#   - deny される → このセッションではフックが発火している
#   - 通ってしまう → フック不発環境。push 前の検査は git hooks / CI だけが効いている
set -euo pipefail

input="$(cat)"
command="$(jq -r '.tool_input.command // empty' <<< "$input")"

# 対象は「カナリアを実行するコマンドそのもの」だけに絞る。`hook-canary` を含むだけで
# 止めると、この名前に言及するコミットメッセージや grep まで deny される
# (README「誤検知で止まるフックは、エスケープハッチを足す運用を招いて全体が信用されなくなる」)。
echo "$command" | grep -qE "^[[:space:]]*echo[[:space:]]+[\"']?hook-canary[\"']?[[:space:]]*$" || exit 0

jq -n '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "deny",
    permissionDecisionReason: "カナリアです。このセッションでは Claude Code のフックが発火しています（PreToolUse / PostToolUse とも配線どおりに動く前提で進めてよい）。実行する必要はありません。"
  }
}'
