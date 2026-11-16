#!/usr/bin/env bash
#
# 解説ページの置き場の判定表。ローカルの bare リポジトリを gh-pages の置き場にして
# `pr-explain-pages.sh` を走らせ、push された後の gh-pages が期待どおりかを 1 コマンドで確かめる。
#
# 使い方: bash .github/scripts/pr-explain-pages-cases.sh
# 出力が `ok` だけなら期待どおり。`NG` が 1 行でも出たら判定が変わっている。
#
# **他の PR のフォルダ・`pr-preview/` に触らないことを、どのモード(`put-list` を含む)でも見る。** gh-pages は
# Storybook と VRT の配信と同じブランチで、ここを壊すとこの機能の外まで消える。
# `put-map 1` が `pr-12` に触らない仕組みは 3 つある。作業コピーに展開するのが `pr-explain/pr-1/`
# だけ(sparse-checkout)・`remove_others`(フォルダ内の 3 つ以外を消す処理)が消すのは
# `git ls-files -- "$folder"` の範囲だけ・`commit_and_push` が `git add -A` するのは `paths` だけ。
# どれか 1 つが保たれていれば通り、3 つすべてを壊さない限りこのケースは落ちない。見ているのは 3 つが組み合わさった結果。
#
# 競合の再試行は、bare リポジトリの pre-receive フックで 1 回目の push だけを拒否して作る。
# 待ち時間は `PR_EXPLAIN_RETRY_WAIT=0` で消す。取り直しの間に gh-pages へ増えたフォルダは、拒否するのと同時に
# フックの中から別の clone でフォルダを足して push して作る。
#
# 解説の sha と抜粋は、スクリプトが置かれたリポジトリ(セッションの作業コピー)から読む。外側の
# リポジトリの HEAD は push 前の検査のときにまだリモートに無いので、スクリプトを一時リポジトリへ写し、
# push 済みのコミットと push していないコミットを作って使う。
set -uo pipefail

scripts_dir="$(cd "$(dirname "$0")" && pwd)"
repo_root="$(cd "$scripts_dir/../.." && pwd)"
template="$repo_root/.claude/skills/pr-explain/templates/index.html"
list_template="$repo_root/.claude/skills/pr-explain/templates/list.html"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

unset GIT_DIR GIT_WORK_TREE GIT_INDEX_FILE
export PR_EXPLAIN_REMOTE="file://$work/origin.git"
export PR_EXPLAIN_RETRY_WAIT=0
export GIT_AUTHOR_NAME=cases GIT_AUTHOR_EMAIL=cases@example.com
export GIT_COMMITTER_NAME=cases GIT_COMMITTER_EMAIL=cases@example.com

source "$repo_root/.claude/hooks/lib/cases-report.sh"

# セッションの作業コピー。`head` は追跡ブランチ(origin/topic)にあり、`unpushed` は無い。
session="$work/session"
git init --quiet -b topic "$session"
mkdir -p "$session/.github/scripts/lib"
cp "$scripts_dir/pr-explain-pages.sh" "$scripts_dir/build-pr-explain.py" "$scripts_dir/check-pr-explain-template.py" "$session/.github/scripts/"
cp "$scripts_dir/lib/embedded_regions.py" "$scripts_dir/lib/usage.sh" "$session/.github/scripts/lib/"
printf '{"name": "session"}\n' > "$session/package.json"
git -C "$session" add -A && git -C "$session" commit --quiet -m pushed
git init --quiet --bare "$work/session-origin.git"
git -C "$session" remote add origin "file://$work/session-origin.git"
git -C "$session" push --quiet origin topic 2>/dev/null
head="$(git -C "$session" rev-parse HEAD)"
echo local > "$session/local.txt"
git -C "$session" add -A && git -C "$session" commit --quiet -m unpushed
unpushed="$(git -C "$session" rev-parse HEAD)"
pages="$session/.github/scripts/pr-explain-pages.sh"

