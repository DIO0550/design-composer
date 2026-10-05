#!/usr/bin/env bash
#
# 検出器(`.claude/hooks/lib/*.py`)を走らせ、検査できたかを終了コードで返す。source して使う。
#
# 検出器は違反を見つけたときだけ報告の行を出して exit 1 で終わる(違反が無ければ 0)。
# **Python は捕まえていない例外(traceback)でも exit 1 で終わる**ので、終了コードだけでは
# 「違反あり」と「途中で落ちた」が同じになる。そこで上の約束の対偶として、報告の行を出さずに
# 1 で終わったもの・0 と 1 以外で終わったものを「検査できなかった」とする。
#
# 見るのは標準出力が空かではなく報告の行があるか。`[種別]` で報告する検出器は違反 0 件でも
# 要約の 1 行を出す。
#
# 報告の行を 1 行以上出したあとに落ちたものは「違反あり」と読む(`check-added-*` では、その行が
# 追加行に載らなければ緑になる)。塞ぐには全検出器の入口で例外を捕まえて終了コードを分けることになる。
#
# 使う側: `.github/scripts/check-added-*.sh` / `.claude/hooks/lib/pre-push-detector.sh`

# 検出器を python3 で走らせ、検査できたなら標準出力をそのまま書く。検査できなかったなら、
# 標準出力を標準エラーへ回す(使い方の説明など、落ちた理由を出力に残すため)。
#
# @param 1 報告の行の正規表現(`grep -E` に渡す)
# @param 2 検出器のパス。3 以降はそのまま検出器へ渡す
# @returns 0 で終わった・報告の行を出して 1 で終わったなら 0。報告の行を出さずに 1 で
#   終わった(途中で落ちた)・0 と 1 以外で終わったなら 1
detector_report() {
  local report_pattern="$1" output status=0
  shift
  output="$(python3 "$@")" || status=$?
  if scan_completed "$status" "$report_pattern" "$output"; then
    printf '%s' "$output"
    return 0
  fi
  printf '%s\n' "$output" >&2
  return 1
}

# 検出器が最後まで走ったか(`detector_report` の判定)。
#
# @param 1 検出器の終了コード
# @param 2 報告の行の正規表現
# @param 3 検出器の標準出力
# @returns 0 で終わった・報告の行を出して 1 で終わったなら 0、それ以外は 1
scan_completed() {
  local status="$1" report_pattern="$2" output="$3"
  [ "$status" -eq 0 ] && return 0
  [ "$status" -eq 1 ] || return 1
  grep -qE "$report_pattern" <<<"$output"
}

# `detector_report` が 1 を返したときに、落ちた検出器と入力を出して exit 2
# (`detector-precondition.sh` の 3 値の「検査できなかった」)。
#
# @param 1 検査の名前。出力に出すので、呼び出し側の見出しと同じ綴りにする
# @param 2 検出器のパス
# @param 3 検出器に渡したファイル
exit_unchecked() {
  local check="$1" detector="$2" file="$3"
  echo "${check}: 検出器 ${detector} が ${file} で異常終了したため検査できません(検査していないものを緑にしない)" >&2
  exit 2
}
