#!/usr/bin/env bash
#
# push 前の検査フック（PreToolUse）の共通部分。`git push` のときだけ検出器を走らせ、
# 違反があれば deny の JSON を返す。
#
# 使う側:
#   - .claude/hooks/pre-push-import-rules.sh
#   - .claude/hooks/pre-push-result-option-reads.sh
#
# 使い方: source したうえで `deny_on_violations <検出器> <検査の名前> <直し方の一文>`。
# 標準入力（フックへ渡される JSON）はこの関数が読む。

# 違反があれば deny の JSON を標準出力へ書く。
#
# $1 検出器のパス（`src` を引数に取り、違反があれば `[種別]` で始まる行を出すもの）
# $2 検査の名前（deny のメッセージに入る）
# $3 直し方の一文（deny のメッセージの末尾に付ける）
deny_on_violations() {
  local detector="$1" label="$2" guidance="$3"
  local input command violations

  input="$(cat)"
  command="$(jq -r '.tool_input.command // empty' <<< "$input")"

  # git push 以外はスルー
  echo "$command" | grep -qE '(^|\s|[;&|])\s*git\s+push\b' || return 0

  command -v python3 >/dev/null 2>&1 || return 0

  cd "${CLAUDE_PROJECT_DIR:-$PWD}" || return 0

  violations="$(python3 "$detector" src || true)"
  echo "$violations" | grep -q '^\[' || return 0

  jq -Rn --arg msg "$violations" --arg label "$label" --arg guidance "$guidance" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: ("push 前の検査（" + $label + "）で違反が見つかったため push をブロックしました。\n\n" + $msg + "\n" + $guidance)
    }
  }'
}
