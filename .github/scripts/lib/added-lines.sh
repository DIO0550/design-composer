#!/usr/bin/env bash
#
# base から HEAD までに**追加・変更された行**の行番号を、統一 diff のハンク見出しから取り出す。
# `check-added-lint-suppressions.sh` / `check-added-test-helper-duplication.sh` が共有する
# (`rules/coding.md`「同じ処理が2箇所に現れたら共通化する」)。
#
# **rename を追跡する。** `git diff -- <新しいパス>` だけを渡すと、対になる削除側がパスの
# 絞り込みから外れて rename として組めず、移動しただけのファイルが**全行「追加」**になる。
# フォルダを動かす変更で、既存の行が新しく書かれたものとして数えられてしまう。
# 対になる古いパスを先に引き、両方を渡して rename として見せる。
#
# 使う側は `init_added_lines <base>` を 1 度呼んでから `added_line_numbers <base> <file>` を呼び、
# 検出器の報告を `entries_on_added_lines` で絞る。

# rename の対応表(新しいパス -> 古いパス)を 1 度だけ作る。ファイルごとに `git diff` を
# 走らせると、移動が数百件ある変更で毎回全体を読み直すことになる。
init_added_lines() {
  ADDED_LINES_RENAMES="$(mktemp)"
  git diff -M --name-status --diff-filter=R "$1"...HEAD \
    | awk -F'\t' '/^R/ { print $3 "\t" $2 }' > "$ADDED_LINES_RENAMES"
}

added_line_numbers() {
  local base="$1" file="$2" source_path
  source_path="$(awk -F'\t' -v f="$file" '$1 == f { print $2; exit }' "$ADDED_LINES_RENAMES")"
  git diff -M -U0 "$base"...HEAD -- "$file" ${source_path:+"$source_path"} | awk '
    /^@@/ {
      match($0, /\+[0-9]+(,[0-9]+)?/)
      spec = substr($0, RSTART + 1, RLENGTH - 1)
      split(spec, parts, ",")
      count = (2 in parts) ? parts[2] : 1
      for (i = 0; i < count; i++) print parts[1] + i
    }
  '
}

# 検出器の報告(`<行番号>:<内容>` を 1 件 1 行)のうち、追加行に載っているものだけを出す。
#
# @param 1 `added_line_numbers` の出力
# @param 2 検出器の報告
entries_on_added_lines() {
  local added="$1" reported="$2" entry
  while IFS= read -r entry; do
    [ -z "$entry" ] && continue
    echo "$added" | grep -qx "${entry%%:*}" || continue
    printf '%s\n' "$entry"
  done <<< "$reported"
}
