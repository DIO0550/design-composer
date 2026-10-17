#!/usr/bin/env bash
#
# テストヘルパーの重複検出: 編集された `__tests__/` のファイルが、プロジェクト内の
# 別のファイルと**本体が一字一句同じ**ヘルパーを持っていないかを検証し、
# AI にフィードバックする PostToolUse フック。push を止める検査は `src/` 全体を見る
# `pre-push-test-helper-duplication.sh`・`harness/githooks/pre-push`・CI（`rules-check`）が担う。
#
# 対応する規約: rules/testing.md「テスト用ヘルパーの置き場所」
#   「同じヘルパーを2つ以上のテストファイルに書いたら、その時点で共通化する」
#
# 見るのは**本体が完全に一致するもの**だけ（空白の入れ方の違いは無視）。
# 似ているだけのものは見ない。判定は lib/duplicate-test-helpers.py。
#
# ブロックしない（フィードバックのみ）。編集したファイルが絡む分だけを出す。
# 理由は README.md「例外(エスケープハッチ)」に一本化してある
# （同じ判断を 2 箇所へ書くと片方だけ古くなる）。
# 検出器が異常終了したら、止めずに「検査できていない」ことを伝える(理由は同じ節)。
set -euo pipefail

hook_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$hook_dir/lib/edit-detector.sh"
detector="$hook_dir/lib/duplicate-test-helpers.py"

input="$(cat)"
file="$(jq -r '.tool_input.file_path // .tool_input.path // empty' <<< "$input")"

[ -n "$file" ] || exit 0
[ -f "$file" ] || exit 0

# `__tests__/` の直下のみ対象（判定側も同じ条件で弾くが、python の起動を省く）
case "$(basename "$(dirname "$file")")" in
  __tests__) ;;
  *) exit 0 ;;
esac

python3_usable || exit 0

if ! report="$(detector_report '^本体が同じテストヘルパーが' "$detector" "$file")"; then
  print_edit_unchecked_context PostToolUse "テストヘルパーの重複" "$detector"
  exit 0
fi
[ -n "$report" ] || exit 0

print_additional_context PostToolUse "$report"
