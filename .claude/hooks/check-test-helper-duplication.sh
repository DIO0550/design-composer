#!/usr/bin/env bash
#
# テストヘルパーの重複検出: 編集された `__tests__/` のファイルが、同じフォルダの
# 別のファイルと**本体が一字一句同じ**ヘルパーを持っていないかを検証し、
# AI にフィードバックする PostToolUse フック。
#
# 対応する規約: rules/testing.md「テスト用ヘルパーの置き場所」
#   「同じヘルパーを2つ以上のテストファイルに書いたら、その時点で共通化する」
#
# 見るのは**本体が完全に一致するもの**だけ（空白の入れ方の違いは無視）。
# 似ているだけのものは見ない。判定は lib/duplicate-test-helpers.py。
#
# ブロックしない（フィードバックのみ）。既存の重複はリポジトリに 13 組あり、
# 触っていない分まで push を止めると、直す気の無い違反を避けるための
# エスケープハッチが増えてフック全体が信用されなくなるため
# （README.md「例外(エスケープハッチ)」）。編集したファイルが絡む分だけを出す。
#
# 無効化: 対象ファイルに `// @duplicate-helpers-ok` を記載する
set -euo pipefail

hook_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
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

grep -q '@duplicate-helpers-ok' "$file" && exit 0

command -v python3 >/dev/null 2>&1 || exit 0

report="$(python3 "$detector" "$file" || true)"
[ -n "$report" ] || exit 0

jq -Rn --arg msg "$report" '{
  hookSpecificOutput: {
    hookEventName: "PostToolUse",
    additionalContext: $msg
  }
}'
