#!/usr/bin/env bash
#
# gh-pages の `pr-explain/pr-<番号>/`(PR の解説ページ)を書き換える。
#
# 使い方:
#   pr-explain-pages.sh put-page <PR 番号> <解説の断片>                  … 解説を組み立てて index.html に置く(セッションが呼ぶ)
#   pr-explain-pages.sh put-map  <PR 番号> <change-map.json> <テンプレート>  … 変更の地図を置く(Actions が呼ぶ)
#   pr-explain-pages.sh remove   <PR 番号>                              … フォルダごと消す(PR が閉じたとき)
#
# - `put-page` は `build-pr-explain-page.py` で断片を検査してテンプレートへ差し込む。違反があれば
#   push しない
# - `put-page` は `change-map.json` が無いフォルダへは置かない。Actions が作る前と、PR が閉じて
#   消した後に、セッションがフォルダを復活させないため
# - `put-map` は `index.html` が無いときだけテンプレートそのもの(「解説はまだ」)を置く。解説が
#   書かれる前でも、PR に貼った URL を 404 にしないため。あれば触らない
#
# gh-pages は Storybook 本体・PR プレビュー・VRT の撮影結果で数百 MB あるので、blob を取らない
# 浅い clone から `pr-explain/pr-<番号>/` だけを展開する。他のワークフローとの push の競合は、
# 取り直しからやり直して吸収する(最大 5 回)。
#
# 環境変数:
#   PR_EXPLAIN_REMOTE      push 先(既定はこのリポジトリの origin)
#   PR_EXPLAIN_RETRY_WAIT  n 回目の失敗の後に n × この秒数だけ待つ(既定 2)
#
# 終了コード: 0 = 置いた / 変更が無かった、1 = 断片が検査に落ちた・push できなかった、
#             2 = 引数の誤り、3 = `put-page` の置き先に地図が無い
set -uo pipefail

scripts_dir="$(cd "$(dirname "$0")" && pwd)"
branch="gh-pages"
max_attempts=5
retry_wait="${PR_EXPLAIN_RETRY_WAIT:-2}"

usage() {
  sed -n '/^# 使い方:/,/^#$/p' "$0" | sed 's/^# \{0,1\}//' >&2
  exit 2
}

mode="${1:-}"
pr="${2:-}"
[[ "$pr" =~ ^[1-9][0-9]*$ ]] || usage
case "$mode" in
  put-page) args_ok=$([ $# -eq 3 ] && [ -f "$3" ] && echo yes) ;;
  put-map) args_ok=$([ $# -eq 4 ] && [ -f "$3" ] && [ -f "$4" ] && echo yes) ;;
  remove) args_ok=$([ $# -eq 2 ] && echo yes) ;;
  *) args_ok="" ;;
esac
[ "$args_ok" = yes ] || usage

remote="${PR_EXPLAIN_REMOTE:-$(git -C "$scripts_dir" remote get-url origin)}"
folder="pr-explain/pr-$pr"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

if [ "$mode" = "put-page" ]; then
  python3 "$scripts_dir/build-pr-explain-page.py" "$3" --pr "$pr" --out "$work/index.html" || exit 1
fi

# gh-pages の有無。0 = ある、2 = 無い、それ以外 = 問い合わせに失敗した。
# 失敗の理由(認証・名前解決)を読めるよう、標準エラーは捨てない。
pages_branch_state() {
  git ls-remote --exit-code --heads "$remote" "$branch" >/dev/null
}

# gh-pages を取り、`$folder` だけを展開した作業コピーを `$work/site` に作る。
# gh-pages がまだ無ければ空の orphan を作る(既存のワークフローと同じ扱い)。
checkout_site() {
  rm -rf "$work/site"
  pages_branch_state
  case $? in
    0) ;;
    2)
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
    git -C "$work/site" sparse-checkout set --no-cone "/$folder/" &&
    git -C "$work/site" checkout --quiet "$branch"
}

# モードごとに `$folder` を書き換える。終了コード 3 は「置き先に地図が無い」で、やり直さない。
apply_change() {
  local site="$work/site"
  case "$mode" in
    put-page)
      [ -f "$site/$folder/change-map.json" ] || return 3
      cp "$work/index.html" "$site/$folder/index.html"
      ;;
    put-map)
      mkdir -p "$site/$folder"
      cp "$3" "$site/$folder/change-map.json"
      [ -f "$site/$folder/index.html" ] || cp "$4" "$site/$folder/index.html"
      ;;
    remove)
      git -C "$site" rm -r --quiet --ignore-unmatch -- "$folder"
      ;;
  esac
}

# 変更をコミットして push し、結果を 1 行出す。変更が無ければ push しない。
commit_and_push() {
  local site="$work/site"
  # `remove` は `git rm` で index まで反映済みで、消したフォルダを add すると pathspec が当たらず落ちる。
  if [ -e "$site/$folder" ]; then
    git -C "$site" add -A -- "$folder" || return 1
  fi
  if git -C "$site" diff --cached --quiet; then
    echo "$folder: 変更なし"
    return 0
  fi
  git -C "$site" config user.name >/dev/null || git -C "$site" config user.name "github-actions[bot]"
  git -C "$site" config user.email >/dev/null || git -C "$site" config user.email "github-actions[bot]@users.noreply.github.com"
  git -C "$site" commit --quiet -m "PR explain #$pr ($mode)" &&
    git -C "$site" push --quiet origin "HEAD:$branch" &&
    echo "$folder: $mode を反映しました"
}

# 消すものが無い。gh-pages を作ってまで空のコミットを置かない。
if [ "$mode" = "remove" ]; then
  pages_branch_state
  [ $? -eq 2 ] && { echo "$folder: gh-pages が無いので変更なし"; exit 0; }
fi

for attempt in $(seq 1 "$max_attempts"); do
  if checkout_site; then
    apply_change "$@"
    applied=$?
    [ "$applied" -eq 3 ] && { echo "$folder/change-map.json がありません(PR が開いていて、地図が作られた後に置けます)" >&2; exit 3; }
    [ "$applied" -eq 0 ] && commit_and_push && exit 0
  fi
  echo "gh-pages への反映に失敗しました($attempt 回目)。取り直してやり直します" >&2
  sleep $((attempt * retry_wait))
done
echo "gh-pages へ $max_attempts 回反映できませんでした" >&2
exit 1
