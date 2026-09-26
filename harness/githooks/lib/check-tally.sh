#!/usr/bin/env bash
#
# push 前の検査(`harness/githooks/pre-push`)の集計。source して使う。
#
# 使い方: 検査ごとに `run_check` を呼び、最後に `finish_checks` を呼んでその終了コードで
# 抜ける。道具が無くて走らせられない区間は `skip_following_checks` と `resume_checks` で
# 挟む(検査の名前を走らせる側と飛ばす側に 2 回書かずに済む)。
# 最後の行の読み方と、止めずに走らせる理由は `harness/githooks/README.md`「結果の読み方」。

checks_passed=0
checks_failed=0
checks_skipped=0
failed_names=""
skipped_names=""
skip_reason=""

# 名前の並びへ 1 つ足す。
#
# $1 これまでの並び(空なら先頭になる)
# $2 足す名前
# 出力: ` / ` で区切った並び
append_name() {
  if [ -z "$1" ]; then
    printf '%s' "$2"
    return 0
  fi
  printf '%s / %s' "$1" "$2"
}

# 以降の `run_check` を、走らせずに飛ばした検査として数える。`resume_checks` で戻す。
#
# $1 飛ばす理由(「◯◯が無い」の形。出力では末尾に「ため」を付ける)
skip_following_checks() {
  skip_reason="$1"
}

# `skip_following_checks` で飛ばしていた `run_check` を、また走らせるようにする。
resume_checks() {
  skip_reason=""
}

# 検査を 1 つ走らせ、成否を数える。落ちても止めない。飛ばしている区間なら走らせずに数える。
#
# $1 検査の名前(見出しと内訳に出る)
# $2... 走らせるコマンド。終了コード 0 だけを通過とし、それ以外(違反ありの 1・
#       検査できなかった 2 を含む)はすべて失敗に数える
run_check() {
  local name="$1"
  shift
  if [ -n "$skip_reason" ]; then
    echo "pre-push: ${name} は${skip_reason}ため飛ばします"
    checks_skipped=$((checks_skipped + 1))
    skipped_names="$(append_name "$skipped_names" "$name")"
    return 0
  fi
  echo "pre-push: ${name}"
  if "$@"; then
    checks_passed=$((checks_passed + 1))
    return 0
  fi
  checks_failed=$((checks_failed + 1))
  failed_names="$(append_name "$failed_names" "$name")"
}

# 内訳と結果の行を出し、終了コードを返す。
#
# 最後の行は `pre-push: 結果 ` で始まり、`すべて通過` / `飛ばした検査があるまま通過` /
# `失敗` のどれかが続く。
#
# 戻り値: 失敗が 1 つでもあれば 1。`PRE_PUSH_REQUIRE_ALL=1` なら飛ばした検査があっても 1。
#         検査を 1 つも走らせず飛ばしも無ければ 1(何も確かめていないものを通過にしない)
finish_checks() {
  local counts="失敗 ${checks_failed} / 通過 ${checks_passed} / 飛ばした ${checks_skipped}"
  local ran=$((checks_passed + checks_failed))
  local skip_is_failure=0
  [ "${PRE_PUSH_REQUIRE_ALL:-}" = "1" ] && [ "$checks_skipped" -gt 0 ] && skip_is_failure=1

  [ -n "$failed_names" ] && echo "pre-push: 失敗した検査: ${failed_names}"
  [ -n "$skipped_names" ] && echo "pre-push: 飛ばした検査: ${skipped_names}"

  if [ "$checks_failed" -gt 0 ]; then
    echo "pre-push: 結果 失敗(${counts})"
    return 1
  fi
  if [ "$skip_is_failure" -eq 1 ]; then
    echo "pre-push: 結果 失敗(${counts}。PRE_PUSH_REQUIRE_ALL=1 のため飛ばした検査も失敗に数える)"
    return 1
  fi
  if [ "$checks_skipped" -gt 0 ]; then
    echo "pre-push: 結果 飛ばした検査があるまま通過(${counts})"
    return 0
  fi
  if [ "$ran" -eq 0 ]; then
    echo "pre-push: 結果 失敗(検査を 1 つも走らせていない)"
    return 1
  fi
  echo "pre-push: 結果 すべて通過(${counts})"
}
