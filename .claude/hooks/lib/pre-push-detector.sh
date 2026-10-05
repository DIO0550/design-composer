#!/usr/bin/env bash
#
# push 前の検査フック（PreToolUse）の共通部分。`git push` のときだけ検出器を走らせ、
# 違反があれば deny の JSON を返す（`deny_on_violations` は検出器が異常終了したときも）。
#
# 使う側:
#   - deny_on_violations: .claude/hooks/pre-push-import-rules.sh /
#     pre-push-result-option-reads.sh / pre-push-story-titles.sh / pre-push-named-paths.sh
#   - deny_on_all_src_failure: .claude/hooks/pre-push-doc-comments.sh /
#     pre-push-test-helper-duplication.sh
#
# 使い方: source したうえで `<関数> <検出器> <検査の名前> <直し方の一文>`。
# 標準入力（フックへ渡される JSON）は関数が読む。
#
# python3 の疎通(両方の関数)と検出器の異常終了(`deny_on_violations`)の見方は、層 1・2 の
# `check-added-*` と同じスクリプトを使う。自分の位置から辿るのは、判定表が
# `CLAUDE_PROJECT_DIR` を一時ディレクトリへ向けるため。
detector_lib_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.github/scripts/lib" && pwd)"
source "$detector_lib_dir/detector-precondition.sh"
source "$detector_lib_dir/detector-report.sh"

# 標準入力の JSON が `git push` のコマンドなら 0、それ以外なら 1 を返す。
is_git_push_input() {
  local input command
  input="$(cat)"
  command="$(jq -r '.tool_input.command // empty' <<< "$input")"
  echo "$command" | grep -qE '(^|\s|[;&|])\s*git\s+push\b'
}

# deny の JSON を標準出力へ書く。
#
# $1 deny の理由
print_deny() {
  printf '%s' "$1" | jq -Rs '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: .
    }
  }'
}

# 違反が見つかったときの deny の JSON を標準出力へ書く。
#
# $1 検査の名前
# $2 検出器の報告
# $3 直し方の一文
print_push_deny() {
  local label="$1" violations="$2" guidance="$3"
  print_deny "push 前の検査（${label}）で違反が見つかったため push をブロックしました。

${violations}
${guidance}"
}

# 検出器が異常終了したときの deny の JSON を標準出力へ書く。
#
# $1 検査の名前
# $2 検出器のパス
# $3 検出器を走らせたディレクトリ
print_push_unchecked_deny() {
  local label="$1" detector="$2" project_dir="$3"
  print_deny "push 前の検査（${label}）の検出器が異常終了したため、検査できませんでした。検査していないものを通さないよう push をブロックしました。

\`cd ${project_dir} && python3 ${detector}\` を走らせて、検出器が落ちた原因を直してください。"
}

# 違反があれば、または検出器が異常終了したら、deny の JSON を標準出力へ書く。
#
# $1 検出器のパス（引数なしで走らせたとき、違反があれば `[種別]` で始まる行を出して
#    exit 1、無ければ exit 0 で終わるもの。走査ルートは検出器が自分で決める: src/ の
#    TypeScript を見るものは `src`、説明の中の綴りを見るものはリポジトリルート）
# $2 検査の名前（deny のメッセージに入る）
# $3 直し方の一文（deny のメッセージの末尾に付ける）
deny_on_violations() {
  local detector="$1" label="$2" guidance="$3"
  local violations

  # git push 以外はスルー
  is_git_push_input || return 0

  python3_usable || return 0

  cd "${CLAUDE_PROJECT_DIR:-$PWD}" || return 0

  if ! violations="$(detector_report '^\[' "$detector")"; then
    print_push_unchecked_deny "$label" "$detector" "$PWD"
    return 0
  fi
  grep -q '^\[' <<<"$violations" || return 0

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

  python3_usable || return 0

  cd "${CLAUDE_PROJECT_DIR:-$PWD}" || return 0

  violations="$(python3 "$detector" --all src)" && return 0

  print_push_deny "$label" "$violations" "$guidance"
}
