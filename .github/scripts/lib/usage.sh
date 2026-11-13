#!/usr/bin/env bash
#
# 呼んだスクリプトの冒頭にある「使い方:」の節を標準エラーへ出し、exit 2 で終わる。source して使う。
#
# 読むのは source した側の `$0`(このファイルではなく、走っているスクリプト)。節は `# 使い方:` の
# 行から、次の `#` だけの行まで。
#
# 使う側: `.github/scripts/upsert-sticky-comment.sh` / `.github/scripts/pr-explain-pages.sh`

usage() {
  sed -n '/^# 使い方:/,/^#$/p' "$0" | sed 's/^# \{0,1\}//' >&2
  exit 2
}
