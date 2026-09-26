#!/usr/bin/env bash
#
# push 前の検査の集計(`check-tally.sh`)の判定表。
#
# 実物の検査は走らせず、`true` / `false` / `exit 2` のスタブを流して、終了コードと出力の行を
# 見る。**名前は出力全体ではなく内訳の行から探す。** `run_check` の見出しにはどの検査の名前も
# 出るので、全体から探すと集計を壊しても通る。
#
# `report()` を `.claude/hooks/lib/cases-report.sh` と共有しないのは、判定表が 4 つのフォルダに
# 割れていて、共有先を作ると判定表 1 本を単体で読めなくなるため(`harness/records/count-cases.sh`
# と同じ判断)。
#
# 使い方: bash harness/githooks/lib/check-tally-cases.sh
# 食い違ったケースがあれば exit 1(`ok` だけなら期待どおり)。

set -uo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
lib="$here/check-tally.sh"
work="$(mktemp -d)" || exit 1
trap 'rm -rf "$work"' EXIT

failed=0

# 1 ケースの結果を 1 行で出す。食い違ったら `failed` を立てる。
#
# $1 期待
# $2 実際
# $3 ケース名
report() {
  local expected="$1" actual="$2" label="$3"
  if [ "$actual" = "$expected" ]; then
    printf 'ok   %s\n' "$label"
    return 0
  fi
  printf 'NG   expected=%s got=%s  %s\n' "$expected" "$actual" "$label"
  failed=1
}

# 集計を新しいシェルで走らせ、出力を `$work/out`、終了コードを `$work/status` に残す。
#
# $1 集計の手順(`run_check` などを並べた文字列。最後に `finish_checks` を足す)
tally() {
  (
    # pre-push を PRE_PUSH_REQUIRE_ALL=1 で走らせるとここへも引き継がれるので、各ケースの
    # 手順が書いたときだけ効くように外す。
    unset PRE_PUSH_REQUIRE_ALL
    # shellcheck source=/dev/null
    . "$lib" || exit 99
    eval "$1"
    finish_checks
  ) >"$work/out" 2>&1
  echo "$?" >"$work/status"
}

last_line() { tail -n 1 "$work/out"; }
status() { cat "$work/status"; }

# 内訳の行(`pre-push: <見出し>: ` の後ろ)。行が無ければ空。
#
# $1 見出し(`失敗した検査` / `飛ばした検査`)
breakdown() {
  sed -n "s#^pre-push: $1: ##p" "$work/out"
}

stub_exit_2() { return 2; }

tally 'run_check "型" true; run_check "lint" true'
report 0 "$(status)" "すべて通れば exit 0"
report "pre-push: 結果 すべて通過(失敗 0 / 通過 2 / 飛ばした 0)" "$(last_line)" \
  "すべて通れば最後の行が「すべて通過」になる"

tally "run_check \"型\" false; run_check \"lint\" touch \"$work/ran-after-failure\""
report yes "$([ -f "$work/ran-after-failure" ] && echo yes || echo no)" "1 つ落ちても後ろの検査は走る"

tally 'run_check "型" false; run_check "lint" true'
report 1 "$(status)" "1 つでも落ちれば exit 1"
report "pre-push: 結果 失敗(失敗 1 / 通過 1 / 飛ばした 0)" "$(last_line)" \
  "1 つでも落ちれば最後の行が「失敗」になる"
report "型" "$(breakdown 失敗した検査)" "失敗の内訳には落ちた検査だけが出て、通った検査は出ない"

tally 'run_check "型" stub_exit_2'
report 1 "$(status)" "exit 2(検査できなかった)も失敗に数える"

