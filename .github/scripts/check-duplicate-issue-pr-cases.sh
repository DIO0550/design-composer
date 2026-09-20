#!/usr/bin/env bash
#
# `check-duplicate-issue-pr.sh` の判定表。問い合わせ結果を模した JSON を食わせ、
# 「重複を拾うか」を 1 コマンドで確かめる(`check-pr-closing-issue-cases.sh` に倣う)。
#
# 使い方: bash .github/scripts/check-duplicate-issue-pr-cases.sh
# 出力が `ok` だけなら期待どおり。`NG` が 1 行でも出たら判定が変わっている。
#
# **再発の実例で再生する。** `harness/records/pr-604.md` 指摘 1 / `pr-605.md` 指摘 1 は、
# それぞれ Issue #595 / #600 を 2 つの PR(#602 と #604、#601 と #605)が並行して閉じ、
# 気づくまでに実装・レビュー・PR 作成が終わっていた実例。この判定表はその状態
# (両方 open だったときの形)を JSON で再現し、検出器が捕まえることを確かめる。
# 両 Issue とも現在はマージ済みで片方が closed になっているため、GitHub への実際の
# 問い合わせでは当時の状態を再現できない。
set -uo pipefail

script="$(dirname "$0")/check-duplicate-issue-pr.sh"
failed=0

# 問い合わせ結果を組み立てる。この PR が閉じる Issue と、他の open な PR の一覧を差し替える
result_json() {
  jq -n --argjson closing "$1" --argjson others "$2" '{
    data: { repository: {
      pullRequest: { closingIssuesReferences: { nodes: $closing } },
      pullRequests: { nodes: $others }
    } }
  }'
}

run_case() {
  local expected="$1" self="$2" closing="$3" others="$4" label="$5"
  local json actual

  json="$(mktemp)"
  result_json "$closing" "$others" >"$json"
  actual="$(PR_NUMBER="$self" bash "$script" "$json" 2>&1)"
  rm -f "$json"

  if [ "$actual" = "$expected" ]; then
    printf 'ok   %s\n' "$label"
    return
  fi
  printf 'NG   実際=%s (期待 %s)  %s\n' "$actual" "$expected" "$label"
  failed=1
}

no_closing='[]'
issue_595='[{"number":595}]'
issue_600='[{"number":600}]'

no_others='[]'
self_only='[{"number":604,"closingIssuesReferences":{"nodes":[{"number":595}]}}]'
unrelated='[{"number":610,"closingIssuesReferences":{"nodes":[{"number":700}]}}]'
duplicate_595='[{"number":602,"closingIssuesReferences":{"nodes":[{"number":595}]}}]'
duplicate_600='[{"number":601,"closingIssuesReferences":{"nodes":[{"number":600}]}}]'
two_duplicates='[{"number":601,"closingIssuesReferences":{"nodes":[{"number":600}]}},{"number":602,"closingIssuesReferences":{"nodes":[{"number":600}]}}]'
partial_overlap='[{"number":611,"closingIssuesReferences":{"nodes":[{"number":595},{"number":999}]}}]'

run_case '[]'                                                     604 "$no_closing" "$no_others"     '閉じる Issue が無ければ重複なし'
run_case '[]'                                                     604 "$issue_595"  "$no_others"     '他に open な PR が無ければ重複なし'
run_case '[]'                                                     604 "$issue_595"  "$self_only"     '自分自身(同じ PR 番号)は候補から除く'
run_case '[]'                                                     604 "$issue_595"  "$unrelated"     '別の Issue を閉じる PR は重複ではない'
run_case '[{"pr":602,"issues":[595]}]'                            604 "$issue_595"  "$duplicate_595" 'pr-604 の実例(Issue #595 を #602 も閉じている)を捕まえる'
run_case '[{"pr":601,"issues":[600]}]'                            605 "$issue_600"  "$duplicate_600" 'pr-605 の実例(Issue #600 を #601 も閉じている)を捕まえる'
run_case '[{"pr":601,"issues":[600]},{"pr":602,"issues":[600]}]'  605 "$issue_600"  "$two_duplicates" '重複が 2 件あれば両方拾う'
run_case '[{"pr":611,"issues":[595]}]'                            604 "$issue_595"  "$partial_overlap" '閉じる Issue が複数あっても、重なった番号だけを報告する'

exit "$failed"
