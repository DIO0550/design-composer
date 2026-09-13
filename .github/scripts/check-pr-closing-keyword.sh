#!/usr/bin/env bash
#
# PR 本文が Issue を閉じるようになっているかを検査する。標準入力から本文を読み、
# GitHub が Issue を閉じるキーワード(close / fix / resolve の 3 活用)と `#<番号>` の
# 対が 1 つも無ければ exit 1。
#
# 使い方: printf '%s' "$PR_BODY" | bash .github/scripts/check-pr-closing-keyword.sh
#
# 層 1(CI)にしか置けない。**本文の編集に対応する git のイベントが無い**ので git hooks
# (層 2)からは追随できず、Claude Code のフック(層 3)は発火しない実行環境がある
# (.claude/hooks/README.md「強制力の序列」)。PR 本文は pull_request イベントの
# ペイロードに載るので層 1 からは読める。同 README「カバー範囲と残る穴」が
# session-url-notice.sh を代替不能としている理由はこれとは別なので、そちらを参照する。
#
# 通すのは `#<番号>` の形だけで、`owner/repo#N` と Issue の URL は落とす。別リポジトリを
# 指す形は CI が緑でマージしてもこのリポジトリの Issue を閉じず、自リポジトリを指す形は
# `#N` と同じ意味なので、通す綴りを 1 つに揃える。
#
# **本文は行単位で見るだけで、マークダウンは解釈しない。** コードブロック・引用・HTML
# コメントの中にしか綴りが無い本文も通る。GitHub がそこで参照を作るかは確かめていない
# ので、この検査が保証するのは綴りがあることまで。
set -euo pipefail

body="$(cat)"

# GitHub が Issue を閉じる 3 語 × 3 活用。キーワードの後に空白を要求するので
# `Closest #1` は当たらず、左右の単語境界で `prefixes #1` と `Closes #1abc` を外す。
closing_link='\b(close[sd]?|fix(e[sd])?|resolve[sd]?)[[:space:]]+#[0-9]+\b'
# Issue を持たない PR(記録・棚卸しなど)の申告。**行頭に置いた 1 行だけを認める**。
# 字下げを許すと、この検査自身が出す失敗メッセージ(`  Issue 無し: <理由>`)を本文へ
# 貼っただけで通ってしまう。綴りも固定する(大文字小文字を区別する)。
no_issue_declaration='^Issue 無し:[[:space:]]*[^[:space:]]'

# パイプで渡さない。`grep -q` は最初の一致で終わるので、本文が grep の読み込み
# バッファを超えると書き手が SIGPIPE で死に、pipefail がパイプライン全体を失敗に
# する(実測: 先頭行に `Closes #517` を置いた 131,012 バイトの本文が exit 1 になる)。
if grep -Eiq "$closing_link" <<<"$body"; then
  echo "PR 本文に Issue を閉じるリンクがあります"
  exit 0
fi

if grep -Eq "$no_issue_declaration" <<<"$body"; then
  echo "Issue を持たない PR として申告されています(Issue 無し: の行)"
  exit 0
fi

cat <<'MESSAGE'
PR 本文に Issue を閉じるリンクがありません。

着手した Issue はその回の PR のマージで閉じます(AGENTS.md「着手した Issue はその回で
閉じる」)。本文に次の形で 1 行足してください。

  Closes #<Issue番号>

  通る綴りは close / fix / resolve と、その -s 形 / -d 形(closes / closed など)。
  大文字小文字は問いません。

通らない形:
  - `#123` だけ / `Related to #123` / `Refs #123` — GitHub は閉じません
  - `Closes: #123` — コロンを挟んだ形は通しません
  - `Closes owner/repo#123` / Issue の URL — `#123` の形に書き直してください

Issue を持たない PR(記録・棚卸しなど)は、理由を添えた次の 1 行を**行頭から**
書いてください(字下げ・箇条書きの行は申告として扱いません)。

Issue 無し: <理由>
MESSAGE
exit 1