tally "skip_following_checks \"python3 が使えない\"; run_check \"doc\" touch \"$work/ran-while-skipping\"; run_check \"import\" true; resume_checks; run_check \"型\" true"
report no "$([ -f "$work/ran-while-skipping" ] && echo yes || echo no)" "飛ばしている区間の検査は走らせない"
report 0 "$(status)" "飛ばした検査があっても落ちた検査が無ければ exit 0"
report "pre-push: 結果 飛ばした検査があるまま通過(失敗 0 / 通過 1 / 飛ばした 2)" "$(last_line)" \
  "飛ばした検査があれば「すべて通過」ではなく飛ばしたことを最後の行で言い、区間の検査をすべて数える"
report "doc / import" "$(breakdown 飛ばした検査)" "飛ばした検査の内訳に、区間の検査の名前がすべて出る"

tally "skip_following_checks \"jq が無い\"; run_check \"カナリア\" true; resume_checks; run_check \"型\" touch \"$work/ran-after-resume\""
report yes "$([ -f "$work/ran-after-resume" ] && echo yes || echo no)" "飛ばす区間を閉じたあとの検査は走る"

tally 'PRE_PUSH_REQUIRE_ALL=1; run_check "型" true; skip_following_checks "jq が無い"; run_check "カナリア" true'
report 1 "$(status)" "PRE_PUSH_REQUIRE_ALL=1 で飛ばした検査があれば exit 1"
report "pre-push: 結果 失敗(失敗 0 / 通過 1 / 飛ばした 1。PRE_PUSH_REQUIRE_ALL=1 のため飛ばした検査も失敗に数える)" \
  "$(last_line)" "PRE_PUSH_REQUIRE_ALL=1 で飛ばした検査があれば、飛ばしたことが原因の失敗だと言う"

tally 'PRE_PUSH_REQUIRE_ALL=0; run_check "型" true; skip_following_checks "jq が無い"; run_check "カナリア" true'
report 0 "$(status)" "PRE_PUSH_REQUIRE_ALL が 1 でなければ、飛ばした検査を失敗に数えない"

tally 'PRE_PUSH_REQUIRE_ALL=1; run_check "型" true'
report 0 "$(status)" "PRE_PUSH_REQUIRE_ALL=1 でもすべて走って通れば exit 0"

tally 'PRE_PUSH_REQUIRE_ALL=1; run_check "型" false; skip_following_checks "jq が無い"; run_check "カナリア" true'
report "pre-push: 結果 失敗(失敗 1 / 通過 0 / 飛ばした 1)" "$(last_line)" \
  "落ちた検査があれば、PRE_PUSH_REQUIRE_ALL=1 で飛ばしもあっても、飛ばしを原因とは言わない"

tally 'run_check "型" false; skip_following_checks "jq が無い"; run_check "カナリア" true'
report 1 "$(status)" "落ちた検査と飛ばした検査が両方あれば exit 1"
report "型|カナリア" "$(breakdown 失敗した検査)|$(breakdown 飛ばした検査)" \
  "落ちた検査と飛ばした検査は別の行に分けて出る"

tally 'skip_following_checks "pnpm が無い"; run_check "型" true'
report "pre-push: 結果 飛ばした検査があるまま通過(失敗 0 / 通過 0 / 飛ばした 1)" "$(last_line)" \
  "すべて飛んだときは「すべて通過」と言わず飛ばしたことを言う"

tally ':'
report 1 "$(status)" "検査を 1 つも走らせず飛ばしも無ければ exit 1"
report "pre-push: 結果 失敗(検査を 1 つも走らせていない)" "$(last_line)" \
  "検査を 1 つも走らせず飛ばしも無ければ「すべて通過」と言わない"

# pre-push の終了コードは最後の文の終了コードなので、`finish_checks` の後ろに文があると
# 集計が失敗を返しても push が通る。上のケースは lib だけを見るので、ここで配線を見る。
last_statement="$(grep -vE '^[[:space:]]*(#|$)' "$here/../pre-push" | tail -n 1)"
report "finish_checks" "$last_statement" "pre-push の最後の文が finish_checks で、その終了コードがフックの終了コードになる"

exit "$failed"
