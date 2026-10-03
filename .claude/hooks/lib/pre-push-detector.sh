#!/usr/bin/env bash
#
# push 前の検査フック（PreToolUse）の共通部分。`git push` のときだけ検出器を走らせ、
# 違反があれば deny の JSON を返す。
#
# 使う側:
#   - deny_on_violations: .claude/hooks/pre-push-import-rules.sh /
#     pre-push-result-option-reads.sh / pre-push-story-titles.sh / pre-push-named-paths.sh
#   - deny_on_all_src_failure: .claude/hooks/pre-push-doc-comments.sh /
#     pre-push-test-helper-duplication.sh
#
# 使い方: source したうえで `<関数> <検出器> <検査の名前> <直し方の一文>`。
# 標準入力（フックへ渡される JSON）は関数が読む。

# 標準入力の JSON が `git push` のコマンドなら 0、それ以外なら 1 を返す。
is_git_push_input() {
  local input command
  input="$(cat)"
  command="$(jq -r '.tool_input.command // empty' <<< "$input")"
  echo "$command" | grep -qE '(^|\s|[;&|])\s*git\s+push\b'
}

# deny の JSON を標準出力へ書く。
#
# $1 検査の名前
# $2 検出器の報告
# $3 直し方の一文
print_push_deny() {
  local label="$1" violations="$2" guidance="$3"
  jq -Rn --arg msg "$violations" --arg label "$label" --arg guidance "$guidance" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: ("push 前の検査（" + $label + "）で違反が見つかったため push をブロックしました。\n\n" + $msg + "\n" + $guidance)
    }
  }'
}

# 違反があれば deny の JSON を標準出力へ書く。
#
# $1 検出器のパス（引数なしで走らせたとき、違反があれば `[種別]` で始まる行を出すもの。
#    走査ルートは検出器が自分で決める: src/ の TypeScript を見るものは `src`、説明の中の
#    綴りを見るものはリポジトリルート）
# $2 検査の名前（deny のメッセージに入る）
# $3 直し方の一文（deny のメッセージの末尾に付ける）
deny_on_violations() {
  local detector="$1" label="$2" guidance="$3"
  local violations

  # git push 以外はスルー
  is_git_push_input || return 0

  command -v python3 >/dev/null 2>&1 || return 0

  cd "${CLAUDE_PROJECT_DIR:-$PWD}" || return 0

  violations="$(python3 "$detector" || true)"
  echo "$violations" | grep -q '^\[' || return 0

  print_push_deny "$label" "$violations" "$guidance"
}

# 検出器を `--all src` で走らせ、終了コードが 0 でなければ deny の JSON を標準出力へ書く。
# CI（`rules-check`）・`harness/githooks/pre-push` と同じ呼び方にそろえる。
#
# $1 検出器のパス（`--all <ルート>` を受け、違反があれば報告して 0 以外で終わるもの。
#    報告の綴りは問わない）
# $2 検査の名前（deny のメッセージに入る）
# $3 直し方の一文（deny のメッセージの末尾に付ける）
deny_on_all_src_failure() {
  local detector="$1" label="$2" guidance="$3"
  local violations

  # git push 以外はスルー
  is_git_push_input || return 0

  command -v python3 >/dev/null 2>&1 || return 0

  cd "${CLAUDE_PROJECT_DIR:-$PWD}" || return 0

  violations="$(python3 "$detector" --all src)" && return 0

  print_push_deny "$label" "$violations" "$guidance"
}