# 置き場の種に置くファイルのうち、触っていないことを表明するものと、その中身。種を書くのも表明するのもここを引く。
declare -A seed_files=(
  [pr-preview/pr-1/index.html]=storybook
  [pr-explain/pr-1/index.html]=old
  [pr-explain/pr-1/change-map.json]="{\"version\": 2, \"head\": \"$head\"}"
  [pr-explain/pr-1/explain.json]='{"old": "explain"}'
  [pr-explain/pr-12/index.html]=twelve
  [pr-explain/index.html]=old-list
  [pr-explain/list.json]='{"version": 1, "pages": [{"pr": 99, "title": "九十九"}, {"pr": 3, "title": "古い題"}]}'
)

# 解説として通るもの(PR #1 宛て・push 済みのコミット時点)と、検査に落ちるもの。抜粋は
# 検査が中身を足すので、置かれたものが検査の書き出しかどうかが `text` の有無で分かる。
python3 - "$work" "$head" "$unpushed" <<'PY'
import json, sys
work, head, unpushed = sys.argv[1:4]
explain = {
    "version": 1, "pr": 1, "sha": head,
    "overview": {"title": "書いた解説", "lead": "要約", "before": [], "after": [{"text": "後"}]},
    "calls": {"boxes": [], "edges": []},
    "suites": [{"id": "s", "label": "置き場", "file": "package.json"}],
    "tests": [{"id": "t", "suite": "s", "name": "n", "techniques": ["state"], "why": "w", "given": "g", "when": "w", "then": "t",
               "excerpt": {"path": "package.json", "start": 1, "end": 1}}],
}
write = lambda name, value: open(f"{work}/{name}", "w", encoding="utf-8").write(json.dumps(value, ensure_ascii=False))
write("explain.json", explain)
write("broken.json", {**explain, "version": 2})
write("explain-7.json", {**explain, "pr": 7})
write("explain-2.json", {**explain, "pr": 2})
write("unpushed.json", {**explain, "sha": unpushed})
write("map.json", {"version": 2, "head": "new"})
PY
broken_template="$work/broken-template.html"
sed 's/<script>/<script> /' "$template" > "$broken_template"
broken_list_template="$work/broken-list-template.html"
sed 's/<script>/<script> /' "$list_template" > "$broken_list_template"

# 題の応答の見本(`gh api graphql --paginate --slurp` の形 = ページの配列)。通る応答は 2 ページで、PR 12 は
# 2 ページ目にだけあり、PR 40 と 7 は gh-pages にフォルダが無い。壊れた応答は通る応答を 1 か所ずつ崩す。
python3 - "$work" <<'PY'
import copy, json, sys
work = sys.argv[1]
page = lambda nodes, has_next: {"data": {"repository": {"pullRequests": {"nodes": nodes, "pageInfo": {"hasNextPage": has_next, "endCursor": "c"}}}}}
node = lambda number, title: {"number": number, "title": title}
pull_requests = [page([node(1, "一"), node(2, "<b>二</b>")], True), page([node(12, "十二"), node(40, "四十"), node(7, "七")], False)]
def broken(change):
    pages = copy.deepcopy(pull_requests)
    change(pages)
    return pages
connection = lambda pages, index: pages[index]["data"]["repository"]["pullRequests"]
write = lambda name, text: open(f"{work}/{name}", "w", encoding="utf-8").write(text)
dumped = lambda value: json.dumps(value, ensure_ascii=False)
write("pull-requests.json", dumped(pull_requests))
write("pull-requests-none.json", dumped([page([], False)]))
write("pull-requests-empty.json", "")
write("pull-requests-concatenated.json", "".join(dumped(each) for each in pull_requests))
write("pull-requests-no-pages.json", "[]")
write("pull-requests-errors.json", dumped(broken(lambda pages: pages[1].update({"errors": [{"message": "x"}]}))))
write("pull-requests-no-title.json", dumped(broken(lambda pages: connection(pages, 1)["nodes"][0].pop("title"))))
write("pull-requests-string-number.json", dumped(broken(lambda pages: connection(pages, 1)["nodes"][0].update({"number": "12"}))))
write("pull-requests-no-repository.json", dumped(broken(lambda pages: pages[1]["data"].pop("repository"))))
write("pull-requests-cut.json", dumped(broken(lambda pages: connection(pages, 1)["pageInfo"].update({"hasNextPage": True}))))
write("pull-requests-no-page-info.json", dumped(broken(lambda pages: connection(pages, 0).pop("pageInfo"))))
write("pull-requests-nodes-not-list.json", dumped(broken(lambda pages: connection(pages, 1).update({"nodes": {}}))))
PY

