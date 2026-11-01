#!/usr/bin/env bash
#
# 検出器の種別の照合（`report_documented_kinds` / `report_covered_kinds`）と `report` 自身（NG なら
# `cases_failed` を立て、ok なら立てない）と、終了コードと見出しの突き合わせ（`decide` / `normalize_miss`）の
# 判定表。照合の表は一時ディレクトリへ小さな検出器を置いて照合を呼び、`report` の表は検出器を置かずに
# `report` だけを呼ぶ。この 2 つは、NG を出して `cases_failed` を立てるか ok だけを出すかを確かめる。
# 突き合わせの表は検出器を走らせず、表に書いた出力と終了コードを `decide` へ渡して返る判定を確かめる。
#
# 使い方: bash .claude/hooks/lib/cases-report-cases.sh
# 出力が `ok` だけなら期待どおり。`NG` が 1 行でも出たら判定が変わっている。
#
# **表をファイルに置くのは、実物の検出器を照合する判定表が、種別がそろっている限り NG の枝に届かない
# から。** 並びを見なくなる・0 件どうしを一致と読む・網羅を見なくなる、のどれに壊しても、その判定表は
# 緑のまま残る。`decide` の broken の枝も同じで、実物の検出器を呼ぶ判定表は検出器が退行しない限りそこへ
# 届かない。
#
# 照合と `report` は 1 回の呼び出しごとに `cases_failed` を立てるので、ケースごとにサブシェルで呼び、そこでの
# `cases_failed` と出力の行を組にして判定を決める。`decide` / `normalize_miss` は判定を返すだけで
# `cases_failed` に触れないので、サブシェルを挟まず返った判定をそのまま `report` へ渡す。
#
# 表は `期待|ケース名|照合|実装の種別|docstring の種別|表の期待に出た種別` の 1 行 1 ケース。種別は
# 空白区切りで、`-` は 1 つも持たない。照合は `documented`（`report_documented_kinds`）か
# `covered`（`report_covered_kinds`）。`report` 自身の表は `期待|ケース名|report に渡す期待|report に渡す判定`
# の 1 行 1 ケース。この 2 つの表の期待は 2 つ。
#
# | 期待 | 意味 |
# | --- | --- |
# | `NG` | NG の行を出し、`cases_failed` を立ててほしい |
# | `ok` | ok の行だけを出し、`cases_failed` を立ててはいけない |
#
# 突き合わせの表は 2 つ。`decide` の表は `期待|ケース名|終了コード|出力`、`normalize_miss` と組み合わせた
# 表は `期待|ケース名|表に書く期待|終了コード|出力` の 1 行 1 ケース。出力は検出器の標準出力の 1 行で、
# `-` なら何も出さない。見出しの正規表現は `^\[probe\]` に固定する。期待は返ってほしい判定の綴り
# そのもの（`pass` / `deny` / `broken` / `miss`）で、`report` へ直に渡す。
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

# 突き合わせの表に書いた出力を、検出器の標準出力にする。
#
# $1 表に書いた出力。`-` なら何も出さない
probe_output() {
  [ "$1" = "-" ] && return 0
  printf '%s\n' "$1"
}

while IFS='|' read -r expected label status output; do
  [ -n "$label" ] || continue
  report "$expected" "$(decide "$(probe_output "$output")" "$status" '^\[probe\]')" "$label"
done <<'DECIDE_CASES'
pass|exit 0 で何も出さなければ pass|0|-
pass|exit 0 で見出しに当たらない行だけを出すなら pass|0|違反 0 件
deny|exit 1 で見出しを出せば deny|1|[probe] 1 件
broken|exit 1 なのに何も出さなければ broken|1|-
broken|exit 1 なのに見出しに当たらない行だけを出すなら broken|1|違反 0 件
broken|見出しを出したまま exit 0 なら broken|0|[probe] 1 件
broken|exit 2 で何も出さなければ broken|2|-
broken|exit 2 で見出しを出しても broken|2|[probe] 1 件
DECIDE_CASES

while IFS='|' read -r expected label table_expected status output; do
  [ -n "$label" ] || continue
  decision="$(decide "$(probe_output "$output")" "$status" '^\[probe\]')"
  report "$expected" "$(normalize_miss "$table_expected" "$decision")" "$label"
done <<'MISS_CASES'
miss|取りこぼしを期待した表で exit 0 かつ何も出さなければ miss|miss|0|-
pass|pass を期待した表で exit 0 かつ何も出さなければ miss と読まず pass|pass|0|-
deny|取りこぼしを期待した表でも exit 1 で見出しを出せば deny|miss|1|[probe] 1 件
broken|取りこぼしを期待した表でも exit 2 なら miss と読まず broken|miss|2|-
broken|取りこぼしを期待した表でも見出しを出したまま exit 0 なら miss と読まず broken|miss|0|[probe] 1 件
MISS_CASES

if [ "$cases_failed" -ne 0 ]; then
  echo "判定表と食い違いがあります"
  exit 1
fi
echo "終了コードと見出しの突き合わせと報告と種別の照合の判定表: 期待どおり"
