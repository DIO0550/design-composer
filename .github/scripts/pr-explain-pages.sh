#!/usr/bin/env bash
#
# gh-pages の `pr-explain/pr-<番号>/`(PR の解説ページ)と、その一覧(`pr-explain/index.html` と
# `pr-explain/list.json`)を書き換える。
#
# 使い方:
#   pr-explain-pages.sh put-explain <PR 番号> <explain.json>                 … 解説を検査して置く(セッションが呼ぶ)
#   pr-explain-pages.sh put-map     <PR 番号> <change-map.json> <テンプレート>  … 枠と変更の地図を置く(Actions が呼ぶ)
#   pr-explain-pages.sh put-list    <題の応答> <一覧の枠>                    … 一覧を作り直す(Actions が呼ぶ)
#
# PR のフォルダに置くのは `index.html`(枠)・`change-map.json`(地図)・`explain.json`(解説)の 3 つだけ。
#
# - `put-explain` は `build-pr-explain.py` が検査して書き出したもの(抜粋の中身を足したもの)を
#   `explain.json` として置く。違反があれば push しない。触るのはこの 1 ファイルだけ
# - `put-explain` は、解説の sha がリモートの追跡ブランチ(`git branch -r --contains`)に無ければ置かない。
#   抜粋はその sha の中身から読むので、push していないコミットの中身を公開しないため
# - `put-explain` は `change-map.json` が無いフォルダへは置かない。地図と枠の無いフォルダに解説だけを
#   置いても開けるページにならないため。地図が無いのは、Actions が地図を置く前と、閉じたときに以前の
#   `PR Explain` がフォルダごと消した PR(#1394 で消すのをやめる前)。
#   解説の sha が地図の head と違えば、置いたうえで標準エラーに知らせる(古い解説も、ページが解説の
#   時点を帯で出すので読める)
# - `put-map` は clone の前に `check-pr-explain-template.py` で枠を検査し、`index.html` を毎回
#   上書きする。枠の変わったコミット(main の取り込みを含む)が、次の push でそのままページに効くように。
#   フォルダには 3 つだけを置く、という形を保つため、それ以外のファイルは消す
# - `put-list` は `pr-explain/index.html`(一覧の枠)と `pr-explain/list.json`(一覧)の 2 つだけを置き換える。
#   一覧は、取り直した gh-pages にある `pr-explain/pr-<番号>/` のフォルダを番号の大きい順に並べ、題を題の応答
#   (`gh api graphql --paginate --slurp` の出力。ページの配列)から引く。前の `list.json` は読まない(導出できる
#   値を読み戻すと、外の編集や壊れた一覧が入力になる)
# - `put-list` で題が `null` になるのは、応答に無い番号のフォルダ(問い合わせの後に開いた PR と、PR でない番号)だけ
# - `put-list` は clone の前に、題の応答が全件そろっていること(どのページにも `errors` が無く、最後のページの
#   `hasNextPage` が false)を確かめる。欠けた応答から作ると、題の無い行が黙って増えるため
# - `put-list` は gh-pages が無ければ作らない。0 件の一覧のためだけにブランチを作らず、次の `put-map` が作った
#   後に走る run が一覧を置く
#
# gh-pages は Storybook 本体・PR プレビュー・VRT の撮影結果で数百 MB あるので、blob を取らない
# 浅い clone から `pr-explain/pr-<番号>/` だけ(`put-list` は一覧の 2 ファイルだけ)を展開する。他のワークフロー
# との push の競合は、取り直しからやり直して吸収する(最大 5 回)。
#
# 環境変数:
#   PR_EXPLAIN_REMOTE      push 先(既定はこのリポジトリの origin)
#   PR_EXPLAIN_RETRY_WAIT  n 回目の失敗の後に n × この秒数だけ待つ(既定 2)
#
# 終了コード: 0 = 置いた / 変更が無かった / `put-list` で gh-pages が無い、1 = 解説か枠が検査に落ちた・
#             解説の sha を push していない・`put-list` の題の応答が読めないか全件そろっていない・
#             push できなかった、2 =引数の誤り(知らないモードを含む)、3 = `put-explain` の置き先に地図が
#             無い(理由は上の `put-explain` の項。やり直さない)、
#             127 = 読み込む `lib/usage.sh` を読み込めない(何も触らずに返す)
set -uo pipefail

