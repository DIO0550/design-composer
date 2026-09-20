#!/usr/bin/env bash
#
# この PR が閉じる Issue を、別の open な PR も閉じていないかを検査する。
#
# **重複の判定は本文の綴りではなく、両方の PR の GraphQL `closingIssuesReferences` を
# 突き合わせる。** 片方向(この PR が閉じる Issue の cross-reference)だけを見ると、
# コミットメッセージで Issue 番号に触れただけの無関係な PR まで拾ってしまう
# (`CrossReferencedEvent` は「触れた」を表し「閉じる」を表さない)。閉じる Issue の番号が
# 両方の PR で一致する組だけを重複として報告する。
#
# 見つけても CI は赤にしない。同じ Issue へ 2 つの PR が並行して立つこと自体は
# ハーネスの外側(Issue の着手判断)の問題で、この検査だけでは正しい側を判定できない
# (`harness/records/pr-533.md` `pr-573.md` `pr-604.md` `pr-605.md` はいずれも、着手前に
# 既存 PR を確認する手順がどこにも無く、実装・レビュー・PR 作成のあとにようやく人の
# コメントや `mergeable_state` の変化で気づいている)。**このスクリプトの役割は、
# その「気づく」を PR が開いた直後まで早めることだけ。** 判定は sticky comment に残し、
# 重複が解消されたら同じコメントを解消済みへ書き換える(削除すると、後から来た人が
# 「一度も重複が無かった」のか「あったが消えた」のかを区別できなくなる)。
#
# 使い方:
#   bash check-duplicate-issue-pr.sh              # GitHub へ問い合わせる(CI)
#   bash check-duplicate-issue-pr.sh <file.json>  # 問い合わせ結果を差し替える(動作確認)
#
# **`repository.pullRequests(states: OPEN)` は先頭 100 件までしか見ない。** 並びを更新の
# 新しい順にしてあるので、100 件で切れたときに落ちるのは更新の止まった古い PR になる
# (並行して実装している相手は、更新が新しい側にいる)。切れたときは `totalCount` と
# 見た件数を注記に出し、黙って見落とさないようにする。
#
# 問い合わせ・再試行・`gh` の差し替えは `check-pr-closing-issue.sh` に倣う(同じ
# `closingIssuesReferences` を読む検査で、5xx の再試行が要ることは実測済み)。
set -euo pipefail

fetch() {
  local attempt response
  for attempt in 1 2 3; do
    if response="$(gh api graphql \
      -F owner="${GITHUB_REPOSITORY%%/*}" \
      -F repo="${GITHUB_REPOSITORY##*/}" \
      -F number="${PR_NUMBER}" \
      -f query='
        query($owner: String!, $repo: String!, $number: Int!) {
          repository(owner: $owner, name: $repo) {
            pullRequest(number: $number) {
              closingIssuesReferences(first: 10) { nodes { number } }
            }
            pullRequests(states: OPEN, first: 100, orderBy: { field: UPDATED_AT, direction: DESC }) {
              totalCount
              nodes {
                number
                closingIssuesReferences(first: 10) { nodes { number } }
              }
            }
          }
        }')"; then
      printf '%s' "$response"
      return 0
    fi
    [ "$attempt" = 3 ] && break
    printf '問い合わせに失敗した(%s 回目)。待って再試行する\n' "$attempt" >&2
    sleep $((attempt * 5))
  done
  return 1
}

result_file="${1:-}"
if [ -n "$result_file" ]; then
  result="$(cat "$result_file")"
else
  : "${GITHUB_REPOSITORY:?owner/repo が要る}"
  : "${PR_NUMBER:?PR 番号が要る}"
  result="$(fetch)"
fi

closing_issues="$(jq -c '[.data.repository.pullRequest.closingIssuesReferences.nodes[].number]' <<<"$result")"

