#!/usr/bin/env bash
#
# doc コメントの検証: 編集された `src/` の実装ファイルに、doc コメントの無い宣言が
# 無いかを検証し、AI にフィードバックする PostToolUse フック。
#
# 対応する規約: rules/coding.md「コメントは doc と Why / Why not に絞る」の 1 つ目
#   「doc としての説明 — その関数・型・定数が何か、引数、戻り値」
#
# 見るのは**ファイル直下の宣言**だけ（入れ子の関数・メソッドは対象外）。
# 同じファイルに同名の宣言があってそちらに doc があれば対象外にする
# （型とコンパニオンオブジェクトが doc を共有する形を偽陽性にしないため）。
# 判定は lib/missing-doc-comments.py。
#
# ブロックしない（フィードバックのみ）。導入時点で既存の違反が 73 件（ファイル直下の
# function）/ 77 件（export された宣言）あり、触っていない分まで push を止めると、
# 直す気の無い違反を避けるためのエスケープハッチが増えてフック全体が信用されなくなる
# （README.md「例外(エスケープハッチ)」）。編集したファイルの分だけを出す。
#
# 無効化: 対象ファイルに `// @doc-comments-ok` を記載する
set -euo pipefail

hook_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
detector="$hook_dir/lib/missing-doc-comments.py"

input="$(cat)"
file="$(jq -r '.tool_input.file_path // .tool_input.path // empty' <<< "$input")"

[ -n "$file" ] || exit 0
[ -f "$file" ] || exit 0

# `src/` の実装ファイルのみ対象（判定側も同じ条件で弾くが、python の起動を省く）
case "$file" in
  *"/src/"*|src/*) ;;
  *) exit 0 ;;
esac

grep -q '@doc-comments-ok' "$file" && exit 0

command -v python3 >/dev/null 2>&1 || exit 0

report="$(python3 "$detector" "$file" || true)"
[ -n "$report" ] || exit 0

jq -Rn --arg msg "$report" '{
  hookSpecificOutput: {
    hookEventName: "PostToolUse",
    additionalContext: $msg
  }
}'
