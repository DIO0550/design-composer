#!/usr/bin/env bash
#
# 編集時の検査フック（Edit / Write）の共通部分。検出器が異常終了したときに、編集を止めずに
# 「検査できていない」ことを編集した側へ伝える。
#
# 使う側: .claude/hooks/block-lint-suppress.sh（PreToolUse）/ check-doc-comments.sh /
#   check-test-helper-duplication.sh（PostToolUse）
#
# 使い方: source したうえで、`python3_usable` で疎通を見てから検出器を `detector_report` で走らせ、
# 1 が返ったら `print_unchecked_context` を呼んで exit 0。
#
# python3 の疎通と検出器の異常終了の見方は、層 1・2 の `check-added-*` と層 3 の
# `pre-push-detector.sh` と同じスクリプトを使う。自分の位置から辿るのは、判定表が
# フックを一時ディレクトリへ写して走らせるため。
#
# `detector-report.sh` の `exit_unchecked` は使わない。exit 2 は PreToolUse では編集の拒否になる。
edit_detector_lib_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../.github/scripts/lib" && pwd)"
source "$edit_detector_lib_dir/detector-precondition.sh"
source "$edit_detector_lib_dir/detector-report.sh"

# 検出器が異常終了して検査できていないことを、`permissionDecision` を付けない
# `additionalContext` の JSON として標準出力へ書く。
#
# ファイル名と再現コマンドは入れない。block-lint-suppress は編集内容を標準入力で渡すので
# `python3 <検出器> <ファイル>` では再現できず、対象は直前に編集した側が知っている。
#
# @param 1 フックのイベント名(`PreToolUse` / `PostToolUse`)
# @param 2 検査の名前
# @param 3 検出器のパス
print_unchecked_context() {
  local event="$1" check="$2" detector="$3"
  jq -n --arg event "$event" \
    --arg message "${check}の検出器 ${detector} が異常終了したため、この編集は検査できていません(違反が無かったとは限りません)。" \
    '{hookSpecificOutput: {hookEventName: $event, additionalContext: $message}}'
}
