#!/usr/bin/env bash
#
# push 前の doc コメント検査: git push の実行前に `src/` の実装ファイルを検査し、
# doc コメントの無い宣言と、項目の欠けた doc があれば push をブロックする PreToolUse フック。
#
# 対応する規約: rules/coding.md「コメントは doc と Why / Why not に絞る」の 1 つ目
#   「doc としての説明」と、その下の「doc に書く項目」
#
# 見るのは `src/` の実装ファイルのみ（`__tests__/` / `*.stories.*` / `__stories__/` は
# 対象外）。判定は lib/missing-doc-comments.py。
#
# 全体を見る。導入時点では既存の抜けが 149 件あったため「このブランチで追加した行」だけに
# 絞っていたが、#159 でその 149 件を埋めて 0 件にしたので、絞る理由が無くなった
# （触っていない分で止まることがないため、README.md「例外(エスケープハッチ)」が
# 記録している「止まる理由が自分の変更でない」状態にならない）。
#
# 見るのは doc の有無と項目（`@param` / `@returns` / `@throws`）の両方。導入時点では
# 項目を満たさない doc が 190 件あったため `--missing-only` で有無だけに絞っていたが、
# #159 でその 190 件を埋めて 0 件にしたので絞る理由が無くなった。
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

violations=""
while IFS= read -r file; do
  [ -f "$file" ] || continue
  grep -q '@doc-comments-ok' "$file" && continue
  result="$(python3 "$detector" "$file" || true)"
  [ -n "$result" ] || continue
  violations="${violations}${result}
"
done < <(find src -type f \( -name '*.ts' -o -name '*.tsx' \) 2>/dev/null || true)

[ -n "$violations" ] || exit 0

jq -Rn --arg msg "$violations" '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "deny",
    permissionDecisionReason: ("push 前の doc コメント検査で規約を満たさない doc が見つかったため push をブロックしました。\n\n" + $msg + "\nその関数・型・定数が何かに加え、引数は @param、戻り値は @returns、投げる例外は @throws を書いてから再度 push してください（rules/coding.md「doc に書く項目」）。\n意図して省くなら、対象ファイルに `// @doc-comments-ok` を記載します。")
  }
}'
