#!/usr/bin/env bash
#
# push 前の import 規約検査: git push の実行前に `src/` の import を走査し、公開 API を
# 迂回する import と循環参照があれば push をブロックする PreToolUse フック。
#
# 対応する規約: rules/architecture.md「モジュールの公開API」「依存方向のルール」のうち、
#   import グラフを組まないと判定できないもの（feature 間の公開口・モジュール内部への
#   deep import・循環）。層と方向の対は .oxlintrc.json の no-restricted-imports が見る。
#
# 判定は lib/import-rule-violations.py。1 ファイルずつではなく `src/` 全体を 1 度だけ
# 走査する（循環はグラフ全体を組まないと判定できないため）。
set -euo pipefail

hook_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
detector="$hook_dir/lib/import-rule-violations.py"

input="$(cat)"
command="$(jq -r '.tool_input.command // empty' <<< "$input")"

# git push 以外はスルー
if ! echo "$command" | grep -qE '(^|\s|[;&|])\s*git\s+push\b'; then
  exit 0
fi

command -v python3 >/dev/null 2>&1 || exit 0

cd "${CLAUDE_PROJECT_DIR:-$PWD}"

violations="$(python3 "$detector" src || true)"
echo "$violations" | grep -q '^\[' || exit 0

jq -Rn --arg msg "$violations" '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "deny",
    permissionDecisionReason: ("push 前の import 規約検査で違反が見つかったため push をブロックしました。\n\n" + $msg + "\nフォルダ外部からの import は index.ts 経由にし、他 feature は公開口（features/<x>/index.ts、テストは __tests__/index.ts）だけを読んでください（rules/architecture.md「モジュールの公開API」「依存方向のルール」）。")
  }
}'
