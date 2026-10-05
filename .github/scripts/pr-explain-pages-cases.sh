#!/usr/bin/env bash
#
# 解説ページの置き場の判定表。ローカルの bare リポジトリを gh-pages の置き場にして
# `pr-explain-pages.sh` を走らせ、push された後の gh-pages が期待どおりかを 1 コマンドで確かめる。
#
# 使い方: bash .github/scripts/pr-explain-pages-cases.sh
# 出力が `ok` だけなら期待どおり。`NG` が 1 行でも出たら判定が変わっている。
#
# **他の PR のフォルダ・`pr-preview/` に触らないことを、どのモードでも見る。** gh-pages は
# Storybook と VRT の配信と同じブランチで、ここを壊すとこの機能の外まで消える。
# `remove 1` が `pr-12` を消さないのは、作業コピーに展開するのが `pr-explain/pr-1/` だけ
# (sparse-checkout)だから。消す側を `pr-1*` の前方一致に取り違えても、展開の範囲を
# `pr-explain/` 全体へ広げない限りこのケースは通る。見ているのは 2 つが組み合わさった結果。
#
# 競合の再試行は、bare リポジトリの pre-receive フックで 1 回目の push だけを拒否して作る。
# 待ち時間は `PR_EXPLAIN_RETRY_WAIT=0` で消す。
set -uo pipefail

scripts_dir="$(cd "$(dirname "$0")" && pwd)"
repo_root="$(cd "$scripts_dir/../.." && pwd)"
pages="$scripts_dir/pr-explain-pages.sh"
template="$repo_root/.claude/skills/pr-explain/templates/index.html"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

unset GIT_DIR GIT_WORK_TREE GIT_INDEX_FILE
export PR_EXPLAIN_REMOTE="file://$work/origin.git"
export PR_EXPLAIN_RETRY_WAIT=0
export GIT_AUTHOR_NAME=cases GIT_AUTHOR_EMAIL=cases@example.com
export GIT_COMMITTER_NAME=cases GIT_COMMITTER_EMAIL=cases@example.com

source "$repo_root/.claude/hooks/lib/cases-report.sh"

# 解説として通る断片(PR #1 宛て)と、検査に落ちる断片。
meta='<p class="explain-meta" data-explained-sha="0123456789abcdef0123456789abcdef01234567" data-pr="1">解説時点</p>'
printf '%s\n<h1>書いた解説</h1>\n' "$meta" > "$work/fragment.html"
printf '%s\n<script>alert(1)</script>\n' "$meta" > "$work/broken.html"
printf '%s\n' "${meta/data-pr=\"1\"/data-pr=\"7\"}" > "$work/fragment-7.html"
printf '{"head": "new"}\n' > "$work/map.json"

# gh-pages を持つ bare リポジトリを作り直す。
# $1 `seeded` なら既存の PR のフォルダと pr-preview を置く。`empty` なら gh-pages を作らない
fresh_origin() {
  rm -rf "$work/origin.git" "$work/seed" "$work/pushes"
  git init --quiet --bare "$work/origin.git"
  git -C "$work/origin.git" config uploadpack.allowFilter true
  [ "$1" = "seeded" ] || return 0
  git init --quiet -b gh-pages "$work/seed"
  mkdir -p "$work/seed/pr-explain/pr-1" "$work/seed/pr-explain/pr-12" "$work/seed/pr-preview/pr-1"
  echo old > "$work/seed/pr-explain/pr-1/index.html"
  echo '{"head": "old"}' > "$work/seed/pr-explain/pr-1/change-map.json"
  echo twelve > "$work/seed/pr-explain/pr-12/index.html"
  echo '{"head": "twelve"}' > "$work/seed/pr-explain/pr-12/change-map.json"
  echo storybook > "$work/seed/pr-preview/pr-1/index.html"
  touch "$work/seed/.nojekyll"
  git -C "$work/seed" add -A && git -C "$work/seed" commit --quiet -m seed
  git -C "$work/seed" push --quiet "$work/origin.git" gh-pages 2>/dev/null
}

# 1 回目の push だけを拒否する pre-receive フックを置く。
reject_first_push() {
  cat > "$work/origin.git/hooks/pre-receive" <<HOOK
#!/usr/bin/env bash
count=\$(( \$(cat "$work/pushes" 2>/dev/null || echo 0) + 1 ))
echo "\$count" > "$work/pushes"
[ "\$count" -gt 1 ]
HOOK
  chmod +x "$work/origin.git/hooks/pre-receive"
}

# gh-pages 上のファイルの中身。無ければ `<none>`。
on_pages() {
  git --git-dir="$work/origin.git" show "gh-pages:$1" 2>/dev/null || echo "<none>"
}

