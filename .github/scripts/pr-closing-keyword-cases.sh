#!/usr/bin/env bash
#
# check-pr-closing-keyword.sh の判定表。代表的な PR 本文を流し、ok / ng が期待どおりかを
# 1 コマンドで確かめる。
#
# 使い方: bash .github/scripts/pr-closing-keyword-cases.sh
# 出力が `ok` だけなら期待どおり。`NG` が 1 行でも出たら判定が変わっている。
#
# 表は `期待|本文|仕様` の 1 行 1 ケース。本文中の `@CR@` は CR に、`@@` は改行に
# 置き換わる(置換はこの順。`@CR@@@` が CRLF になる)。**PR 本文は CRLF で届く**ので、
# 改行を含むケースは CR 付きの形も通す。期待は 2 つ。
#
# | 期待 | 意味 |
# | --- | --- |
# | `ok` | 通ってほしい(exit 0) |
# | `ng` | 落ちてほしい(exit 1) |
#
# **本文が空のケースがあるので、空行の読み飛ばしは期待の欄だけで判定する。** 本文の欄で
# 判定すると「本文が空なら落ちる」という最重要のケースが黙って飛ぶ。飛んでいないことは
# 最後に流した件数と表の行数を突き合わせて確かめる。
set -uo pipefail

checker="$(dirname "$0")/check-pr-closing-keyword.sh"
failed=0
executed=0

cases="$(
  cat <<'CASES'
ok|Closes #517|キーワードと #番号 があれば通る
ok|closes #517|小文字でも通る
ok|CLOSES #517|全大文字でも通る
ok|Close #517|close の原形でも通る
ok|Closed #517|close の過去形でも通る
ok|Fix #517|fix の原形でも通る
ok|Fixes #517|fix の三人称単数でも通る
ok|Fixed #517|fix の過去形でも通る
ok|Resolve #517|resolve の原形でも通る
ok|Resolves #517|resolve の三人称単数でも通る
ok|Resolved #517|resolve の過去形でも通る
ok|## 概要@@@@Closes #517|本文の途中の行にあっても通る
ok|この PR は closes #517 です|行頭でなくても通る
ok|Closes #517@CR@@@## 概要|CRLF で届いた本文でも通る
ok|```@@Closes #517@@```|コードブロックの中でも通る(マークダウンは解釈しない)
ok|Issue 無し: 記録だけの PR|Issue を持たない PR は理由付きの申告で通る
ok|## 概要@@Issue 無し: 棚卸しの PR@@続き|申告は途中の行にあってもよい
ng||本文が空なら落ちる
ng|#517 の対応|参照だけでキーワードが無ければ落ちる
ng|Related to #517|Related to では閉じないので落ちる
ng|Refs #517|Refs では閉じないので落ちる
ng|Closes #|番号が無ければ落ちる
ng|Closes issue 517|# の無い形は GitHub が閉じないので落ちる
ng|prefixes #517|語末に fixes を含む語は拾わない
ng|Closest #517|語頭に closes を含む語は拾わない
ng|Closes #517abc|番号の後ろに語が続く形は拾わない
ng|Closes: #517|コロンを挟んだ形は通さない
ng|Closes DIO0550/design-composer#517|owner/repo#N の形は通さない
ng|Closes DIO0550/spec-viewer#12|別リポジトリを指す形は通さない
ng|Closes https://github.com/DIO0550/design-composer/issues/517|Issue の URL は通さない
ng|Issue 無し:|理由の無い申告は認めない
ng|Issue 無しで進めた|コロンが無い行は申告として認めない
CASES
)"
case_count="$(printf '%s\n' "$cases" | grep -c .)"

while IFS='|' read -r expected body spec; do
  [ -n "$expected" ] || continue
  executed=$((executed + 1))
  body="${body//@CR@/$'\r'}"
  body="${body//@@/$'\n'}"
  if printf '%s' "$body" | bash "$checker" >/dev/null 2>&1; then
    decision="ok"
  else
    decision="ng"
  fi
  if [ "$decision" = "$expected" ]; then
    printf 'ok   %-2s %s\n' "$expected" "$spec"
    continue
  fi
  printf 'NG   expected=%s got=%s  %s\n' "$expected" "$decision" "$spec"
  failed=1
done <<< "$cases"

# 読み飛ばしで落ちたケースが無いことを確かめる(本文が空のケースが飛ぶ形を防ぐ)。
if [ "$executed" -ne "$case_count" ]; then
  printf 'NG   流したケース %s 件 / 表の行 %s 件(読み飛ばしがある)\n' "$executed" "$case_count"
  failed=1
else
  printf '%s 件すべて流した\n' "$executed"
fi

exit "$failed"
