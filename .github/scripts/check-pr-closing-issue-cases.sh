#!/usr/bin/env bash
#
# `check-pr-closing-issue.sh` の判定表。問い合わせ結果を模した JSON を食わせ、
# exit コードが期待どおりかを 1 コマンドで確かめる。
#
# 使い方: bash .github/scripts/check-pr-closing-issue-cases.sh
# 出力が `ok` だけなら期待どおり。`NG` が 1 行でも出たら判定が変わっている。
#
# **表をここへ置くのは、CI の run が流れると判定の根拠が残らないため。** 覆っているのは
# 「問い合わせ結果 → 終了コード」だけで、GraphQL のクエリ本体とワークフローの配線は
# 覆えない(`gh` がローカルに無い)。
#
# **件数(`totalCount`)と中身(`nodes`)は別々に渡す。** クエリは `files(first: 1)` なので
# GitHub は 2 ファイル以上の PR でも `nodes` を 1 件しか返さない。`nodes` の数から
# `totalCount` を作ると、その切り詰められた形を表で 1 度も踏めなくなる。
set -uo pipefail

script="$(dirname "$0")/check-pr-closing-issue.sh"
failed=0

# 問い合わせ結果を組み立てる。閉じる Issue・変更ファイルの総数・返ってきた 1 件目を差し替える
result_json() {
  jq -n --argjson closing "$1" --argjson total "$2" --argjson files "$3" '{
    data: { repository: { pullRequest: {
      closingIssuesReferences: { nodes: $closing },
      files: { totalCount: $total, nodes: $files }
    } } }
  }'
}

run_case() {
  local expected="$1" closing="$2" total="$3" files="$4" label="$5"
  local json actual=0

  json="$(mktemp)"
  result_json "$closing" "$total" "$files" >"$json"
  bash "$script" "$json" >/dev/null 2>&1 || actual=$?
  rm -f "$json"

  if [ "$actual" = "$expected" ]; then
    printf 'ok   exit=%s  %s\n' "$actual" "$label"
    return
  fi
  printf 'NG   exit=%s (期待 %s)  %s\n' "$actual" "$expected" "$label"
  failed=1
}

no_issue='[]'
one_issue='[{"number":517}]'
record='[{"path":"harness/records/pr-1.md","changeType":"ADDED"}]'
record_modified='[{"path":"harness/records/pr-1.md","changeType":"MODIFIED"}]'
sibling_folder='[{"path":"harness/records-old/pr-1.md","changeType":"ADDED"}]'
nested_path='[{"path":"docs/harness/records/pr-1.md","changeType":"ADDED"}]'
records_readme='[{"path":"harness/records/README.md","changeType":"ADDED"}]'

run_case 0 "$no_issue"  1 "$record"          '記録 PR(新規 1 ファイル)は閉じる Issue が無くても通る'
run_case 0 "$one_issue" 1 "$record"          '記録 PR に閉じる Issue があっても落とさない'
run_case 1 "$no_issue"  2 "$record"          '1 件目が記録でも、2 ファイル以上あるなら閉じる Issue が要る'
run_case 0 "$one_issue" 2 "$record"          '記録以外を含んでも閉じる Issue があれば通る'
run_case 1 "$no_issue"  1 "$record_modified" '記録ファイルの変更だけの PR は記録 PR ではない'
run_case 1 "$no_issue"  1 "$sibling_folder"  'harness/records- で始まる別フォルダは記録 PR ではない'
run_case 1 "$no_issue"  1 "$nested_path"     'パスの途中に harness/records/ を含むだけのものは記録 PR ではない'
run_case 1 "$no_issue"  1 "$records_readme"  'harness/records/ でも pr-<番号>.md でなければ記録 PR ではない'

exit "$failed"
