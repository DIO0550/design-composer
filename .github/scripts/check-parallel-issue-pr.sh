#!/usr/bin/env bash
#
# この PR が閉じる Issue を、他の open な PR も閉じていないか(同じ Issue を並行して
# 実装していないか)を検査し、あればコメントで知らせる。
#
# **判定では赤にしない。** 同じ Issue に 2 つの PR が立つこと自体は着手の判断の問題で、
# どちらが正しいかはここでは決められない(元 PR の作り直しのように 2 本目が正しい場合がある)。
# 赤にすると、その偽陽性がそのままマージのブロックになる。
# **そのぶん、赤は「問い合わせが 3 回とも通らなかった」だけを意味する。**
# コメントの投稿に失敗したときも赤にしない(警告だけ出す)。ステップへ
# `continue-on-error` を付ける形にしないのは、それだと問い合わせの失敗まで緑になるため。
#
# 見るのは本文の綴りではなく GitHub の GraphQL `closingIssuesReferences`。
# 理由は `check-pr-closing-issue.sh` と同じ(`Closes: #1` のように GitHub が実際にはリンク
# しない綴りを数えても、本当に閉じる Issue と食い違う)。
#
# **`Issue.closedByPullRequestsReferences` では引かない。** 1 段で引ける代わりに、この
# リポジトリの CI で 1 度も叩いていないフィールドになる。`closingIssuesReferences` は
# `check-pr-closing-issue.sh` が CI で叩いて動いている綴りなので、そちらだけで組む。
#
# 使い方:
#   PR_NUMBER=<番号> bash .github/scripts/check-parallel-issue-pr.sh              # GitHub へ問い合わせる(CI)
#   PR_NUMBER=<番号> bash .github/scripts/check-parallel-issue-pr.sh <file.json>  # 問い合わせ結果を差し替える(動作確認)
#
# **クエリ本体は CI でしか動かせない。** 判定表(`check-parallel-issue-pr-cases.sh`)は
# 「問い合わせ結果 → 判定行」「コメントを貼る/差し替える/貼らない」「失敗したときの扱い」を
# `gh` の差し替えで覆うが、クエリのフィールド名・`permissions` の過不足が分かるのは
# CI で実際に叩いたときだけ。
set -euo pipefail

marker='<!-- sticky-comment: parallel-issue-pr -->'