scripts_dir="$(cd "$(dirname "$0")" && pwd)"
branch="gh-pages"
max_attempts=5
retry_wait="${PR_EXPLAIN_RETRY_WAIT:-2}"

. "$scripts_dir/lib/usage.sh" || exit 127

is_pr_number() {
  [[ "$1" =~ ^[1-9][0-9]*$ ]]
}

mode="${1:-}"
case "$mode" in
  put-explain) args_ok=$([ $# -eq 3 ] && is_pr_number "$2" && [ -f "$3" ] && echo yes) ;;
  put-map) args_ok=$([ $# -eq 4 ] && is_pr_number "$2" && [ -f "$3" ] && [ -f "$4" ] && echo yes) ;;
  put-list) args_ok=$([ $# -eq 3 ] && [ -f "$2" ] && [ -f "$3" ] && echo yes) ;;
  *) args_ok="" ;;
esac
[ "$args_ok" = yes ] || usage

remote="${PR_EXPLAIN_REMOTE:-$(git -C "$scripts_dir" remote get-url origin)}"
# paths は書き換えて `git add` する対象、sparse は展開するパターン、label は結果の行に出す名前。
case "$mode" in
  put-list)
    paths=(pr-explain/index.html pr-explain/list.json)
    sparse=(/pr-explain/index.html /pr-explain/list.json)
    label="pr-explain の一覧"
    message="PR explain list"
    ;;
  *)
    pr="$2"
    folder="pr-explain/pr-$pr"
    paths=("$folder")
    sparse=("/$folder/")
    label="$folder"
    message="PR explain #$pr ($mode)"
    ;;
esac
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

# 解説の sha が、リモートの追跡ブランチのどれかに入っているか。
# $1 解説を書き出したファイル
is_pushed_explain() {
  local sha
  sha="$(python3 -c 'import json, sys; print(json.load(open(sys.argv[1], encoding="utf-8"))["sha"])' "$1")" || return 1
  [ -n "$(git -C "$scripts_dir" branch -r --contains "$sha" 2>/dev/null)" ]
}

# 題の応答(`gh api graphql --paginate --slurp` の出力。ページの配列)を `{"番号": 題}` にして書き出す。
# 応答が空・JSON でない・空でないページの配列でない・どれかのページに `errors` がある・`pullRequests` の
# `nodes` か `pageInfo.hasNextPage` の形が違う・最後のページの `hasNextPage` が false でない・PR の番号か題の形が
# 違う、のどれかなら、理由を標準エラーに出して 1 を返す。
# $1 題の応答, $2 書き出す先
collect_titles() {
  python3 - "$1" "$2" <<'PY'
import json, sys

source, out = sys.argv[1:3]


def at(value, keys):
    """辞書を keys の順にたどった先。途中が辞書でなければ None。"""
    for key in keys:
        value = value.get(key) if isinstance(value, dict) else None
    return value


def is_pr_number(value):
    return isinstance(value, int) and not isinstance(value, bool) and value > 0


def first_problem(problems):
    """並びのうち最初の None でないもの。無ければ None。"""
    return next((problem for problem in problems if problem is not None), None)


def node_problem(node):
    """PR 1 件の形の違い。合っていれば None。"""
    if not is_pr_number(at(node, ["number"])):
        return f"number が正の整数でない PR がある({json.dumps(node, ensure_ascii=False)})"
    if not isinstance(at(node, ["title"]), str):
        return f"title が文字列でない PR がある({json.dumps(node, ensure_ascii=False)})"
    return None


def page_problem(page, index):
    """1 ページの形の違い。合っていれば None。"""
    connection = at(page, ["data", "repository", "pullRequests"])
    if isinstance(page, dict) and "errors" in page:
        return f"{index} ページ目に errors がある({json.dumps(page['errors'], ensure_ascii=False)})"
    if not isinstance(at(connection, ["nodes"]), list):
        return f"{index} ページ目の data.repository.pullRequests.nodes が配列でない"
    if not isinstance(at(connection, ["pageInfo", "hasNextPage"]), bool):
        return f"{index} ページ目に pageInfo.hasNextPage が無い"
    return first_problem(map(node_problem, connection["nodes"]))


def problem_of(pages):
    """応答全体の形の違い。全件そろっていれば None。"""
    if not isinstance(pages, list) or len(pages) == 0:
        return "空でないページの配列でない(--slurp を付けた出力を渡す)"
    found = first_problem(page_problem(page, index) for index, page in enumerate(pages, 1))
    if found is not None:
        return found
    if at(pages[-1], ["data", "repository", "pullRequests", "pageInfo", "hasNextPage"]) is not False:
        return "最後のページの hasNextPage が false でない(応答が途中で切れている)"
    return None


try:
    pages = json.loads(open(source, encoding="utf-8").read())
except ValueError as error:
    sys.exit(f"題の応答を JSON として読めません({error})")
problem = problem_of(pages)
if problem is not None:
    sys.exit(f"題の応答が全件そろっていません: {problem}")
titles = {str(node["number"]): node["title"] for page in pages for node in page["data"]["repository"]["pullRequests"]["nodes"]}
open(out, "w", encoding="utf-8").write(json.dumps(titles, ensure_ascii=False))
PY
}

# 検査は clone の前に済ませる。落ちたものを置かないのと、取り直しのたびに同じ検査を繰り返さないため。
# 解説の sha と抜粋は、このスクリプトがあるリポジトリ(セッションの作業コピー)から読む。
case "$mode" in
  put-explain)
    python3 "$scripts_dir/build-pr-explain.py" "$3" --pr "$pr" --out "$work/explain.json" --repo "$scripts_dir" || exit $?
    is_pushed_explain "$work/explain.json" || { echo "解説の sha がリモートの追跡ブランチにありません(push・fetch してから置きます)" >&2; exit 1; }
    ;;
  put-map) python3 "$scripts_dir/check-pr-explain-template.py" "$4" || exit $? ;;
  put-list)
    python3 "$scripts_dir/check-pr-explain-template.py" "$3" || exit $?
    collect_titles "$2" "$work/titles.json" || exit 1
    ;;
