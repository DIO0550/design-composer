#!/usr/bin/env bash
#
# コード抜粋の判定表。一時リポジトリに起点と変更後のファイルを置いて `build-pr-explain-excerpt.py`
# を走らせ、出てきた diff の行が期待どおりかを 1 コマンドで確かめる。
#
# 使い方: bash .github/scripts/build-pr-explain-excerpt-cases.sh
# 出力が `ok` だけなら期待どおり。`NG` が 1 行でも出たら判定が変わっている。
#
# **範囲の境目で消した行の扱いが要。** 範囲の先頭の直前で消した行は入り、末尾の直後で消した行は
# 入らない。範囲を変更後の行番号だけで切る実装に戻すと、消した行がすべて落ちる。
#
# 表は `ケース名|抜粋の引数|期待する diff の行(\n 区切り)` の 1 行 1 ケース。diff の行は
# `<code>` の中身をアンエスケープして比べる。
set -uo pipefail

scripts_dir="$(cd "$(dirname "$0")" && pwd)"
excerpt="$scripts_dir/build-pr-explain-excerpt.py"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

# 外側のリポジトリを指す git の環境変数を落とす(立ったまま一時ディレクトリで git を使うと、
# 本物のリポジトリを触る)。
unset GIT_DIR GIT_WORK_TREE GIT_INDEX_FILE

source "$scripts_dir/../../.claude/hooks/lib/cases-report.sh"

repo="$work/repo"
git init --quiet -b main "$repo"
cd "$repo" || exit 1
git config user.name cases
git config user.email cases@example.com

printf 'a\nb\nc\nd\ne\nf\n' > kept.py
printf 'one\ntwo\n' > same.py
git add -A && git commit --quiet -m base
base="$(git rev-parse HEAD)"

# kept.py: b を消し、d を D に書き換え、f を消す。new.py は起点に無い。
printf 'a\nc\nD\ne\n' > kept.py
printf 'if x < 1 && y:\n    pass\n' > new.py
git add -A && git commit --quiet -m change

# $1 抜粋の引数(空白区切り)。diff の行(`@@` の見出しを含む)を出す。失敗したら `exit <コード>`。
diff_lines() {
  local output status
  # shellcheck disable=SC2086
  output="$(python3 "$excerpt" $1 2>/dev/null)" && status=0 || status=$?
  [ "$status" -eq 0 ] || { echo "exit $status"; return; }
  printf '%s' "$output" | python3 -c '
import html, re, sys
body = re.search(r"<code>(.*)</code></pre>", sys.stdin.read(), re.S).group(1)
print(html.unescape(body))'
}

while IFS='|' read -r label args expected; do
  [ -n "$label" ] || continue
  actual="$(diff_lines "$args")"
  verdict=deny
  [ "$actual" = "$(printf '%b' "$expected")" ] && verdict=pass
  report pass "$verdict" "$label"
done <<CASES
起点に無いファイルは全行が追加になる|new.py 1 2 --base $base|@@ -0,0 +1,2 @@\n+if x < 1 && y:\n+    pass
範囲の中で書き換えた行は、消した行と足した行の両方が出る|kept.py 3 3 --base $base|@@ -4,1 +3,1 @@\n-d\n+D
範囲の先頭の直前で消した行は入る|kept.py 2 2 --base $base|@@ -2,2 +2,1 @@\n-b\n c
範囲の末尾の直後で消した行は入らない|kept.py 4 4 --base $base|@@ -5,1 +4,1 @@\n e
範囲の外の変更は入らない|kept.py 1 1 --base $base|@@ -1,1 +1,1 @@\n a
変更の無いファイルは全行が文脈になる|same.py 1 2 --base $base|@@ -1,2 +1,2 @@\n one\n two
範囲がファイルに収まらなければ引数の誤り|kept.py 3 9 --base $base|exit 2
起点の指定が無ければ引数の誤り|kept.py 1 2|exit 2
開始が終了より後なら引数の誤り|kept.py 3 2 --base $base|exit 2
CASES

# 出てきた断片は、そのまま解説ページの検査を通る(中身の `<` `&` はエスケープされている)。
meta='<p class="explain-meta" data-explained-sha="0123456789abcdef0123456789abcdef01234567" data-pr="12" data-page="tech">x</p>'
{ printf '%s\n' "$meta"; python3 "$excerpt" new.py 1 2 --base "$base" --lang python; } > "$work/fragment.html"
python3 "$scripts_dir/build-pr-explain-page.py" "$work/fragment.html" --pr 12 --page tech --out "$work/page.html" >/dev/null && assembled=pass || assembled=deny
report pass "$assembled" "抜粋の断片は、そのまま解説ページの検査を通る"
has_lang=deny
grep -q '<pre class="code" data-diff data-lang="python">' "$work/fragment.html" && has_lang=pass
report pass "$has_lang" "--lang は data-lang として付く"

exit "$cases_failed"
