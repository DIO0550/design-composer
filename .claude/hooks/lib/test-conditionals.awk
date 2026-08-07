# テストケース内の if / else / switch を探す awk プログラム。
# check-test-rules.sh / pre-push-test-rules.sh の両方から使う。
#
# 対象は test(...) / it(...) のブロック内だけ。ヘルパー関数(setup / factory /
# 取得ヘルパー)の中の分岐は対象外とする。rules/testing.md が禁じているのは
# 「テストケースが入力によって形を変える」ことであって、セットアップの分岐ではない。
# ファイル全体を grep すると、テストが1件も条件分岐していないファイルでも
# ヘルパーの1行で push が止まり、フック側が信用されなくなる。
#
# ブロックの終端は、開始行と同じインデントの `})` とする(Biome 整形が前提)。
# 出力: <行番号>:<行> を違反ごとに1行。
{
  line = $0

  if (in_test) {
    if (line ~ close_pattern) {
      in_test = 0
    } else if (line ~ /^[[:space:]]*(if[[:space:]]*\(|else[[:space:]]*\{|else[[:space:]]+if[[:space:]]*\(|switch[[:space:]]*\()/) {
      print NR ":" line
    }
    next
  }

  if (line ~ /^[[:space:]]*(test|it)[.(]/) {
    match(line, /^[[:space:]]*/)
    close_pattern = "^" substr(line, 1, RLENGTH) "\\}\\)"
    in_test = 1
  }
}
