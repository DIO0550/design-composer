#!/usr/bin/env bash
#
# `check-added-*.sh` が使う「この PR で追加・変更された行」の取り出し。source して使う。
#
# **1 度で木全体を取る。** `git diff -- <1 ファイル>` へ絞ると、リネームの対になる元のパスが
# pathspec の外に落ちてリネームと判定できず、**フォルダを移しただけのファイルが全行追加と
# して出る**(実測: 7 つの feature を 1 段下へ移した差分で、移動後のファイルのハンクが
# `@@ -0,0 +1,165 @@` になり、main に前からある重複ヘルパー 10 件が「追加された重複」として
# 報告されて CI が赤になった)。ファイルごとに呼ぶ形にはしない。
#
# `-M` は明示で付ける。既定(`diff.renames`)が真なので**付けても付けなくても今は同じ**だが、
# 偽にした環境で黙って全行追加へ戻るのを防ぐ。効いていることは判定表の
# `duplication-renamed` が見る(`--no-renames` にすると NG になる)。

# 追加・変更された行を `<パス>:<行番号>` で 1 件 1 行返す。行番号は統一 diff の
# ハンク見出し(`@@ -a,b +c,d @@`)の新しい側から取る。
#
# @param 1 比べる相手(base)
# @param 2.. 対象の pathspec
added_lines_of() {
  local base="$1"
  shift
  git diff -U0 -M --diff-filter=d "$base"...HEAD -- "$@" | awk '
    # 見出しを拾うのは `diff --git` の直後だけ。`-U0` の追加行は `+` で始まるので、
    # `++ b/...` という中身の行がそのまま `+++ b/` に見える
    /^diff --git / { heading = 1; file = ""; next }
    heading && /^\+\+\+ b\// { file = substr($0, 7); heading = 0; next }
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
