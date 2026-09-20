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
# **`repository.pullRequests(states: OPEN)` は先頭 100 件までしか見ない。** このリポジトリの
# 同時に開いている PR 数が 100 を超えたら取りこぼす(`check-duplicate-issue-pr-cases.sh` の
# 先頭コメントに実測件数を書く)。
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
            pullRequests(states: OPEN, first: 100) {
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

# 差し替え JSON での動作確認では GitHub へは投げない
[ -n "$result_file" ] && { echo "$duplicates"; exit 0; }

marker="<!-- sticky-comment: duplicate-issue-pr -->"
if [ "$(jq 'length' <<<"$duplicates")" -gt 0 ]; then
  lines="$(jq -r '.[] | "- Issue " + (.issues | map("#" + (. | tostring)) | join(", ")) + " は PR #" + (.pr | tostring) + " も閉じています。"' <<<"$duplicates")"
  body="$(printf '%s\n同じ Issue を閉じる PR が他にもあります。片方だけが必要か、着手前に確認してください。\n\n%s' "$marker" "$lines")"
else
  body="$(printf '%s\n現在、同じ Issue を閉じる他の open な PR はありません。' "$marker")"
fi

has_duplicates="$([ "$(jq 'length' <<<"$duplicates")" -gt 0 ] && echo true || echo false)"

existing="$(gh api "repos/${GITHUB_REPOSITORY}/issues/${PR_NUMBER}/comments" \
  --jq "[.[] | select(.body | startswith(\"$marker\"))][0].id // empty")"
if [ -n "$existing" ]; then
  gh api -X PATCH "repos/${GITHUB_REPOSITORY}/issues/comments/${existing}" -f body="$body"
elif [ "$has_duplicates" = true ]; then
  gh api -X POST "repos/${GITHUB_REPOSITORY}/issues/${PR_NUMBER}/comments" -f body="$body"
fi
