#!/usr/bin/env bash
#
# PR の解説ページを gh-pages の `pr-explain/pr-<番号>/` へ置く・消す。
#
# 使い方:
#   publish-pr-explain.sh page   <PR 番号> <解説の HTML>                … index.html を上書きする(セッションが呼ぶ)
#   publish-pr-explain.sh map    <PR 番号> <change-map.json> <テンプレート>  … 地図を置く(Actions が呼ぶ)
#   publish-pr-explain.sh remove <PR 番号>                              … フォルダごと消す(PR が閉じたとき)
#
# - `page` は push の前に `check-pr-explain-html.py` を通す。落ちたら push しない
# - `page` は `change-map.json` が無いフォルダへは書かない。Actions が作る前と、PR が閉じて
#   消した後に、セッションがフォルダを復活させないため
# - `map` は `index.html` が無いときだけテンプレートそのもの(「解説はまだ」)を置く。解説が
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
# 終了コード: 0 = 置いた / 変更が無かった、1 = 検査に落ちた・push できなかった、
#             2 = 引数の誤り、3 = `page` の置き先に地図が無い
set -uo pipefail

scripts_dir="$(cd "$(dirname "$0")" && pwd)"
branch="gh-pages"
max_attempts=5
retry_wait="${PR_EXPLAIN_RETRY_WAIT:-2}"

usage() {
  sed -n '5,8p' "$0" | sed 's/^# //' >&2
  exit 2
}

mode="${1:-}"
pr="${2:-}"
[[ "$pr" =~ ^[1-9][0-9]*$ ]] || usage
case "$mode" in
  page) [ $# -eq 3 ] && [ -f "$3" ] || usage ;;
  map) [ $# -eq 4 ] && [ -f "$3" ] && [ -f "$4" ] || usage ;;
  remove) [ $# -eq 2 ] || usage ;;
  *) usage ;;
esac

remote="${PR_EXPLAIN_REMOTE:-$(git -C "$scripts_dir" remote get-url origin)}"
folder="pr-explain/pr-$pr"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

if [ "$mode" = "page" ]; then
  python3 "$scripts_dir/check-pr-explain-html.py" "$3" || exit 1
fi

# gh-pages を取り、`$folder` だけを展開した作業コピーを `$work/site` に作る。
# gh-pages がまだ無ければ空の orphan を作る(既存のワークフローと同じ扱い)。
checkout_site() {
  rm -rf "$work/site"
  git ls-remote --exit-code --heads "$remote" "$branch" >/dev/null 2>&1
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
    "$remote" "$work/site" 2>/dev/null &&
    git -C "$work/site" sparse-checkout set --no-cone "/$folder/" &&
    git -C "$work/site" checkout --quiet "$branch"
}

# モードごとに `$folder` を書き換える。終了コード 3 は「置き先に地図が無い」で、やり直さない。
apply_change() {
  local site="$work/site"
  case "$mode" in
    page)
      [ -f "$site/$folder/change-map.json" ] || return 3
      cp "$3" "$site/$folder/index.html"
      ;;
    map)
      mkdir -p "$site/$folder"
      cp "$3" "$site/$folder/change-map.json"
      [ -f "$site/$folder/index.html" ] || cp "$4" "$site/$folder/index.html"
      ;;
    remove)
      git -C "$site" rm -r --quiet --ignore-unmatch -- "$folder"
      ;;
  esac
}

# 変更をコミットして push する。変更が無ければ何もしない。
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
    git -C "$site" push --quiet origin "HEAD:$branch"
}

for attempt in $(seq 1 "$max_attempts"); do
  if checkout_site; then
    apply_change "$@"
    applied=$?
    [ "$applied" -eq 3 ] && { echo "$folder/change-map.json がありません(PR が開いていて、地図が作られた後に置けます)" >&2; exit 3; }
    if [ "$applied" -eq 0 ] && commit_and_push; then
      echo "$folder: $mode を置きました"
      exit 0
    fi
  fi
  echo "gh-pages への反映に失敗しました($attempt 回目)。取り直してやり直します" >&2
  sleep $((attempt * retry_wait))
done
echo "gh-pages へ $max_attempts 回反映できませんでした" >&2
exit 1
