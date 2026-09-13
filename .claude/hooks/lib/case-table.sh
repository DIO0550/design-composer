#!/usr/bin/env bash
#
# 判定表のランナー。`期待|<残り>` の 1 行 1 ケースを標準入力から読み、ケースごとの
# 判定を呼び出して ok / NG を出す。判定表を持つスクリプト(`*-cases.sh`)が source する。
#
# 使い方:
#   source "$(dirname "$0")/case-table.sh"
#   decide() { ... printf '%s\t%s' "<判定>" "<ラベル>"; }   # 第1引数: 期待 / 第2引数: 残り
#   case_table_run decide <<'CASES'
#   ok|...
#   CASES
#
# 判定関数は**判定とラベルをタブ区切りで返す**。ラベル(表示する文字列)は表の書き方で
# 変わる(コマンドそのもの / 仕様の文)ので、ランナー側では決めない。
#
# **空行の読み飛ばしは期待の欄だけで判定する。** 残りの欄で判定すると、入力が空の
# ケース(「本文が空なら落ちる」など)が黙って飛び、飛んだことも出力に出ない。飛んで
# いないことは、流した件数と表の行数を最後に突き合わせて確かめる。
#
# @param 1 1 ケースを判定する関数の名前
# @returns 全ケースが期待どおりなら 0、食い違いか読み飛ばしがあれば 1

case_table_run() {
  local decide="$1"
  local cases case_count executed=0 failed=0
  local expected rest result decision label

  cases="$(cat)"
  case_count="$(printf '%s\n' "$cases" | grep -c .)"

  while IFS='|' read -r expected rest; do
    [ -n "$expected" ] || continue
    executed=$((executed + 1))
    result="$("$decide" "$expected" "$rest")"
    decision="${result%%$'\t'*}"
    label="${result#*$'\t'}"
    if [ "$decision" = "$expected" ]; then
      printf 'ok   %-4s %s\n' "$expected" "$label"
      continue
    fi
    printf 'NG   expected=%s got=%s  %s\n' "$expected" "$decision" "$label"
    failed=1
  done <<< "$cases"

  if [ "$executed" -ne "$case_count" ]; then
    printf 'NG   流したケース %s 件 / 表の行 %s 件(読み飛ばしがある)\n' "$executed" "$case_count"
    return 1
  fi
  return "$failed"
}

# 表に収まらないケース(長すぎる入力など)を、表と同じ書式で 1 件報告する。
#
# @param 1 期待
# @param 2 実際の判定
# @param 3 ラベル
# @returns 期待どおりなら 0、食い違えば 1
case_table_report() {
  if [ "$2" = "$1" ]; then
    printf 'ok   %-4s %s\n' "$1" "$3"
    return 0
  fi
  printf 'NG   expected=%s got=%s  %s\n' "$1" "$2" "$3"
  return 1
}
