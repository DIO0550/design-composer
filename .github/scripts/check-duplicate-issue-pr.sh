#!/usr/bin/env bash
#
# この PR が閉じる Issue を、別の PR(open / マージ済み)も閉じていないか、その Issue が既に
# クローズされていないかを検査する。
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
# 相手は 2 つの経路から集め、PR 番号で束ねる。
# - `repository.pullRequests(states: OPEN)` — open な PR を更新の新しい順に先頭 100 件まで
#   見る。100 件で切れたときに落ちるのは更新の止まった古い PR になる(並行して実装している
#   相手は、更新が新しい側にいる)
# - 閉じる Issue ごとの `closedByPullRequestsReferences` — 同じ関係の逆向き。merged の相手は
#   ここからしか見えない(先にマージされた PR は open の一覧に載らない。`harness/records/pr-631.md`)。
#   `states` を `[OPEN, MERGED]` へ広げる形は採らない。母数がリポジトリの全 PR になり、
#   100 件の切り詰めが常態になる。`includeClosedPrs` の既定が merged を含むかに依らないよう
#   `true` を明示し、マージされずに閉じた PR は jq で除く
# どちらも切れたときは `totalCount` と見た件数を注記に出し、黙って見落とさないようにする。
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
              state
              closingIssuesReferences(first: 10) {
                nodes {
                  number
                  state
                  closedByPullRequestsReferences(first: 20, includeClosedPrs: true) {
                    totalCount
                    nodes { number state }
                  }
                }
              }
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

# 自分以外の PR のうち、closing_issues と 1 件でも重なる相手を (PR, Issue) の組で集め、
# PR ごとに 1 件へ束ねる。並びは「open な PR の一覧の相手 → 逆向きの一覧だけに載っていた相手」。
# 差集合を 2 回取る(a - (a - b))のは、jq に組み込みの積集合演算子が無いため。
#
# 相手の種別は open を既定とし、マージ済みにだけ `merged: true` を付ける(コメントの文言が
# 変わるのはマージ済みの相手だけ)。
duplicates="$(
  jq -c --argjson closing "$closing_issues" --argjson self "${PR_NUMBER:-0}" '
    .data.repository as $repo
    | [ $repo.pullRequests.nodes[]
        | select(.number != $self)
        | . as $candidate
        | ($candidate.closingIssuesReferences.nodes | map(.number)) as $theirs
        | ($closing - ($closing - $theirs))[]
        | {pr: $candidate.number, issue: ., merged: false}
      ] as $scanned
    | [ $repo.pullRequest.closingIssuesReferences.nodes[]
        | .number as $issue
        | .closedByPullRequestsReferences.nodes[]
        | select(.number != $self)
        | select(.state == "OPEN" or .state == "MERGED")
        | {pr: .number, issue: $issue, merged: (.state == "MERGED")}
      ] as $reversed
    | reduce ($scanned + $reversed)[] as $pair ([];
        if any(.[]; .pr == $pair.pr)
        then map(if .pr == $pair.pr then .issues += ([$pair.issue] - .issues) else . end)
        else . + [{pr: $pair.pr, issues: [$pair.issue], merged: $pair.merged}]
        end)
    | map(if .merged then . else del(.merged) end)
  ' <<<"$result"
)"

# 既にクローズされている閉じる Issue。**自分が open のときだけ数える。** ワークフローは
# 本文の編集(`edited`)でマージ後にも走り、そのとき Issue は自分のマージで閉じている
closed_issues="$(
  jq -c '
    .data.repository.pullRequest
    | if .state == "OPEN"
      then [.closingIssuesReferences.nodes[] | select(.state == "CLOSED") | .number]
      else []
      end
  ' <<<"$result"
)"

has_duplicates="$([ "$(jq 'length' <<<"$duplicates")" -gt 0 ] && echo true || echo false)"
has_closed_issues="$([ "$(jq 'length' <<<"$closed_issues")" -gt 0 ] && echo true || echo false)"

echo "$duplicates"

if [ "$has_closed_issues" = true ]; then
  jq -r '"注意: この PR が閉じようとしている Issue " + (map("#" + tostring) | join(", ")) + " は既にクローズされています"' \
    <<<"$closed_issues"
fi

# 見た範囲が相手の全部でなければ、その旨を出す(open な PR の一覧 → Issue ごとの逆向きの一覧)
truncation_note="$(
  jq -r '
    (.data.repository.pullRequests
      | select(.totalCount > (.nodes | length))
      | "注記: open な PR は \(.totalCount) 件あり、更新の新しい \(.nodes | length) 件だけを見た"),
    (.data.repository.pullRequest.closingIssuesReferences.nodes[]
      | .closedByPullRequestsReferences as $refs
      | select($refs.totalCount > ($refs.nodes | length))
      | "注記: Issue #\(.number) を閉じる PR は \($refs.totalCount) 件あり、\($refs.nodes | length) 件だけを見た")
  ' <<<"$result"
)"
if [ -n "$truncation_note" ]; then echo "$truncation_note"; fi

# **コメントの投げ先が分かっているときだけ投げる。** 差し替え JSON を手で流す動作確認では
# 環境変数を置かないのでここで終わる(共通スクリプトへ進むと使い方の誤り exit 2 で赤になる)。
# 判定表は `gh` を差し替えて投げ先を渡し、貼る / 貼らないの指定と、共通スクリプトの 3 回失敗を
# 赤にしない扱いを実際に踏ませる
if [ -z "${GITHUB_REPOSITORY:-}" ] || [ -z "${PR_NUMBER:-}" ]; then
  exit 0
fi

marker="<!-- sticky-comment: duplicate-issue-pr -->"

sections=()
if [ "$has_duplicates" = true ]; then
  lines="$(jq -r '.[] | "- Issue " + (.issues | map("#" + (. | tostring)) | join(", ")) + (if .merged then " はマージ済みの PR #" else " は PR #" end) + (.pr | tostring) + " も閉じています。"' <<<"$duplicates")"
  sections+=("$(printf '同じ Issue を閉じる PR が他にもあります。片方だけが必要か、着手前に確認してください。\n\n%s' "$lines")")
fi
if [ "$has_closed_issues" = true ]; then
  lines="$(jq -r '.[] | "- Issue #" + tostring' <<<"$closed_issues")"
  sections+=("$(printf 'この PR が閉じようとしている Issue は既にクローズされています。\n\n%s' "$lines")")
fi

if [ "${#sections[@]}" -gt 0 ]; then
  body="$(printf '%s\n\n' "${sections[@]}")"
  if_missing=post
else
  body='現在、同じ Issue を閉じる他の PR(open / マージ済み)は無く、閉じる Issue もクローズされていません。'
  if_missing=skip
fi

# **コメント側の失敗では赤にしない。** 受け流すのは共通スクリプトの exit 1(3 回とも失敗)だけで、
# 呼び方の誤り(exit 2)や共通スクリプトが無い(127)は赤にする。赤はこのジョブでは「問い合わせが
# 3 回とも通らなかった」か「コメントの共通スクリプトを呼べなかった」を意味する(ステップに
# `continue-on-error` を置くと、その問い合わせの失敗まで緑になるので使わない)。
bash "$(dirname "$0")/upsert-sticky-comment.sh" --marker "$marker" \
  --body-file <(printf '%s' "$body") --if-missing "$if_missing" || {
  status=$?
  [ "$status" = 1 ] || exit "$status"
  echo 'コメントを貼れなかった(3 回とも失敗)' >&2
}
