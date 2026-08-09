#!/usr/bin/env bash
#
# push 前の doc コメント検査: git push の実行前に、**このブランチで追加した行**に載る
# 宣言へ doc コメントが付いているかを検査し、無ければ push をブロックする PreToolUse フック。
#
# 対応する規約: rules/coding.md「コメントは doc と Why / Why not に絞る」の 1 つ目
#   「doc としての説明 — その関数・型・定数が何か、引数、戻り値」
#
# 見るのは `src/` の実装ファイルのみ（`__tests__/` / `*.stories.*` / `__stories__/` は
# 対象外）。判定は lib/missing-doc-comments.py。
#
# **全体ではなく「追加した行」だけを見る。** 導入時点で既存の抜けが 73 件 / 77 件あり、
# 全体を見ると触っていない分で毎回 push が止まる。止まる理由が自分の変更でないと、
# エスケープハッチを足す運用を招いてフック全体が信用されなくなる
# （README.md「例外(エスケープハッチ)」）。今回書いたものだけを止める。
#
# 無効化: 対象ファイルに `// @doc-comments-ok` を記載する
set -euo pipefail

hook_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
detector="$hook_dir/lib/missing-doc-comments.py"

input="$(cat)"
command="$(jq -r '.tool_input.command // empty' <<< "$input")"

# git push 以外はスルー
if ! echo "$command" | grep -qE '(^|\s|[;&|])\s*git\s+push\b'; then
  exit 0
fi

command -v python3 >/dev/null 2>&1 || exit 0
command -v git >/dev/null 2>&1 || exit 0

cd "${CLAUDE_PROJECT_DIR:-$PWD}"

# 比較の起点。既定ブランチが取れない環境（クローン直後・detached など）では検査しない。
base="$(git merge-base origin/main HEAD 2>/dev/null || true)"
[ -n "$base" ] || exit 0

# `@@ -a,b +c,d @@` から、追加された行の番号を取り出す。
added_lines() {
  git diff --unified=0 "$base" -- "$1" 2>/dev/null | awk '
    /^@@/ {
      split($3, plus, ",")
      start = substr(plus[1], 2) + 0
      count = (length(plus) > 1) ? plus[2] + 0 : 1
      for (i = 0; i < count; i++) print start + i
    }' | paste -sd, -
}

violations=""
while IFS= read -r file; do
  [ -f "$file" ] || continue
  grep -q '@doc-comments-ok' "$file" && continue
  lines="$(added_lines "$file")"
  [ -n "$lines" ] || continue
  result="$(python3 "$detector" --lines "$lines" "$file" || true)"
  [ -n "$result" ] || continue
  violations="${violations}${result}
"
done < <(git diff --name-only --diff-filter=d "$base" -- 'src/*.ts' 'src/*.tsx' 2>/dev/null || true)

[ -n "$violations" ] || exit 0

jq -Rn --arg msg "$violations" '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "deny",
    permissionDecisionReason: ("push 前の doc コメント検査で、このブランチで追加した宣言に doc の無いものが見つかったため push をブロックしました。\n\n" + $msg + "\nその関数・型・定数が何か、引数、戻り値を 1〜2 行で書いてから再度 push してください（rules/coding.md「コメントは doc と Why / Why not に絞る」）。\n意図して省くなら、対象ファイルに `// @doc-comments-ok` を記載します。")
  }
}'
