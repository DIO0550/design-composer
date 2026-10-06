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
work="$(mktemp -d)" || exit 1
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
printf 'a\nb\n' > inserted.py
printf 'a\nb' > noeol.py
mkdir -p sub
git add -A && git commit --quiet -m base
base="$(git rev-parse HEAD)"

# kept.py: b を消し、d を D に書き換え、f を消す。inserted.py: 間に 1 行足す。noeol.py: 末尾に改行の
# 無い行を書き換える。new.py は起点に無く、エスケープしないとページの検査に落ちる綴りを持つ。
printf 'a\nc\nD\ne\n' > kept.py
printf 'a\nX\nb\n' > inserted.py
printf 'a\nc' > noeol.py
printf 'if x < 1 && y:\n    print("</code></pre><script>")\n' > new.py
git add -A && git commit --quiet -m change
# コミットしていない編集と、コミットしていないファイル。抜粋には載らない。
printf 'a\nc\nD\ne\nworking tree only\n' > kept.py
printf 'x\n' > untracked.py

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
起点に無いファイルは全行が追加になる|new.py 1 2 --base $base|@@ -0,0 +1,2 @@\n+if x < 1 && y:\n+    print("</code></pre><script>")
足した行だけの抜粋は、旧の側が「直前の変更前の行,0」になる(GitHub と同じ)|inserted.py 2 2 --base $base|@@ -1,0 +2,1 @@\n+X
末尾に改行の無い行の印(\\ No newline)は行として数えない|noeol.py 2 2 --base $base|@@ -2,1 +2,1 @@\n-b\n+c
範囲の中で書き換えた行は、消した行と足した行の両方が出る|kept.py 3 3 --base $base|@@ -4,1 +3,1 @@\n-d\n+D
範囲の先頭の直前で消した行は入る|kept.py 2 2 --base $base|@@ -2,2 +2,1 @@\n-b\n c
範囲の末尾の直後で消した行は入らない|kept.py 4 4 --base $base|@@ -5,1 +4,1 @@\n e
範囲の外の変更は入らない|kept.py 1 1 --base $base|@@ -1,1 +1,1 @@\n a
変更の無いファイルは全行が文脈になる|same.py 1 2 --base $base|@@ -1,2 +1,2 @@\n one\n two
範囲がファイルに収まらなければ引数の誤り|kept.py 3 9 --base $base|exit 2
起点の指定が無ければ引数の誤り|kept.py 1 2|exit 2
--lang だけで起点が無ければ引数の誤り|kept.py 1 1 --lang python|exit 2
開始が終了より後なら引数の誤り|kept.py 3 2 --base $base|exit 2
コミットしていない編集は載らない(HEAD の 4 行目までしか無い)|kept.py 5 5 --base $base|exit 2
HEAD に無いファイルは引数の誤り|untracked.py 1 1 --base $base|exit 2
起点がコミットを指さなければ引数の誤り|kept.py 1 1 --base no-such-rev|exit 2
起点が - で始まれば git のオプションにせず引数の誤り|kept.py 1 1 --base --output=x|exit 2
CASES

# 起点が空(`origin/main` が無い環境の `$(git merge-base …)`)でも、index と比べた抜粋を黙って出さない。
# 表は引数を空白で割るので、空の引数はここで渡す。
python3 "$excerpt" kept.py 1 1 --base "" >/dev/null 2>&1; status=$?
empty_base=deny
[ "$status" -eq 2 ] && empty_base=pass
report pass "$empty_base" "起点が空なら引数の誤り(index と比べない)"

# パスはルートからなので、サブディレクトリで走らせたら黙って別のパスを読まずに断る。
(cd sub && python3 "$excerpt" kept.py 1 1 --base "$base" >/dev/null 2>&1); status=$?
in_subfolder=deny
[ "$status" -eq 2 ] && in_subfolder=pass
report pass "$in_subfolder" "リポジトリのルート以外で走らせたら引数の誤り"

# 1 行だけの範囲の場所は `path:行`(`path:行-行` にしない)。
single_ref=deny
python3 "$excerpt" kept.py 1 1 --base "$base" | grep -F '<code class="ref">kept.py:1</code>' >/dev/null && single_ref=pass
report pass "$single_ref" "1 行だけの範囲の場所は path:行 になる"

# 出てきた断片は、そのまま解説ページの検査を通る。new.py の `</code></pre><script>` はエスケープしないと検査に落ちる。
meta='<p class="explain-meta" data-explained-sha="0123456789abcdef0123456789abcdef01234567" data-pr="12" data-page="tech">x</p>'
{ printf '%s\n' "$meta"; python3 "$excerpt" new.py 1 2 --base "$base" --lang python; } > "$work/fragment.html"
python3 "$scripts_dir/build-pr-explain-page.py" "$work/fragment.html" --pr 12 --page tech --out "$work/page.html" >/dev/null && assembled=pass || assembled=deny
report pass "$assembled" "抜粋の断片は、そのまま解説ページの検査を通る"
has_lang=deny
grep -q '<pre class="code" data-diff data-lang="python">' "$work/fragment.html" && has_lang=pass
report pass "$has_lang" "--lang は data-lang として付く"

exit "$cases_failed"
