#!/usr/bin/env bash
#
# lint 抑制コメントの禁止: Edit / Write で biome-ignore / eslint-disable などの
# lint 抑制コメントを新規追加することを禁止する PreToolUse フック。
# 由来: d-market-typescript / typescript-rules-plugin の block-lint-suppress.sh
#
# 方針: lint エラーは「抑制」ではなく「コードの修正」で解決する。
# どうしても抑制が必要な場合のみ、対象ファイルに // @lint-suppress-ok を記載する。
#
# 判定そのものは lib/lint-suppressions.py。同じスクリプトを CI の
# check-added-lint-suppressions.sh が使う(フックが発火しない環境の代替 /
# .claude/hooks/README.md「強制力の序列」)。
set -euo pipefail

hook_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

input="$(cat)"
file="$(jq -r '.tool_input.file_path // .tool_input.path // empty' <<< "$input")"

# 対象は JS/TS 系ソースのみ。
case "$file" in
  *.ts|*.tsx|*.js|*.jsx) ;;
  *) exit 0 ;;
esac

# 設定・依存・フック自身などは対象外。
case "$file" in
  */.claude/*|*/node_modules/*|*/dist/*|*/src-tauri/target/*) exit 0 ;;
  .claude/*|node_modules/*|dist/*|src-tauri/target/*) exit 0 ;;
esac

# ファイルに明示的なエスケープハッチがある場合は許可。
if [ -f "$file" ] && grep -qm1 '@lint-suppress-ok' "$file" 2>/dev/null; then
  exit 0
fi

tool_name="$(jq -r '.tool_name // empty' <<< "$input")"
case "$tool_name" in
  Write) content="$(jq -r '.tool_input.content // empty' <<< "$input")" ;;
  Edit)  content="$(jq -r '.tool_input.new_string // empty' <<< "$input")" ;;
  *)     exit 0 ;;
esac

[ -z "$content" ] && exit 0

suppressions="$(printf '%s' "$content" | python3 "$hook_dir/lib/lint-suppressions.py" || true)"
[ -z "$suppressions" ] && exit 0

jq -n --arg lines "$suppressions" '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "deny",
    permissionDecisionReason: ("lint抑制コメントの追加は禁止されています。\nlintエラーは抑制ではなく、コードを修正して解決してください。\n\n検出された禁止パターン:\n" + $lines + "\n\n許可されている例外:\n- useExhaustiveDependencies / react-hooks/exhaustive-deps（useEffectマウント時）\n- noUnusedVariables / no-unused-vars（ブランド型 declare const...unique symbol の直前行のみ）\n\n上記以外で本当に必要な場合は // @lint-suppress-ok をファイルに追加してください。")
  }
}'
