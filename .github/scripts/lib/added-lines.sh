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
# 検出器の報告を `entries_on_added_lines` で絞る。base にあったものと比べるときは、base の先端では
# なく `ADDED_LINES_MERGE_BASE` を見る(`init_added_lines` の doc)。
#
# **パスは `git diff -z` の NUL 区切りで読む。** 行区切りの出力では git が非 ASCII・`"`・`\`・
# タブを含むパスをクォートして出し、その綴りは実在するファイル名と一致しない。
# `-c core.quotePath=false` にしないのは、外れるのが非 ASCII のエスケープだけで `"` `\`
# 制御文字は引き続きクォートされるため。使う側のファイル一覧も同じく `-z` で読むこと。

# rename の一覧(`R<類似度>\0<古いパス>\0<新しいパス>\0` の並び)を 1 度だけ取っておく。
# ファイルごとに `git diff` を走らせると、移動が数百件ある変更で毎回全体を読み直すことになる。
#
# あわせて、追加行の判定(`<base>...HEAD`)が比べている木 = merge-base を `ADDED_LINES_MERGE_BASE`
# に置く。base にあったものと比べる側が base の先端を見ると、分岐のあとで base 側が同じものを
# 足していれば見逃し、消していれば移しただけのものを新しく足したと読む。
# 求めるのは `git diff` の後。共通の祖先が無いとき `git merge-base` は違反ありと同じ 1 を返すが、
# その前に `git diff` が 128 で止まる。
init_added_lines() {
  ADDED_LINES_RENAMES="$(mktemp)"
  git diff -M -z --name-status --diff-filter=R "$1"...HEAD > "$ADDED_LINES_RENAMES"
  ADDED_LINES_MERGE_BASE="$(git merge-base "$1" HEAD)"
}

# rename の一覧から、新しいパスに対応する古いパスを出す(rename でなければ何も出さない)。
#
# @param 1 新しいパス
rename_source_of() {
  local file="$1" status old new
  while IFS= read -r -d '' status && IFS= read -r -d '' old && IFS= read -r -d '' new; do
    if [ "$new" = "$file" ]; then
      printf '%s' "$old"
      return
    fi
  done < "$ADDED_LINES_RENAMES"
}

added_line_numbers() {
  local base="$1" file="$2" source_path
  source_path="$(rename_source_of "$file")"
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