# 自分以外の open な PR のうち、closing_issues と 1 件でも重なる相手だけを拾う。
# 差集合を 2 回取る(a - (a - b))のは、jq に組み込みの積集合演算子が無いため。
duplicates="$(
  jq -c --argjson closing "$closing_issues" --argjson self "${PR_NUMBER:-0}" '
    [ .data.repository.pullRequests.nodes[]
      | select(.number != $self)
      | . as $candidate
      | ($candidate.closingIssuesReferences.nodes | map(.number)) as $theirs
      | ($closing - ($closing - $theirs)) as $overlap
      | select($overlap | length > 0)
      | {pr: $candidate.number, issues: $overlap}
    ]' <<<"$result"
)"

echo "$duplicates"

# 見た範囲が open な PR の全部でなければ、その旨を出す
truncation_note="$(
  jq -r '
    .data.repository.pullRequests
    | select(.totalCount > (.nodes | length))
    | "注記: open な PR は \(.totalCount) 件あり、更新の新しい \(.nodes | length) 件だけを見た"
  ' <<<"$result"
)"
if [ -n "$truncation_note" ]; then echo "$truncation_note"; fi

# **コメントの投げ先が分かっているときだけ投げる。** 差し替え JSON を手で流す動作確認では
# 環境変数を置かないのでここで終わる。判定表は `gh` を差し替えたうえで投げ先を渡し、
# 貼る / 差し替える / 貼らないの分岐を実際に踏ませる
if [ -z "${GITHUB_REPOSITORY:-}" ] || [ -z "${PR_NUMBER:-}" ]; then
  exit 0
fi

marker="<!-- sticky-comment: duplicate-issue-pr -->"
if [ "$(jq 'length' <<<"$duplicates")" -gt 0 ]; then
  lines="$(jq -r '.[] | "- Issue " + (.issues | map("#" + (. | tostring)) | join(", ")) + " は PR #" + (.pr | tostring) + " も閉じています。"' <<<"$duplicates")"
  body="$(printf '%s\n同じ Issue を閉じる PR が他にもあります。片方だけが必要か、着手前に確認してください。\n\n%s' "$marker" "$lines")"
else
  body="$(printf '%s\n現在、同じ Issue を閉じる他の open な PR はありません。' "$marker")"
fi

has_duplicates="$([ "$(jq 'length' <<<"$duplicates")" -gt 0 ] && echo true || echo false)"

# **ページを送って全部見る。** 一覧は作成の古い順で、1 ページに収まらないことがある
# (実測: `per_page=1` で `rel="next"` の Link が返る)。このコメントは重複が出たときにしか
# 貼らないので、コメントが積もった後に貼られると 1 ページ目に載らない。見失うと二重に貼る。
# 先頭行だけを採るのは、`--paginate` がページごとに `--jq` の結果を返す場合に 2 行以上
# 返るため(`head` で切ると `gh` が SIGPIPE で落ちて `pipefail` に引っかかる)。
#
# **コメント側の失敗では赤にしない。** 赤はこのジョブでは「問い合わせが 3 回とも
# 通らなかった」だけを意味する(ステップに `continue-on-error` を置くと、その問い合わせの
# 失敗まで緑になるので使わない)。
if ! comment_ids="$(gh api --paginate \
  "repos/${GITHUB_REPOSITORY}/issues/${PR_NUMBER}/comments?per_page=100" \
  --jq "[.[] | select(.body | startswith(\"$marker\"))][0].id // empty")"; then
  echo 'コメントの一覧を取れなかった。コメントは触らない' >&2
  exit 0
fi
existing="${comment_ids%%$'\n'*}"

if [ -n "$existing" ]; then
  gh api -X PATCH "repos/${GITHUB_REPOSITORY}/issues/comments/${existing}" -f body="$body" \
    >/dev/null || echo 'コメントの差し替えに失敗した' >&2
elif [ "$has_duplicates" = true ]; then
  gh api -X POST "repos/${GITHUB_REPOSITORY}/issues/${PR_NUMBER}/comments" -f body="$body" \
    >/dev/null || echo 'コメントの投稿に失敗した' >&2
fi