tip() {
  git --git-dir="$work/origin.git" rev-parse --verify --quiet gh-pages || echo "<none>"
}

# 表明が成り立つかを 1 行で報告する。
# $1 ケース名, $2 表明(bash の条件。成り立てば holds)
expect() {
  if eval "$2"; then outcome=holds; else outcome=fails; fi
  report holds "$outcome" "$1"
}

run_pages() {
  bash "$pages" "$@" >/dev/null 2>&1
}

fresh_origin seeded
run_pages put-page 1 "$work/fragment.html"
expect "put-page は断片を組み立てた index.html で上書きする" 'on_pages pr-explain/pr-1/index.html | grep -q "書いた解説"'
expect "put-page は change-map.json に触らない" '[ "$(on_pages pr-explain/pr-1/change-map.json)" = "{\"head\": \"old\"}" ]'
expect "put-page は他の PR のフォルダに触らない" '[ "$(on_pages pr-explain/pr-12/index.html)" = twelve ]'
expect "put-page は pr-preview に触らない" '[ "$(on_pages pr-preview/pr-1/index.html)" = storybook ]'

fresh_origin seeded
before="$(tip)"
output="$(bash "$pages" put-page 1 "$work/broken.html" 2>&1)"; status=$?
expect "検査に落ちる解説は、取り直しへ進まずに push しない" '[ "$status" -eq 1 ] && [ "$(tip)" = "$before" ] && [[ "$output" == *"[pr-explain-content]"* ]] && [[ "$output" != *"反映に失敗"* ]]'

fresh_origin seeded
before="$(tip)"
run_pages put-page 7 "$work/fragment-7.html"; status=$?
expect "地図の無いフォルダへは put-page しない" '[ "$status" -eq 3 ] && [ "$(tip)" = "$before" ] && [ "$(on_pages pr-explain/pr-7/index.html)" = "<none>" ]'

fresh_origin seeded
run_pages put-map 1 "$work/map.json" "$template"
expect "put-map は解説があれば index.html を残す" '[ "$(on_pages pr-explain/pr-1/index.html)" = old ]'
expect "put-map は change-map.json を更新する" '[ "$(on_pages pr-explain/pr-1/change-map.json)" = "{\"head\": \"new\"}" ]'

fresh_origin seeded
run_pages put-map 5 "$work/map.json" "$template"
expect "put-map は解説が無ければテンプレートを置く" '[ "$(on_pages pr-explain/pr-5/index.html)" = "$(cat "$template")" ]'
expect "put-map は新しいフォルダに change-map.json を置く" '[ "$(on_pages pr-explain/pr-5/change-map.json)" = "{\"head\": \"new\"}" ]'

fresh_origin seeded
run_pages remove 1
expect "remove はその PR のフォルダを消す" '[ "$(on_pages pr-explain/pr-1/index.html)" = "<none>" ]'
expect "remove 1 は pr-12 を消さない" '[ "$(on_pages pr-explain/pr-12/index.html)" = twelve ]'
expect "remove は pr-preview に触らない" '[ "$(on_pages pr-preview/pr-1/index.html)" = storybook ]'

fresh_origin seeded
before="$(tip)"
run_pages remove 99; status=$?
expect "消すフォルダが無い remove は変更なしで終わる" '[ "$status" -eq 0 ] && [ "$(tip)" = "$before" ]'

fresh_origin seeded
before="$(tip)"
run_pages put-page 1; status=$?
expect "put-page に断片が無ければ引数の誤り" '[ "$status" -eq 2 ] && [ "$(tip)" = "$before" ]'

fresh_origin seeded
before="$(tip)"
run_pages remove '1 ../..'; status=$?
expect "数字でない PR 番号は拒否する" '[ "$status" -eq 2 ] && [ "$(tip)" = "$before" ]'

fresh_origin seeded
reject_first_push
run_pages put-map 1 "$work/map.json" "$template"; status=$?
expect "1 回目の push が拒否されても取り直して通る" '[ "$status" -eq 0 ] && [ "$(cat "$work/pushes")" = 2 ] && [ "$(on_pages pr-explain/pr-1/change-map.json)" = "{\"head\": \"new\"}" ]'

fresh_origin empty
run_pages put-map 3 "$work/map.json" "$template"; status=$?
expect "gh-pages が無ければ orphan で作る" '[ "$status" -eq 0 ] && [ "$(on_pages pr-explain/pr-3/change-map.json)" = "{\"head\": \"new\"}" ] && [ "$(on_pages .nojekyll)" = "" ]'

fresh_origin empty
run_pages remove 3; status=$?
expect "gh-pages が無いときの remove は何も作らない" '[ "$status" -eq 0 ] && [ "$(tip)" = "<none>" ]'

exit "$cases_failed"