# `seed_files` の 1 ファイルを種(`$work/seed`)に書く。
# $1 `seed_files` のパス
write_seed() {
  mkdir -p "$(dirname "$work/seed/$1")" && printf '%s\n' "${seed_files[$1]}" > "$work/seed/$1"
}

# gh-pages を持つ bare リポジトリを作り直す。
# $1 `seeded` なら既存の PR のフォルダ・前の一覧・`pr-<番号>` の形でないフォルダと pr-preview を置く。
#    `site-only` なら `.nojekyll` と pr-preview だけ(`pr-explain/` が無い)。`empty` なら gh-pages を作らない
fresh_origin() {
  rm -rf "$work/origin.git" "$work/seed" "$work/pushes" "$work/other-clone"
  git init --quiet --bare "$work/origin.git"
  git -C "$work/origin.git" config uploadpack.allowFilter true
  [ "$1" = "empty" ] && return 0
  git init --quiet -b gh-pages "$work/seed"
  write_seed pr-preview/pr-1/index.html
  touch "$work/seed/.nojekyll"
  [ "$1" = "seeded" ] && seed_pr_explain
  git -C "$work/seed" add -A && git -C "$work/seed" commit --quiet -m seed
  git -C "$work/seed" push --quiet "$work/origin.git" gh-pages 2>/dev/null
}

# 置き場の種に `pr-explain/` を足す(PR のフォルダ・前の一覧・`pr-<番号>` の形でないフォルダ)。PR 3 は題の応答に無く、
# 前の一覧には PR 3 の題と gh-pages に無い PR 99 の行がある。
seed_pr_explain() {
  write_seed pr-explain/pr-1/index.html
  write_seed pr-explain/pr-1/change-map.json
  write_seed pr-explain/pr-1/explain.json
  echo behavior > "$work/seed/pr-explain/pr-1/behavior.html"
  mkdir -p "$work/seed/pr-explain/pr-1/assets"
  echo asset > "$work/seed/pr-explain/pr-1/assets/x.css"
  mkdir -p "$work/seed/pr-explain/pr-2"
  echo '{"version": 2, "head": "0000000"}' > "$work/seed/pr-explain/pr-2/change-map.json"
  write_seed pr-explain/pr-12/index.html
  echo '{"head": "twelve"}' > "$work/seed/pr-explain/pr-12/change-map.json"
  mkdir -p "$work/seed/pr-explain/pr-3"
  echo '{"head": "three"}' > "$work/seed/pr-explain/pr-3/change-map.json"
  mkdir -p "$work/seed/pr-explain/pr-01" "$work/seed/pr-explain/notes" "$work/seed/pr-explain/pr-12-old"
  echo x > "$work/seed/pr-explain/pr-01/x"
  echo x > "$work/seed/pr-explain/notes/x"
  echo x > "$work/seed/pr-explain/pr-12-old/x"
  write_seed pr-explain/index.html
  write_seed pr-explain/list.json
}

# 1 回目の push だけを拒否する pre-receive フックを置く。
# $1 (省略可)拒否するときに、別の clone から gh-pages へ足すフォルダ(取り直しの間に増えた分)。フックの中の
#    git は受け取り中のリポジトリを指す環境変数を持つので、外してから clone する(外さないと not a git repository で落ちる)
reject_first_push() {
  local other_clone="$work/other-clone" added="${1:-}"
  cat > "$work/origin.git/hooks/pre-receive" <<HOOK
#!/usr/bin/env bash
count=\$(( \$(cat "$work/pushes" 2>/dev/null || echo 0) + 1 ))
echo "\$count" > "$work/pushes"
[ "\$count" -gt 1 ] && exit 0
[ -n "$added" ] || exit 1
(
  unset GIT_DIR GIT_QUARANTINE_PATH GIT_OBJECT_DIRECTORY GIT_ALTERNATE_OBJECT_DIRECTORIES
  git clone --quiet --branch gh-pages "file://$work/origin.git" "$other_clone" &&
    mkdir -p "$other_clone/$added" && echo other-clone > "$other_clone/$added/index.html" &&
    git -C "$other_clone" add -A && git -C "$other_clone" commit --quiet -m other-clone &&
    git -C "$other_clone" push --quiet origin gh-pages
) >/dev/null 2>&1
exit 1
HOOK
  chmod +x "$work/origin.git/hooks/pre-receive"
}

