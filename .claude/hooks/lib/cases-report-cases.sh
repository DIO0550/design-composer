#!/usr/bin/env bash
#
# 検出器の種別の照合（`cases-report.sh` の `report_documented_kinds` / `report_covered_kinds`）と
# `report` 自身（NG なら `cases_failed` を立て、ok なら立てない）の判定表。照合の表は一時ディレクトリへ
# 小さな検出器を置いて照合を呼び、`report` の表は検出器を置かずに `report` だけを呼ぶ。どちらも NG を
# 出して `cases_failed` を立てるか、ok だけを出すかが期待どおりかを 1 コマンドで確かめる。
#
# 使い方: bash .claude/hooks/lib/cases-report-cases.sh
# 出力が `ok` だけなら期待どおり。`NG` が 1 行でも出たら判定が変わっている。
#
# **表をファイルに置くのは、実物の検出器を照合する判定表が、種別がそろっている限り NG の枝に届かない
# から。** 並びを見なくなる・0 件どうしを一致と読む・網羅を見なくなる、のどれに壊しても、その判定表は
# 緑のまま残る。
#
# 照合と `report` は 1 回の呼び出しごとに `cases_failed` を立てるので、ケースごとにサブシェルで呼び、そこでの
# `cases_failed` と出力の行を組にして判定を決める。
#
# 表は `期待|ケース名|照合|実装の種別|docstring の種別|表の期待に出た種別` の 1 行 1 ケース。種別は
# 空白区切りで、`-` は 1 つも持たない。照合は `documented`（`report_documented_kinds`）か
# `covered`（`report_covered_kinds`）。`report` 自身の表は `期待|ケース名|report に渡す期待|report に渡す判定`
# の 1 行 1 ケース。期待は 2 つで、どちらの表も同じ。
#
# | 期待 | 意味 |
# | --- | --- |
# | `NG` | NG の行を出し、`cases_failed` を立ててほしい |
# | `ok` | ok の行だけを出し、`cases_failed` を立ててはいけない |
set -uo pipefail

lib_dir="$(cd "$(dirname "$0")" && pwd)"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

source "$lib_dir/cases-report.sh"

# 空白区切りの種別を 1 行 1 つにする。`-` は空にする。
#
# $1 表に書いた種別
kinds_lines() {
  [ "$1" = "-" ] && return 0
  printf '%s\n' "$1" | tr ' ' '\n'
}

# 種別を行頭の `KINDS = (...)` に、docstring の一覧を「報告する違反は次のとおり」の箇条書きに持つ
# 検出器を置く。どちらも `-` なら、その形を書かない。
#
# $1 実装の種別
# $2 docstring の種別
# $3 検出器を書くパス
place_detector() {
  local reported="$1" documented="$2" target="$3" kind
  {
    printf '"""照合の判定表が置く検出器。\n'
    if [ "$documented" != "-" ]; then
      printf '\n報告する違反は次のとおり。\n\n'
      while IFS= read -r kind; do
        printf -- '- `%s` — 判定表の種別\n' "$kind"
      done <<<"$(kinds_lines "$documented")"
    fi
    printf '"""\n'
    if [ "$reported" != "-" ]; then
      printf 'KINDS = (%s)\n' "$(kinds_lines "$reported" | sed 's/.*/"&"/' | paste -sd ',' - | sed 's/,/, /g')"
    fi
  } >"$target"
}

# 関数をサブシェルで 1 回呼び、出力と `cases_failed` から NG / ok / broken を決める。
# NG の行と `cases_failed` の片方だけなら broken（報告と終了コードが食い違う）。
#
# $@ 呼び出す関数と引数
verdict_of() {
  local output failed
  output="$(
    cases_failed=0
    "$@"
    echo "failed=$cases_failed"
  )"
  failed="$(printf '%s\n' "$output" | sed -n 's/^failed=//p')"
  output="$(printf '%s\n' "$output" | grep -v '^failed=')"
  if [ "$failed" = "1" ] && printf '%s\n' "$output" | grep -q '^NG '; then
    echo "NG"
  elif [ "$failed" = "0" ] && all_in_category "$output" '^ok '; then
    echo "ok"
  else
    echo "broken"
  fi
}

# 照合を 1 回呼んだときの NG / ok / broken。
#
# $1 照合（`documented` / `covered`）
# $2 検出器のパス
# $3 表の期待に出た種別
verdict() {
  local check="$1" detector="$2" covered="$3"
  case "$check" in
    documented) verdict_of report_documented_kinds "$detector" ;;
    covered) verdict_of report_covered_kinds "$detector" "$(kinds_lines "$covered")" ;;
  esac
}

while IFS='|' read -r expected label check reported documented covered; do
  [ -n "$check" ] || continue
  detector="$work/detector.py"
  place_detector "$reported" "$documented" "$detector"
  report "$expected" "$(verdict "$check" "$detector" "$covered")" "$label"
done <<'CASES'
ok|実装と docstring の種別が並びまで一致する|documented|alpha beta|alpha beta|-
NG|実装と docstring の種別が並びだけ違う|documented|alpha beta|beta alpha|-
NG|docstring に無い種別を実装が持つ|documented|alpha beta|alpha|-
NG|実装と docstring のどちらからも種別を取り出せない|documented|-|-|-
ok|実装の種別をすべて表の期待が含む|covered|alpha beta|alpha beta|alpha beta
NG|表の期待に無い種別を実装が持つ|covered|alpha beta|alpha beta|alpha
CASES

while IFS='|' read -r expected label report_expected report_decision; do
  [ -n "$label" ] || continue
  decision="$(verdict_of report "$report_expected" "$report_decision" "report のケース")"
  report "$expected" "$decision" "$label"
  # 食い違いを外側の `report` に任せず、ここで直に `cases_failed` を立てる。外側の `report` も同じ壊れ方を
  # していると、NG の行が出ても `cases_failed` が立たず exit 0 で通る。
  # 出力の NG 行を数え直す形は採らない（出力の形に依存する）。
  [ "$decision" = "$expected" ] || cases_failed=1
done <<'REPORT_CASES'
ok|期待と判定が一致すると ok の行だけを出し、cases_failed を立てない|deny|deny
NG|期待と判定が食い違うと NG の行を出し、cases_failed を立てる|deny|pass
REPORT_CASES

if [ "$cases_failed" -ne 0 ]; then
  echo "判定表と食い違いがあります"
  exit 1
fi
echo "判定表の共通部分の判定表: 期待どおり"
