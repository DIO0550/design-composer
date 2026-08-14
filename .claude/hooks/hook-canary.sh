#!/usr/bin/env bash
#
# フックのカナリア: `echo hook-canary` を必ず deny する PreToolUse フック。
#
# Claude Code のフックは発火しない実行環境があり、しかも**フェイルオープンかつ
# サイレント**なので、「通った」のか「検査されなかった」のかが区別できない
# (.claude/hooks/README.md「フックが発火しない実行環境がある」)。
# 意図的に必ず止まるコマンドを 1 つ置くことで、silent を detected に変える。
#
# **外部コマンドに依存しない。** PreToolUse は exit 2 以外の異常終了を「非ブロックの
# エラー」として素通りさせるので、jq の無い環境ではフックが exit 127 で終わって
# 配線が読まれていない場合とまったく同じ見え方になる。カナリア自身がそれで落ちると
# 「フックは動いていたのに不発と報告する」ことになり、検出の意味が消える。
# そのため判定と出力は bash の組み込みだけで完結させ、jq は在れば使う程度に留める。
#
# 使い方: push の前に `echo hook-canary` を実行する。
#   - deny される → このセッションではフックが発火している
#   - 通ってしまう → フック不発環境。push 前の検査は git hooks / CI だけが効いている
set -uo pipefail

input="$(cat)"

# `.tool_input.command` を取り出す。jq が無い / 失敗した場合は生の JSON から読む。
# 後者は最初の `"` までを値と見るため `echo "hook-canary"` は取りこぼすが、カナリアの
# 使い方は `echo hook-canary` なので、取りこぼす側へ倒して誤検知を避ける。
command_text=""
if command -v jq >/dev/null 2>&1; then
  command_text="$(jq -r '.tool_input.command // empty' <<< "$input" 2>/dev/null || true)"
fi
if [ -z "$command_text" ]; then
  raw_command_pattern='"command"[[:space:]]*:[[:space:]]*"([^"]*)"'
  if [[ "$input" =~ $raw_command_pattern ]]; then
    command_text="${BASH_REMATCH[1]}"
  fi
fi

# 対象は「カナリアを実行するコマンドそのもの」だけに絞る。`hook-canary` を含むだけで
# 止めると、この名前に言及するコミットメッセージや grep まで deny される
# (README「誤検知で止まるフックは、エスケープハッチを足す運用を招いて全体が信用されなくなる」)。
canary_pattern="^[[:space:]]*echo[[:space:]]+['\"]?hook-canary['\"]?[[:space:]]*\$"
[[ "$command_text" =~ $canary_pattern ]] || exit 0

# 他のフックは jq / python3 を使う。カナリアが通っても、それらが無ければ同じ
# フェイルオープンで黙って素通りするので、欠けているものをここで名指しする。
missing=""
command -v jq >/dev/null 2>&1 || missing="${missing} jq"
command -v python3 >/dev/null 2>&1 || missing="${missing} python3"

reason="カナリアです。このセッションでは Claude Code のフックが発火しています（PreToolUse / PostToolUse とも配線どおりに動く前提で進めてよい）。実行する必要はありません。"
if [ -n "$missing" ]; then
  reason="${reason} ただし、他のフックが使う次のコマンドがこの環境にありません:${missing}。これらを使うフックは異常終了して素通りするため、push 前の検査は git hooks / CI に頼ること。"
fi

# jq -n を使わない(jq の有無で出力できなくなるため)。reason には引用符・改行・
# バックスラッシュを入れないので、この組み立てで JSON として妥当になる。
cat <<JSON
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "${reason}"
  }
}
JSON
