#!/usr/bin/env bash
#
# `check-added-*.sh` が使う「この PR で追加・変更された行」の取り出し。source して使う。
#
# **リネームを検出させる(`-M`)。** 検出させないと、フォルダを移しただけのファイルが
# 全行追加として出て、**元からあった行がこの PR で追加されたことになる**
# (実測: 7 つの feature を 1 段下へ移しただけで、main に前からある重複ヘルパー 10 件が
# 「追加された重複」として報告され、CI が赤になった)。
#
# **1 度で木全体を取る。** `git diff -- <1 ファイル>` へ絞るとリネームの対になる元のパスが
# pathspec の外に落ちて `-M` が効かないので、ファイルごとに呼ぶ形にはしない。

# 追加・変更された行を `<パス>:<行番号>` で 1 件 1 行返す。行番号は統一 diff の
# ハンク見出し(`@@ -a,b +c,d @@`)の新しい側から取る。
#
# @param 1 比べる相手(base)
# @param 2.. 対象の pathspec
added_lines_of() {
  local base="$1"
  shift
  git diff -U0 -M --diff-filter=d "$base"...HEAD -- "$@" | awk '
    /^\+\+\+ b\// { file = substr($0, 7); next }
    /^@@/ && file != "" {
      match($0, /\+[0-9]+(,[0-9]+)?/)
      spec = substr($0, RSTART + 1, RLENGTH - 1)
      split(spec, parts, ",")
      count = (2 in parts) ? parts[2] : 1
      for (i = 0; i < count; i++) print file ":" parts[1] + i
    }
  '
}

# `added_lines_of` の出力から、追加・変更された行を持つファイルだけを重複なく返す。
#
# @param 1 `added_lines_of` の出力
changed_files_of() {
  printf '%s\n' "$1" | sed 's/:[0-9]*$//' | sort -u
}
