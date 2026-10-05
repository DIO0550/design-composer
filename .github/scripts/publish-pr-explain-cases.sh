#!/usr/bin/env bash
#
# 解説ページの公開の判定表。ローカルの bare リポジトリを gh-pages の置き場にして
# `publish-pr-explain.sh` を走らせ、push された後の gh-pages が期待どおりかを 1 コマンドで確かめる。
#
# 使い方: bash .github/scripts/publish-pr-explain-cases.sh
# 出力が `ok` だけなら期待どおり。`NG` が 1 行でも出たら判定が変わっている。
#
# **他の PR のフォルダ・`pr-preview/` に触らないことを、どのモードでも見る。** gh-pages は
# Storybook と VRT の配信と同じブランチで、ここを壊すとこの機能の外まで消える。
# `remove 1` が `pr-12` を消さないケースは、`pr-$pr*` のような前方一致の取り違えを捕まえる。
#
# 競合の再試行は、bare リポジトリの pre-receive フックで 1 回目の push だけを拒否して作る。
# 待ち時間は `PR_EXPLAIN_RETRY_WAIT=0` で消す。
set -uo pipefail

scripts_dir="$(cd "$(dirname "$0")" && pwd)"
repo_root="$(cd "$scripts_dir/../.." && pwd)"
publisher="$scripts_dir/publish-pr-explain.sh"
template="$repo_root/.claude/skills/pr-explain/templates/index.html"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

unset GIT_DIR GIT_WORK_TREE GIT_INDEX_FILE
export PR_EXPLAIN_REMOTE="file://$work/origin.git"
export PR_EXPLAIN_RETRY_WAIT=0
export GIT_AUTHOR_NAME=cases GIT_AUTHOR_EMAIL=cases@example.com
export GIT_COMMITTER_NAME=cases GIT_COMMITTER_EMAIL=cases@example.com

source "$repo_root/.claude/hooks/lib/cases-report.sh"

# 解説として通るページ(テンプレートのマーカーの間に見出しを入れたもの)と、検査に落ちるページ。
python3 - "$template" "$work" <<'PY'
import sys
template, work = sys.argv[1], sys.argv[2]
text = open(template, encoding="utf-8").read()
written = text.replace("<!-- EXPLAIN:BEGIN -->", '<!-- EXPLAIN:BEGIN -->\n<h1>書いた解説</h1>', 1)
open(f"{work}/page.html", "w", encoding="utf-8").write(written)
broken = text.replace("<!-- EXPLAIN:BEGIN -->", '<!-- EXPLAIN:BEGIN -->\n<script>alert(1)</script>', 1)
open(f"{work}/broken.html", "w", encoding="utf-8").write(broken)
PY
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
  git --git-dir="$work/origin.git" rev-parse gh-pages 2>/dev/null || echo "<none>"
}

# $1 ケース名, $2 判定の式(bash の条件。真なら pass)
expect() {
  if eval "$2"; then decision=pass; else decision=deny; fi
  report pass "$decision" "$1"
}

publish() {
  bash "$publisher" "$@" >/dev/null 2>&1
}

fresh_origin seeded
publish page 1 "$work/page.html"
expect "page は index.html を上書きする" 'on_pages pr-explain/pr-1/index.html | grep -q "書いた解説"'
expect "page は change-map.json に触らない" '[ "$(on_pages pr-explain/pr-1/change-map.json)" = "{\"head\": \"old\"}" ]'
expect "page は他の PR のフォルダに触らない" '[ "$(on_pages pr-explain/pr-12/index.html)" = twelve ]'
expect "page は pr-preview に触らない" '[ "$(on_pages pr-preview/pr-1/index.html)" = storybook ]'

fresh_origin seeded
before="$(tip)"
publish page 1 "$work/broken.html"; status=$?
expect "検査に落ちる解説は push しない" '[ "$status" -eq 1 ] && [ "$(tip)" = "$before" ]'

fresh_origin seeded
before="$(tip)"
publish page 7 "$work/page.html"; status=$?
expect "地図の無いフォルダへは page を置かない" '[ "$status" -eq 3 ] && [ "$(tip)" = "$before" ] && [ "$(on_pages pr-explain/pr-7/index.html)" = "<none>" ]'

fresh_origin seeded
publish map 1 "$work/map.json" "$template"
expect "map は解説があれば index.html を残す" '[ "$(on_pages pr-explain/pr-1/index.html)" = old ]'
expect "map は change-map.json を更新する" '[ "$(on_pages pr-explain/pr-1/change-map.json)" = "{\"head\": \"new\"}" ]'

fresh_origin seeded
publish map 5 "$work/map.json" "$template"
expect "map は解説が無ければテンプレートを置く" '[ "$(on_pages pr-explain/pr-5/index.html)" = "$(cat "$template")" ]'
expect "map は新しいフォルダに change-map.json を置く" '[ "$(on_pages pr-explain/pr-5/change-map.json)" = "{\"head\": \"new\"}" ]'

fresh_origin seeded
publish remove 1
expect "remove はその PR のフォルダを消す" '[ "$(on_pages pr-explain/pr-1/index.html)" = "<none>" ]'
expect "remove 1 は pr-12 を消さない" '[ "$(on_pages pr-explain/pr-12/index.html)" = twelve ]'
expect "remove は pr-preview に触らない" '[ "$(on_pages pr-preview/pr-1/index.html)" = storybook ]'

fresh_origin seeded
before="$(tip)"
publish remove '1 ../..'; status=$?
expect "数字でない PR 番号は拒否する" '[ "$status" -eq 2 ] && [ "$(tip)" = "$before" ]'

fresh_origin seeded
reject_first_push
publish map 1 "$work/map.json" "$template"; status=$?
expect "1 回目の push が拒否されても取り直して通る" '[ "$status" -eq 0 ] && [ "$(cat "$work/pushes")" = 2 ] && [ "$(on_pages pr-explain/pr-1/change-map.json)" = "{\"head\": \"new\"}" ]'

fresh_origin empty
publish map 3 "$work/map.json" "$template"; status=$?
expect "gh-pages が無ければ orphan で作る" '[ "$status" -eq 0 ] && [ "$(on_pages pr-explain/pr-3/change-map.json)" = "{\"head\": \"new\"}" ] && [ "$(on_pages .nojekyll)" = "" ]'

exit "$cases_failed"