# この PR が閉じる Issue と、open な PR がそれぞれ閉じる Issue を 1 度の問い合わせで取る。
#
# 並びは更新の新しい順。100 件で切れたときに落ちるのが更新の止まった古い PR になるため
# (並行して実装している相手は、更新が新しい側にいる)。全件をページングして取る形にはしない。
# 問い合わせが 1 度で済まなくなる一方、切り詰めたときは範囲を注記で出すので黙って見落とさない。
#
# 入れ子の `closingIssuesReferences` が 20 件で切れたときに注記を出さないのは、1 つの PR が
# 20 件以上の Issue を閉じる形を運用上想定していないため(open な PR が 100 件を超えるのは、
# 運用が変わらなくても起こりうる)。切れても漏れるのは重複の判定だけで、誤検出にはならない。
#
# **間を空けて 3 回まで試す。** GitHub の API は一時的に 5xx を返す。判定で赤にしない検査
# なので、握りつぶすと検査が動いていないことに誰も気づけない。
fetch_pull_requests() {
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
              closingIssuesReferences(first: 20) { nodes { number } }
            }
            pullRequests(states: OPEN, first: 100, orderBy: { field: UPDATED_AT, direction: DESC }) {
              totalCount
              nodes {
                number
                closingIssuesReferences(first: 20) { nodes { number } }
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

# 重複を Issue ごとに 1 行の TSV(`<Issue 番号>\t#<PR 番号>, #<PR 番号>`)で出す。
# 重複が無ければ 1 行も出さない。判定行もコメントの表もこの 1 つから組み立てる
collect_duplicates() {
  jq -r --argjson self "$2" '
    .data.repository as $repo
    | ($repo.pullRequest.closingIssuesReferences.nodes | map(.number) | unique) as $mine
    | [ $repo.pullRequests.nodes[]
        | select(.number != $self)
        | .number as $pull_request
        | .closingIssuesReferences.nodes[].number
        | select(. as $issue | $mine | index($issue))
        | { issue: ., pull_request: $pull_request } ]
    | group_by(.issue)[]
    | "\(.[0].issue)\t" + ((map(.pull_request) | unique | map("#\(.)")) | join(", "))
  ' <<<"$1"
}

# 見た範囲が open な PR の全部ではないときの注記。全部見たなら空
truncation_note() {
  jq -r '
    .data.repository.pullRequests
    | select(.totalCount > (.nodes | length))
    | "注記: open な PR は \(.totalCount) 件あり、更新の新しい \(.nodes | length) 件だけを見た"
  ' <<<"$1"
}

# 貼ってある sticky コメントの id。無ければ空、一覧を取れなければ 1 を返す。
#
# **ページを送って全部見る。** 一覧は作成の古い順で返り、1 ページに収まらないことがある
# (実測: `per_page=1` で `rel="next"` の Link が返る)。このコメントは重複が出たときにしか
# 貼らないので、コメントが積もった後に貼られると 1 ページ目に載らない。見失うと二重に貼る。
#
# **失敗は `|| return 1` で明示する。** この関数は `if !` の条件位置から呼ばれるので、
# 関数の中では `set -e` が効かない(実測: `gh` が落ちても最後の `printf` の 0 が返り、
# 「コメントは無い」と読めて二重に貼った)。
#
# 先頭行だけを採るのは、`--paginate` がページごとに `--jq` の結果を返す場合に
# id が複数行で返るため。`head` で切ると `gh` が SIGPIPE で落ちて `pipefail` に引っかかる。
existing_comment_id() {
  local ids
  ids="$(gh api --paginate \
    "repos/${GITHUB_REPOSITORY}/issues/${PR_NUMBER}/comments?per_page=100" \
    --jq "[.[] | select(.body | startswith(\"$marker\"))][0].id // empty")" || return 1
  printf '%s' "${ids%%$'\n'*}"
}

# 貼ってあるコメントを差し替える。まだ無いときは、$when_absent が `create` のときだけ貼る
# (重複が無い回に新しく貼ると、どの PR にも常時 1 コメント増えるだけで合図にならない)
write_comment() {
  local body="$1" when_absent="$2" existing

  if ! existing="$(existing_comment_id)"; then
    echo 'コメントの一覧を取れなかった。コメントは触らない' >&2
    return 0
  fi

  if [ -n "$existing" ]; then
    gh api -X PATCH "repos/${GITHUB_REPOSITORY}/issues/comments/${existing}" \
      -f body="$body" >/dev/null || echo 'コメントの差し替えに失敗した' >&2
    return 0
  fi

  [ "$when_absent" = create ] || return 0
  gh api -X POST "repos/${GITHUB_REPOSITORY}/issues/${PR_NUMBER}/comments" \
    -f body="$body" >/dev/null || echo 'コメントの投稿に失敗した' >&2
}

duplicate_comment_body() {
  local rows
  rows="$(while IFS=$'\t' read -r issue pull_requests; do
    printf '| #%s | %s |\n' "$issue" "$pull_requests"
  done <<<"$1")"

  cat <<BODY
${marker}
### 同じ Issue を閉じる open な PR があります

| この PR が閉じる Issue | 同じ Issue を閉じる他の open な PR |
| --- | --- |
${rows}

別のセッションが同じ Issue を実装しているかもしれません。**どちらを残すかを決めてから進めてください**
(片方を丸ごと捨てた回が 3 回あり、いずれも PR を出した後に気づいています)。

この検査は知らせるだけで、CI を赤にしません。2 本目が正しい場合(元 PR の作り直しなど)は、
そのまま進めて構いません。
BODY
}

resolved_comment_body() {
  cat <<BODY
${marker}
同じ Issue を閉じる他の open な PR は、いまはありません。
BODY
}

: "${PR_NUMBER:?PR 番号が要る}"

result_file="${1:-}"
if [ -n "$result_file" ]; then
  result="$(cat "$result_file")"
else
  : "${GITHUB_REPOSITORY:?owner/repo が要る}"
  result="$(fetch_pull_requests)"
fi

closing_issue_count="$(
  jq -r '.data.repository.pullRequest.closingIssuesReferences.nodes | length' <<<"$result"
)"

# 閉じる Issue が無ければ重なりようがない。閉じ忘れ自体は `closing-issue` ジョブが見る
if [ "$closing_issue_count" = 0 ]; then
  echo '閉じる Issue なし'
  exit 0
fi

duplicates="$(collect_duplicates "$result" "$PR_NUMBER")"
note="$(truncation_note "$result")"

if [ -z "$duplicates" ]; then
  echo '重複なし'
  if [ -n "$note" ]; then echo "$note"; fi
  write_comment "$(resolved_comment_body)" keep
  exit 0
fi

while IFS=$'\t' read -r issue pull_requests; do
  printf '重複: Issue #%s → %s\n' "$issue" "$pull_requests"
done <<<"$duplicates"
if [ -n "$note" ]; then echo "$note"; fi

write_comment "$(duplicate_comment_body "$duplicates")" create
