#!/usr/bin/env bash
#
# フックが標準入力の JSON から文字列の値を取り出す `extract`。source したうえで、標準入力を
# `input` に入れてから呼ぶ。使う側は `.claude/hooks/README.md`「配線」の `lib/hook-input.sh` の行。
#
# jq を使わず、生の JSON への正規表現で取り出す。jq の無い環境で黙って落ちると判定ごと消えるので、
# bash の組み込みだけで完結させる。同じキーが 2 回以上現れたら最初の一致を採る。値の中の `"` は
# `\"` にエスケープされているので、文字列の中に同じ綴りのキーがあっても当たらない。

# `input` の JSON から、キーに対応する文字列の値を出す。
#
# $1 キー
# 出力: 最初に当たったキーの値。当たらなければ何も出さない(終了コードは 1)
extract() {
  local pattern="\"$1\"[[:space:]]*:[[:space:]]*\"([^\"]*)\""
  [[ "$input" =~ $pattern ]] && printf '%s' "${BASH_REMATCH[1]}"
}