# gh-pages 上のファイルの中身。無ければ `<none>`。
on_pages() {
  git --git-dir="$work/origin.git" show "gh-pages:$1" 2>/dev/null || echo "<none>"
}

# gh-pages 上のファイルが文字列を含むか。`grep -q` にしないのは、見つけた時点で読むのをやめ、
# 書き終わっていない `git show` が SIGPIPE で落ちて pipefail で偽になるため(ページが大きいと時々落ちる)。
page_has() {
  on_pages "$1" | grep -F "$2" >/dev/null
}

tip() {
  git --git-dir="$work/origin.git" rev-parse --verify --quiet gh-pages || echo "<none>"
}

# gh-pages の一覧(list.json)から引いたもの。読めなければ `<broken>`。
# $1 `numbers`(行の番号の並び)/ `count`(行の数)/ `version` / `rows`(行の番号と題の並び)/
#    `title`(`$2` の番号の行の題。行が無ければ `<none>`)
listed() {
  on_pages pr-explain/list.json | python3 -c '
import json, sys
listing = json.load(sys.stdin)
rows = listing["pages"]
titles = {str(row["pr"]): row["title"] for row in rows}
answers = {
    "numbers": lambda: json.dumps([row["pr"] for row in rows]),
    "count": lambda: str(len(rows)),
    "version": lambda: json.dumps(listing["version"]),
    "rows": lambda: json.dumps([[row["pr"], row["title"]] for row in rows], ensure_ascii=False),
    "title": lambda: json.dumps(titles[sys.argv[2]], ensure_ascii=False) if sys.argv[2] in titles else "<none>",
}
print(answers[sys.argv[1]]())
' "$@" 2>/dev/null || echo "<broken>"
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

# 置いた explain.json が、検査の書き出し(抜粋に text がある)か。
placed_by_builder() {
  on_pages pr-explain/pr-1/explain.json | python3 -c 'import json, sys; e = json.load(sys.stdin); sys.exit(0 if e["overview"]["title"] == "書いた解説" and "text" in e["tests"][0]["excerpt"] else 1)'
}

# gh-pages 上のファイルが、どれも種(`seed_files`)のまま残っているか。
# $@ `seed_files` のパス
kept_as_seeded() {
  local path
  for path in "$@"; do
    [ "$(on_pages "$path")" = "${seed_files[$path]}" ] || return 1
  done
}

fresh_origin seeded
errors="$(bash "$pages" put-explain 1 "$work/explain.json" 2>&1 >/dev/null)"; status=$?
expect "put-explain は explain.json を置き、index.html と change-map.json に触らない" '[ "$status" -eq 0 ] && placed_by_builder && kept_as_seeded pr-explain/pr-1/index.html pr-explain/pr-1/change-map.json'
expect "put-explain が置くのは、検査が抜粋の中身を足して書き出したもの" 'placed_by_builder'
expect "put-explain は他の PR のフォルダに触らない" 'kept_as_seeded pr-explain/pr-12/index.html'
expect "put-explain は pr-preview に触らない" 'kept_as_seeded pr-preview/pr-1/index.html'
expect "put-explain は一覧(pr-explain/index.html と list.json)に触らない" 'kept_as_seeded pr-explain/index.html pr-explain/list.json'

fresh_origin seeded
stale_errors="$(bash "$pages" put-explain 2 "$work/explain-2.json" 2>&1 >/dev/null)"; stale_status=$?
expect "解説の sha が地図の head と違えば、置いたうえで標準エラーに知らせる(同じなら知らせない)" '[ "$stale_status" -eq 0 ] && [[ "$stale_errors" == *"地図の head"* ]] && [[ "$errors" != *"地図の head"* ]]'

fresh_origin seeded
before="$(tip)"
output="$(bash "$pages" put-explain 1 "$work/broken.json" 2>&1)"; status=$?
expect "検査に落ちる解説は、取り直しへ進まずに push しない" '[ "$status" -eq 1 ] && [ "$(tip)" = "$before" ] && [[ "$output" == *"[pr-explain-shape]"* ]] && [[ "$output" != *"反映に失敗"* ]]'

fresh_origin seeded
before="$(tip)"
output="$(bash "$pages" put-explain 1 "$work/unpushed.json" 2>&1)"; status=$?
expect "解説の sha がリモートの追跡ブランチに無ければ、検査を通っても置かずに 1" '[ "$status" -eq 1 ] && [ "$(tip)" = "$before" ] && [[ "$output" == *"追跡ブランチ"* ]] && [[ "$output" != *"[pr-explain-"* ]]'

fresh_origin seeded
before="$(tip)"
run_pages put-explain 7 "$work/explain-7.json"; status=$?
expect "地図の無いフォルダへは put-explain しない" '[ "$status" -eq 3 ] && [ "$(tip)" = "$before" ] && [ "$(on_pages pr-explain/pr-7/explain.json)" = "<none>" ]'

fresh_origin seeded
before="$(tip)"
run_pages put-explain 1; status=$?
expect "put-explain に解説が無ければ引数の誤り" '[ "$status" -eq 2 ] && [ "$(tip)" = "$before" ]'

fresh_origin seeded
before="$(tip)"
run_pages put-page 1 index "$work/explain.json"; status=$?
expect "put-page は知らないモード(引数の誤り)" '[ "$status" -eq 2 ] && [ "$(tip)" = "$before" ]'

mkdir -p "$work/without-lib"
cp "$pages" "$work/without-lib/"
fresh_origin seeded
before="$(tip)"
bash "$work/without-lib/pr-explain-pages.sh" put-page 1 index "$work/explain.json" >/dev/null 2>&1; status=$?
expect "読み込む lib が無ければ、知らないモードでも引数の誤りへ進まず 127 で何も push しない" '[ "$status" -eq 127 ] && [ "$(tip)" = "$before" ]'

fresh_origin seeded
run_pages put-map 1 "$work/map.json" "$template"
expect "put-map は index.html を毎回テンプレートで上書きする" '[ "$(on_pages pr-explain/pr-1/index.html)" = "$(cat "$template")" ]'
expect "put-map は explain.json を残す" 'kept_as_seeded pr-explain/pr-1/explain.json'
expect "put-map は 3 ファイル以外(ほかのファイル・サブフォルダ)を消す" '[ "$(on_pages pr-explain/pr-1/behavior.html)" = "<none>" ] && [ "$(on_pages pr-explain/pr-1/assets/x.css)" = "<none>" ]'
expect "put-map は change-map.json を更新する" '[ "$(on_pages pr-explain/pr-1/change-map.json)" = "$(cat "$work/map.json")" ]'
expect "put-map は他の PR のフォルダに触らない" 'kept_as_seeded pr-explain/pr-12/index.html'
expect "put-map は pr-preview に触らない" 'kept_as_seeded pr-preview/pr-1/index.html'
expect "put-map は一覧(pr-explain/index.html と list.json)に触らない" 'kept_as_seeded pr-explain/index.html pr-explain/list.json'

fresh_origin seeded
run_pages put-map 5 "$work/map.json" "$template"
expect "put-map は新しいフォルダにテンプレートを置く" '[ "$(on_pages pr-explain/pr-5/index.html)" = "$(cat "$template")" ]'
expect "put-map は新しいフォルダに change-map.json を置く" '[ "$(on_pages pr-explain/pr-5/change-map.json)" = "$(cat "$work/map.json")" ]'

fresh_origin seeded
before="$(tip)"
output="$(bash "$pages" put-map 1 "$work/map.json" "$broken_template" 2>&1)"; status=$?
expect "CSP の合わないテンプレートの put-map は 1 で、push しない" '[ "$status" -eq 1 ] && [ "$(tip)" = "$before" ] && [[ "$output" == *"[pr-explain-csp]"* ]]'

fresh_origin seeded
before="$(tip)"
run_pages remove 1; status=$?
expect "remove は知らないモードとして 2 で終わり、PR のフォルダを消さない" '[ "$status" -eq 2 ] && [ "$(tip)" = "$before" ] && kept_as_seeded pr-explain/pr-1/index.html'

fresh_origin seeded
before="$(tip)"
run_pages put-map '1 ../..' "$work/map.json" "$template"; status=$?
run_pages put-explain '1 ../..' "$work/explain.json"; explain_status=$?
expect "数字でない PR 番号は拒否する" '[ "$status" -eq 2 ] && [ "$explain_status" -eq 2 ] && [ "$(tip)" = "$before" ]'

fresh_origin seeded
reject_first_push
run_pages put-map 1 "$work/map.json" "$template"; status=$?
expect "1 回目の push が拒否されても取り直して通る" '[ "$status" -eq 0 ] && [ "$(cat "$work/pushes")" = 2 ] && [ "$(on_pages pr-explain/pr-1/change-map.json)" = "$(cat "$work/map.json")" ]'

fresh_origin empty
run_pages put-map 3 "$work/map.json" "$template"; status=$?
expect "gh-pages が無ければ orphan で作る" '[ "$status" -eq 0 ] && [ "$(on_pages pr-explain/pr-3/change-map.json)" = "$(cat "$work/map.json")" ] && [ "$(on_pages .nojekyll)" = "" ]'

fresh_origin seeded
run_pages put-list "$work/pull-requests.json" "$list_template"; status=$?
expect "put-list は gh-pages の PR のフォルダを、番号の大きい順にすべて載せる" '[ "$status" -eq 0 ] && [ "$(listed numbers)" = "[12, 3, 2, 1]" ]'
expect "put-list は pr-<番号> の形でないフォルダ(notes・pr-01・pr-12-old)を載せない" '[ "$(listed count)" = 4 ]'
expect "put-list は 1 ページ目にある PR を、その題のまま載せる(<b> を含む綴りも変えない)" '[ "$(listed title 1)" = "\"一\"" ] && [ "$(listed title 2)" = "\"<b>二</b>\"" ]'
expect "put-list は 2 ページ目にしか無い PR も題付きで載せる" '[ "$(listed title 12)" = "\"十二\"" ]'
expect "put-list は応答にあってもフォルダの無い PR を載せない" '[ "$(listed title 7)" = "<none>" ] && [ "$(listed title 40)" = "<none>" ]'
expect "put-list は前の list.json にある、gh-pages に無い PR(99)の行を一覧に出さない" '[ "$(listed title 99)" = "<none>" ]'
expect "put-list は応答に無い PR の題に前の list.json の題を使わず、null のままにする" '[ "$(listed title 3)" = null ]'
expect "put-list は一覧の枠をテンプレートのまま pr-explain/index.html に置く" '[ "$(on_pages pr-explain/index.html)" = "$(cat "$list_template")" ]'
expect "put-list は PR のフォルダ(pr-1 の 3 ファイル・pr-12)と pr-preview に触らない" 'kept_as_seeded pr-explain/pr-1/index.html pr-explain/pr-1/change-map.json pr-explain/pr-1/explain.json pr-explain/pr-12/index.html pr-preview/pr-1/index.html'
before="$(tip)"
run_pages put-list "$work/pull-requests.json" "$list_template"; status=$?
expect "put-list は一覧も枠も変わらなければ push しない" '[ "$status" -eq 0 ] && [ "$(tip)" = "$before" ]'

fresh_origin seeded
printf '{\n' > "$work/seed/pr-explain/list.json"
git -C "$work/seed" commit --quiet -am broken-list && git -C "$work/seed" push --quiet "$work/origin.git" gh-pages 2>/dev/null
run_pages put-list "$work/pull-requests.json" "$list_template"; status=$?
expect "put-list は前の list.json が壊れていても、読まずに作り直す" '[ "$status" -eq 0 ] && [ "$(listed version)" = 1 ]'

fresh_origin seeded
run_pages put-list "$work/pull-requests.json" "$list_template"
run_pages put-map 5 "$work/map.json" "$template"
run_pages put-list "$work/pull-requests.json" "$list_template"; status=$?
expect "応答に無い PR(put-map で増やしたフォルダ)は、次の put-list に題なし(null)で載る" '[ "$status" -eq 0 ] && [ "$(listed title 5)" = null ]'

fresh_origin seeded
run_pages put-list "$work/pull-requests-none.json" "$list_template"; status=$?
expect "PR の一覧が 0 件の応答では、フォルダはすべて題なしで載る" '[ "$status" -eq 0 ] && [ "$(listed rows)" = "[[12, null], [3, null], [2, null], [1, null]]" ]'

fresh_origin seeded
reject_first_push pr-explain/pr-40
run_pages put-list "$work/pull-requests.json" "$list_template"; status=$?
expect "取り直しの間に gh-pages へ増えたフォルダも、題付きで一覧に載る" '[ "$status" -eq 0 ] && [ "$(on_pages pr-explain/pr-40/index.html)" = other-clone ] && [ "$(listed title 40)" = "\"四十\"" ]'

fresh_origin seeded
before="$(tip)"
output="$(bash "$pages" put-list "$work/pull-requests.json" "$broken_list_template" 2>&1)"; status=$?
expect "CSP の合わない一覧の枠の put-list は 1 で、push しない" '[ "$status" -eq 1 ] && [ "$(tip)" = "$before" ] && [[ "$output" == *"[pr-explain-csp]"* ]]'

# 題の応答が読めない・全件そろっていない見本と、その形。
broken_responses="$(cat <<'RESPONSES'
empty|空
concatenated|2 ページを --slurp なしで連結したもの
no-pages|空の配列
errors|2 ページ目に errors がある
no-title|2 ページ目の PR に title が無い
string-number|PR の number が文字列
no-repository|data に repository が無い
cut|最後のページの hasNextPage が true(応答が途中で切れている)
no-page-info|pageInfo の無いページがある
nodes-not-list|pageInfo はあるが nodes が配列でない
RESPONSES
)"
cases_before=$cases_reported
while IFS='|' read -r name shape; do
  [ -n "$name" ] || continue
  fresh_origin seeded
  before="$(tip)"
  output="$(bash "$pages" put-list "$work/pull-requests-$name.json" "$list_template" 2>&1)"; status=$?
  expect "題の応答が「$shape」なら、clone へ進まず 1 で終わり push しない" '[ "$status" -eq 1 ] && [ "$(tip)" = "$before" ] && [[ "$output" == *"題の応答"* ]] && [[ "$output" != *"反映に失敗"* ]]'
