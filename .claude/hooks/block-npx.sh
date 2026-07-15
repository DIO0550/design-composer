#!/usr/bin/env bash
#
# npx / pnpm dlx の使用禁止: 未インストールパッケージの即時実行を拒否する PreToolUse フック。
# 由来: d-market-typescript / typescript-rules-plugin の block-npx.sh
#
# 方針: パッケージマネージャは pnpm。パッケージは pnpm add でインストールしてから使用する。
#
# 入力: stdin に { "tool_input": { "command": "..." } } を含む JSON (Bash ツール呼び出し)
# 出力: 違反時に permissionDecision=deny の JSON を返す。問題なければ exit 0。
set -euo pipefail

input="$(cat)"
command="$(jq -r '.tool_input.command // empty' <<< "$input")"

[ -z "$command" ] && exit 0

if echo "$command" | grep -qE '(^|[[:space:]]|[;&|(])(npx|pnpm[[:space:]]+dlx)\b'; then
  jq -n '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: "npx および pnpm dlx の使用は禁止されています。パッケージは pnpm add でインストールしてから使用してください。"
    }
  }'
fi

exit 0