esac

# gh-pages の有無。0 = ある、2 = 無い、それ以外 = 問い合わせに失敗した。
# 失敗の理由(認証・名前解決)を読めるよう、標準エラーは捨てない。
pages_branch_state() {
  git ls-remote --exit-code --heads "$remote" "$branch" >/dev/null
}

# gh-pages を取り、`sparse` のパターンだけを展開した作業コピーを `$work/site` に作る。
# gh-pages がまだ無ければ空の orphan を作る(既存のワークフローと同じ扱い)。`put-list` では作らず 4 を返す
# (理由は冒頭の `put-list` の項)。
checkout_site() {
  rm -rf "$work/site"
  pages_branch_state
  case $? in
    0) ;;
    2)
      [ "$mode" = put-list ] && return 4
      git init --quiet "$work/site" &&
        git -C "$work/site" checkout --quiet --orphan "$branch" &&
        git -C "$work/site" remote add origin "$remote" &&
        touch "$work/site/.nojekyll" &&
        git -C "$work/site" add .nojekyll
      return
      ;;
    *) return 1 ;;
  esac
  git clone --quiet --filter=blob:none --no-checkout --depth 1 --branch "$branch" --single-branch \
    "$remote" "$work/site" &&
    git -C "$work/site" sparse-checkout set --no-cone "${sparse[@]}" &&
    git -C "$work/site" checkout --quiet "$branch"
}

# `$folder` の中の、置くと決めた 3 つ以外のファイルを作業コピーから消す(サブフォルダの中も)。
# 消した分は `commit_and_push` の `git add -A` が拾う。
# $1 作業コピー
remove_others() {
  local path
  git -C "$1" ls-files -z -- "$folder" | while IFS= read -r -d '' path; do
    case "$path" in
      "$folder/index.html" | "$folder/change-map.json" | "$folder/explain.json") ;;
      *) rm -f -- "$1/$path" ;;
    esac
  done
}

