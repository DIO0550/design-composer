#!/usr/bin/env bash
#
# check-pr-closing-keyword.sh の判定表。代表的な PR 本文を流し、ok / ng が期待どおりかを
# 1 コマンドで確かめる。
#
# 使い方: bash .github/scripts/pr-closing-keyword-cases.sh
# 出力が `ok` だけなら期待どおり。`NG` が 1 行でも出たら判定が変わっている。
#
# 表は `期待|本文|仕様` の 1 行 1 ケース(ランナーは .claude/hooks/lib/case-table.sh と
# 共有)。本文中の `@CR@` は CR、`@@` は改行に置き換わる(置換はこの順。`@CR@@@` が CRLF
# になる)。**PR 本文は CRLF で届く**ので、改行を含むケースは CR 付きの形も通す。
#
# | 期待 | 意味 |
# | --- | --- |
# | `ok` | 通ってほしい(exit 0) |
# | `ng` | 落ちてほしい(exit 1) |
set -uo pipefail

checker="$(dirname "$0")/check-pr-closing-keyword.sh"
source "$(dirname "$0")/../../.claude/hooks/lib/case-table.sh"

# @param 1 期待(使わない。判定は checker の終了コードだけで決まる)
# @param 2 `本文|仕様`
# @returns `<ok|ng>` と仕様の文をタブ区切りで返す
closing_keyword_decide() {
  local body="${2%%|*}"
  local spec="${2#*|}"
  body="${body//@CR@/$'\r'}"
  body="${body//@@/$'\n'}"
  if bash "$checker" <<<"$body" >/dev/null 2>&1; then
    printf '%s\t%s' "ok" "$spec"
  else
    printf '%s\t%s' "ng" "$spec"
  fi
}

failed=0
case_table_run closing_keyword_decide <<'CASES' || failed=1
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
ng|Closes#517|キーワードと番号の間に空白が無ければ落ちる
ng|Closes@CR@@@#517|キーワードと番号が別の行なら落ちる
ng|prefixes #517|語末に fixes を含む語は拾わない
ng|Closest #517|語頭に closes を含む語は拾わない
ng|Closes #517abc|番号の後ろに語が続く形は拾わない
ng|Closes: #517|コロンを挟んだ形は通さない
ng|Closes DIO0550/design-composer#517|owner/repo#N の形は通さない
ng|Closes DIO0550/spec-viewer#12|別リポジトリを指す形は通さない
ng|Closes https://github.com/DIO0550/design-composer/issues/517|Issue の URL は通さない
ng|Issue 無し:|理由の無い申告は認めない
ng|Issue 無し:@CR@@@続き|CR だけの理由は認めない
ng|Issue 無しで進めた|コロンが無い行は申告として認めない
ng|  Issue 無し: 記録だけの PR|字下げした申告は認めない(失敗メッセージをそのまま貼った形)
ng|- Issue 無し: 記録だけの PR|箇条書きの申告は認めない
ng|この PR では Issue 無し: の行を要求する|行頭以外の申告は認めない
ng|issue 無し: 記録だけの PR|申告の綴りは大文字小文字を区別する
CASES

# 表の 1 行には収まらないので個別に見る。checker が本文をパイプで受け取ると、
# `grep -q` の早期終了で書き手が SIGPIPE になり pipefail が「リンクが無い」に化ける
# (実測では 131,012 バイトから起きた)。
printf -v padding '%*s' 200000 ''
long_body="Closes #517
${padding// /x}"
if bash "$checker" <<<"$long_body" >/dev/null 2>&1; then
  long_decision="ok"
else
  long_decision="ng"
fi
case_table_report "ok" "$long_decision" "20 万バイトの本文でも通る" || failed=1

exit "$failed"
