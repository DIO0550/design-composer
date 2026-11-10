#!/usr/bin/env bash
#
# PR に marker で始まる sticky コメントを 1 件だけ置く。marker で始まるコメントがあれば
# その本文を差し替え、無ければ `--if-missing` の指定に従って新しく貼るか何もしない。
#
# 使い方:
#   upsert-sticky-comment.sh --marker '<!-- 名前 -->' --body-file <本文のファイル> --if-missing post|skip
#
#   --marker      コメントの 1 行目に置き、次の実行がそれで始まるコメントを探す目印
#                 (`<!-- ` と ` -->` で囲んだ英数字・`:`・`_`・空白・`-` だけ)
#   --body-file   marker の行に続ける本文。起動時に 1 度だけ読む
#   --if-missing  marker で始まるコメントが無いとき、`post` なら新しく貼り、`skip` なら何もしない
#
# 環境変数:
#   GITHUB_REPOSITORY          `owner/repo`(必須)
#   PR_NUMBER                  貼る先の PR 番号(必須)
#   GH_TOKEN                   `gh` が使う。ここでは検査しない
#   STICKY_COMMENT_RETRY_WAIT  n 回目の失敗の後に n × この秒数だけ待つ(既定 2)
#
# 終了コード:
#   0 = 貼った / 差し替えた / 無くて貼らない指定だった
#   1 = 一覧か書き込みが 3 回とも失敗した・一覧が数値でない ID を返した。`gh` は 5xx も権限の誤り
#       (403 等)も区別せず失敗で返す(`gh help exit-codes`)ので、権限の誤りもここに入る。
#       exit 1 を受け流す呼び出し側では、権限の誤りでも赤にならず `::warning::` が残るだけになる
#   2 = 使い方の誤り(`gh` を呼ぶ前に返す)
#   3 = 一時ファイルを作れない・書けない(`gh` を呼ぶ前に返す)
#   受け流してよいのは 1 だけ。2・3 とスクリプトが見つからない 127 は呼び出し側の配線か環境の誤りなので赤にする
#
# **「一覧 → 書き込み」を 1 サイクルとして、失敗したらサイクルごとやり直す(最大 3 回)。**
# やり直すのは、GitHub の API が一時的な 5xx を返すため(`check-pr-closing-issue.sh` の冒頭に実例)。
# 書き込みだけをやり直すと、失敗を返した POST が実は通っていたときに二重に貼る。一覧から
# 取り直せば、通っていた POST のコメントが見つかって次は PATCH になる。
#
# 探すのは marker で**始まる**コメントだけ。途中に含むだけで拾うと、marker の綴りを引用した
# 人のコメントを差し替えてしまう。
set -uo pipefail

max_attempts=3
retry_wait="${STICKY_COMMENT_RETRY_WAIT:-2}"

usage() {
  sed -n '/^# 使い方:/,/^#$/p' "$0" | sed 's/^# \{0,1\}//' >&2
  exit 2
}

temp_file_failed() {
  echo "marker を付けた本文を一時ファイルへ書けなかった。コメントは触らない" >&2
  exit 3
}

marker="" body_file="" if_missing=""
while [ $# -gt 0 ]; do
  [ $# -ge 2 ] || usage
  case "$1" in
    --marker) marker="$2" ;;
    --body-file) body_file="$2" ;;
    --if-missing) if_missing="$2" ;;
    *) usage ;;
  esac
  shift 2
done

# marker は `--jq` の文字列リテラルへそのまま埋め込むので、`"` と `\` を綴りの形で締め出す
marker_pattern='^<!-- [A-Za-z0-9:_ -]+ -->$'
[[ "$marker" =~ $marker_pattern ]] || usage
case "$if_missing" in
  post | skip) ;;
  *) usage ;;
esac
[[ "${PR_NUMBER:-}" =~ ^[0-9]+$ ]] || usage
[ -n "${GITHUB_REPOSITORY:-}" ] || usage

# 本文は起動時に 1 度だけ読む。呼び出し側が `<(...)` で渡すと 2 度目の読み出しは空になり、
# やり直した後の書き込みが空の本文になる。
# `-f body="$body"` で引数に載せないのは、1 引数が 128KiB に達する本文で `gh` が起動できない(E2BIG)ため
[ -r "$body_file" ] || usage
body_with_marker="$(mktemp)" || temp_file_failed
trap 'rm -f "$body_with_marker"' EXIT
{ printf '%s\n' "$marker"; cat -- "$body_file"; } >"$body_with_marker" || temp_file_failed

comments_path="repos/${GITHUB_REPOSITORY}/issues/${PR_NUMBER}/comments"

# 1 サイクルを走らせる。一覧が数値でない ID を返したら、やり直さずにスクリプトごと exit 1 で終わる。
# @returns 0 = 済んだ、1 = 一覧か書き込みが失敗した(やり直す)
#
# **ページを送って全部見る。** `--if-missing skip` の呼び出し側は知らせることが出たときにしか貼らず、
# コメントが積もった後に貼られると 1 ページ目に載らない(実測: `per_page=1` で `rel="next"` が返る)。
# `--paginate` はページごとに `--jq` の結果を返すので先頭行だけを採る。`head` へのパイプで切らないのは、
# `gh` が SIGPIPE で落ちて失敗に読まれるため
upsert_once() {
  local ids existing
  ids="$(gh api --paginate "${comments_path}?per_page=100" \
    --jq "[.[] | select(.body | startswith(\"$marker\"))][0].id // empty")" || return 1
  existing="${ids%%$'\n'*}"

  if [ -z "$existing" ]; then
    [ "$if_missing" = skip ] && return 0
    gh api -X POST "$comments_path" --field body=@"$body_with_marker" >/dev/null || return 1
    return 0
  fi
  # 壊れた ID へ PATCH を打たない。やり直しても同じ応答が返るだけなので打ち切る
  if ! [[ "$existing" =~ ^[0-9]+$ ]]; then
    echo "コメントの一覧が数値でない ID を返した。コメントは触らない" >&2
    exit 1
  fi
  gh api -X PATCH "repos/${GITHUB_REPOSITORY}/issues/comments/${existing}" \
    --field body=@"$body_with_marker" >/dev/null || return 1
}

for attempt in $(seq 1 "$max_attempts"); do
  upsert_once && exit 0
  echo "コメントの一覧か書き込みに失敗した(${attempt} 回目)" >&2
  [ "$attempt" -lt "$max_attempts" ] && sleep $((attempt * retry_wait))
done
exit 1