done <<<"$broken_responses"
report_cases_ran broken_responses "$cases_before"

fresh_origin empty
output="$(bash "$pages" put-list "$work/pull-requests-errors.json" "$list_template" 2>&1)"; status=$?
expect "gh-pages が無くても、題の応答が読めなければ clone へ進まず 1 で終わる" '[ "$status" -eq 1 ] && [ "$(tip)" = "<none>" ] && [[ "$output" == *"題の応答"* ]]'

fresh_origin seeded
before="$(tip)"
run_pages put-list "$work/missing.json" "$list_template"; missing_response=$?
run_pages put-list "$work/pull-requests.json" "$work/missing.html"; missing_template=$?
run_pages put-list "$work/pull-requests.json"; too_few=$?
run_pages put-list "$work/pull-requests.json" "$list_template" extra; too_many=$?
expect "put-list に題の応答か枠が無い、または引数が 3 つでなければ引数の誤り" '[ "$missing_response" -eq 2 ] && [ "$missing_template" -eq 2 ] && [ "$too_few" -eq 2 ] && [ "$too_many" -eq 2 ] && [ "$(tip)" = "$before" ]'

fresh_origin empty
run_pages put-list "$work/pull-requests.json" "$list_template"; status=$?
expect "gh-pages が無ければ、put-list は 0 で終わり何も作らない" '[ "$status" -eq 0 ] && [ "$(tip)" = "<none>" ]'

fresh_origin site-only
run_pages put-list "$work/pull-requests.json" "$list_template"; status=$?
expect "gh-pages はあるが pr-explain/ が無ければ、0 件の一覧と枠を置く" '[ "$status" -eq 0 ] && [ "$(listed rows)" = "[]" ] && [ "$(on_pages pr-explain/index.html)" = "$(cat "$list_template")" ]'

exit "$cases_failed"