# gh-pages の PR のフォルダから一覧を作り、一覧の枠と一緒に `pr-explain/` へ置く。
# $1 作業コピー, $2 一覧の枠
write_list() {
  git -C "$1" ls-tree -d --name-only HEAD pr-explain/ >"$work/folders" || return 1
  mkdir -p "$1/pr-explain"
  python3 - "$work/folders" "$work/titles.json" "$1/pr-explain/list.json" <<'PY' || return 1
import json, re, sys

folders, titles_path, out = sys.argv[1:4]
titles = json.load(open(titles_path, encoding="utf-8"))
found = [re.fullmatch(r"pr-explain/pr-([1-9][0-9]*)", line) for line in open(folders, encoding="utf-8").read().splitlines()]
numbers = sorted((int(match.group(1)) for match in found if match is not None), reverse=True)
# 題の応答は clone より前に引くので、その後に開いた PR のフォルダは応答に無い。次の run で題が付く。
pages = [{"pr": number, "title": titles.get(str(number))} for number in numbers]
open(out, "w", encoding="utf-8").write(json.dumps({"version": 1, "pages": pages}, ensure_ascii=False, indent=2) + "\n")
PY
  cp "$2" "$1/pr-explain/index.html"
}

# モードごとに `paths` を書き換える。返す 3 は先頭の終了コードの 3 と同じ。
apply_change() {
  local site="$work/site"
  case "$mode" in
    put-explain)
      [ -f "$site/$folder/change-map.json" ] || return 3
      cp "$work/explain.json" "$site/$folder/explain.json"
      ;;
    put-map)
      mkdir -p "$site/$folder"
      cp "$3" "$site/$folder/change-map.json"
      cp "$4" "$site/$folder/index.html"
      remove_others "$site"
      ;;
    put-list) write_list "$site" "$3" ;;
  esac
}

# 変更をコミットして push し、結果を 1 行出す。変更が無ければ push しない。
commit_and_push() {
  local site="$work/site"
  git -C "$site" add -A -- "${paths[@]}" || return 1
  if git -C "$site" diff --cached --quiet; then
    echo "$label: 変更なし"
    return 0
  fi
  git -C "$site" config user.name >/dev/null || git -C "$site" config user.name "github-actions[bot]"
  git -C "$site" config user.email >/dev/null || git -C "$site" config user.email "github-actions[bot]@users.noreply.github.com"
  git -C "$site" commit --quiet -m "$message" &&
    git -C "$site" push --quiet origin "HEAD:$branch" &&
    echo "$label: $mode を反映しました"
}

# `put-explain` で置いた解説の sha が地図の head と違えば、標準エラーに知らせる。置くのは止めない。
notify_stale() {
  [ "$mode" = "put-explain" ] || return 0
  python3 - "$work/explain.json" "$work/site/$folder/change-map.json" <<'PY'
import json, sys
explained = json.load(open(sys.argv[1], encoding="utf-8"))["sha"]
head = json.load(open(sys.argv[2], encoding="utf-8")).get("head")
if explained != head:
    print(f"解説の sha {explained[:7]} は地図の head {str(head)[:7]} と違います(置きました。ページは解説がどの時点のものかを帯で出します)", file=sys.stderr)
PY
  return 0
}

for attempt in $(seq 1 "$max_attempts"); do
  checkout_site
  checked_out=$?
  [ "$checked_out" -eq 4 ] && { echo "gh-pages がありません(一覧は作りません)"; exit 0; }
  if [ "$checked_out" -eq 0 ]; then
    apply_change "$@"
    applied=$?
    [ "$applied" -eq 3 ] && { echo "$folder/change-map.json がありません" >&2; exit 3; }
    [ "$applied" -eq 0 ] && commit_and_push && notify_stale && exit 0
  fi
  echo "gh-pages への反映に失敗しました($attempt 回目)。取り直してやり直します" >&2
  sleep $((attempt * retry_wait))
done
echo "gh-pages へ $max_attempts 回反映できませんでした" >&2
exit 1
