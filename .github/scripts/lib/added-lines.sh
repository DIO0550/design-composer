#!/usr/bin/env bash
#
# base...HEAD で追加・変更された行の行番号を、パスごとに引けるようにする。source して使う。
#
# **`git diff` へ 1 ファイル分のパスだけを渡して数えてはいけない。** git は pathspec の
# 絞り込みを rename 検出より先に行うため、対になる削除側が外れて rename として組めず、
# 移動しただけのファイルが `new file mode` + 全行 `+` になる(#667 で 281 件のファイルを
# 動かしたとき、既存のテストヘルパー 10 件が「このブランチで新しく追加された重複」として
# 報告された)。検査対象の拡張子をまとめて 1 回の diff へ渡し、rename を追跡させる。
#
# 移動が rename として組まれるのは「元のファイルが消える」かつ「類似度が git の閾値
# (既定 50%)以上」のときだけ。分割(元が残る)と、移動しつつ大きく足した場合は組まれない。

# base...HEAD の追加・変更行を `<パス><TAB><行番号>` の表にして stdout へ返す。
#
# `--find-renames` は明示する。`diff.renames=false` を置いた環境では既定の rename 検出が
# 切れ、移動が全行「追加」に戻る。
#
# 追加行の目印を `+` から変えるのは、`-U0` では内容行も `+` 始まりになり、`++ b/foo.ts` と
# いう行が `+++ b/foo.ts` としてファイルのヘッダに見えてしまうため(目印を変えるとヘッダと
# 衝突しうる内容行が無くなる)。`--output-indicator-new` を知らない git では
# `unknown option` で落ちるので、検査していないものが緑にはならない。
#
# @param 1 比較元(base)のコミット
# @param 2.. 検査対象の pathspec。**呼び出し側が数えるファイルの一覧と同じものを渡す**
#            (狭いと rename の対になる側が外れ、移動が「追加」に戻る)
# @returns 追加・変更行を 1 行 1 件で並べた表。追加行が 1 件も無ければ空
collect_added_lines() {
  local base="$1"
  shift

  git diff -U0 --find-renames --output-indicator-new='>' "$base"...HEAD -- "$@" | awk '
    # パスはファイルごとに読み直す。削除されたファイルは `+++ /dev/null` で下の
    # `^\+\+\+ b/` に一致しないため、区切りで空へ戻さないと前のファイルのパスが残る。
    /^diff --git / { path = ""; next }
    /^\+\+\+ b\// {
      path = substr($0, 7)
      # パスに空白があると git が末尾へ TAB を足す(落とさないと表の列がずれる)。
      sub(/\t$/, "", path)
      next
    }
    path != "" && /^@@/ {
      match($0, /\+[0-9]+(,[0-9]+)?/)
      spec = substr($0, RSTART + 1, RLENGTH - 1)
      split(spec, parts, ",")
      count = (2 in parts) ? parts[2] : 1
      for (i = 0; i < count; i++) print path "\t" parts[1] + i
    }
  '
}

# 1 ファイル分の追加・変更行の行番号を、1 行 1 件で stdout へ返す。
#
# @param 1 collect_added_lines が返した表
# @param 2 リポジトリ top からの相対パス
# @returns そのファイルの追加・変更行の行番号。移動しただけで中身が変わっていない
#          ファイルでは 1 件も返さない
added_line_numbers() {
  printf '%s\n' "$1" | awk -F'\t' -v target="$2" '$1 == target { print $2 }'
}
