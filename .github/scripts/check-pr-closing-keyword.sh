#!/usr/bin/env bash
#
# PR 本文が Issue を閉じるようになっているかを検査する。標準入力から本文を読み、
# GitHub が Issue を閉じるキーワード(close / fix / resolve の 3 活用)と `#<番号>` の
# 対が 1 つも無ければ exit 1。
#
# 使い方: printf '%s' "$PR_BODY" | bash .github/scripts/check-pr-closing-keyword.sh
#
# 層 1(CI)にしか置けない。PR 本文は push の時点では存在しないので git hooks(層 2)に
# 対応するイベントが無く、Claude Code のフック(層 3)は発火しない実行環境がある
# (.claude/hooks/README.md「強制力の序列」)。**PR 本文は pull_request イベントの
# ペイロードに載る**ので層 1 からは読める。ここが Issue へのコメント(同 README
# 「カバー範囲と残る穴」の session-url-notice.sh)との境目で、コメントは push にも
# イベントにも痕跡が残らないため CI でも検査できない。
#
# 通すのは `#<番号>` の形だけで、`owner/repo#N` と Issue の URL は落とす。別リポジトリを
# 指す形は CI が緑でマージしてもこのリポジトリの Issue を閉じず、自リポジトリを指す形は
# `#N` と同じ意味なので、通す綴りを 1 つに揃える。
#
# **本文は行単位で見るだけで、マークダウンは解釈しない。** コードブロックや引用の中に
# 書いた綴りも通る。
set -euo pipefail

body="$(cat)"

# GitHub が Issue を閉じる 3 語 × 3 活用。左右の単語境界を見るので、`prefixes #1` の
# ような語の一部や `Closest #1` は拾わない。
closing_link='\b(close[sd]?|fix(e[sd])?|resolve[sd]?)[[:space:]]+#[0-9]+\b'
# Issue を持たない PR(記録・棚卸しなど)の申告。理由が空なら申告として認めない。
no_issue_declaration='^[[:space:]]*Issue 無し:[[:space:]]*[^[:space:]]'

if printf '%s' "$body" | grep -Eiq "$closing_link"; then
  echo "PR 本文に Issue を閉じるリンクがあります"
  exit 0
fi

if printf '%s' "$body" | grep -Eq "$no_issue_declaration"; then
  echo "Issue を持たない PR として申告されています(Issue 無し: の行)"
  exit 0
fi

cat <<'MESSAGE'
PR 本文に Issue を閉じるリンクがありません。

着手した Issue はその回の PR のマージで閉じます(AGENTS.md「着手した Issue はその回で
閉じる」)。本文に次のいずれかの形で 1 行足してください。

  Closes #<Issue番号>

  通る綴り: Close / Closes / Closed / Fix / Fixes / Fixed / Resolve / Resolves / Resolved
  (大文字小文字は問いません)

通らない形:
  - `#123` だけ / `Related to #123` / `Refs #123` — GitHub は閉じません
  - `Closes: #123` — コロンを挟んだ形は通しません
  - `Closes owner/repo#123` / Issue の URL — `#123` の形に書き直してください

Issue を持たない PR(記録・棚卸しなど)は、本文に理由を添えて次の 1 行を書いてください。

  Issue 無し: <理由>
MESSAGE
exit 1
