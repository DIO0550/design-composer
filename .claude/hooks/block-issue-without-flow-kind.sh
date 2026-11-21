#!/usr/bin/env bash
#
# Issue を作る呼び出し(`gh issue create` / `gh api` の issues への POST / `mcp__github__issue_write` の create)が、
# 作業の種類を決めていなければ拒否する PreToolUse フック(`implementation-flow` フェーズ 1「種類の確定」の手順 4)。
#
# 何を満たせば通すか・どの形を作成とみなすか・行の書式は、検出器 lib/issue-flow-kind-violations.py の
# docstring と定数だけが持つ。ここは入力を渡して、報告を deny の JSON にするだけ。
#
# python3 が使えなければ通し、検出器が異常終了したら止める(`lib/pre-push-detector.sh` の `deny_on_violations` と同じ非対称)。
set -uo pipefail

hook_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
detector_lib_dir="$(cd "$hook_dir/../../.github/scripts/lib" && pwd)"
source "$detector_lib_dir/detector-precondition.sh"
source "$detector_lib_dir/detector-report.sh"
detector="$hook_dir/lib/issue-flow-kind-violations.py"

# deny の JSON を標準出力へ書く。jq の無い環境では exit 127 で素通りになるので、`lib/pre-push-detector.sh` の
# jq 版には寄せずに python3 で組む。
#
# $1 deny の理由
print_deny() {
  printf '%s' "$1" | python3 -c '
import json, sys
reason = sys.stdin.read()
print(json.dumps({"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "deny", "permissionDecisionReason": reason}}, ensure_ascii=False))
'
}

input="$(cat)"

# 作成の入力は、どの形でも `issue` を含む(ツール名・サブコマンド・エンドポイント)。検出器より広く絞り、
# 無関係な呼び出しで python3 を起動しない。
[[ "$input" == *issue* ]] || exit 0

python3_usable || exit 0

origin_url="$(git -C "$hook_dir/../.." remote get-url origin 2>/dev/null || true)"

if ! report="$(printf '%s' "$input" | detector_report '^\[' "$detector" --origin-url "$origin_url" 2>/dev/null)"; then
  print_deny "Issue の作業の種類の検査(${detector})が異常終了したため、検査できませんでした。検査していない作成を通さないよう止めました。

標準入力にこの呼び出しの PreToolUse の JSON を渡して \`python3 ${detector} --origin-url <origin の URL>\` を走らせ、検出器が落ちた原因を直してください。"
  exit 0
fi
grep -q '^\[' <<<"$report" || exit 0

print_deny "Issue を作る呼び出しが作業の種類を決めていないため、止めました。

${report}"
