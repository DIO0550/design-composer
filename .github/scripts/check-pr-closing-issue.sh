#!/usr/bin/env bash
#
# この PR がマージ時に閉じる Issue を持っているかを検査する。1 件も無ければ exit 1。
#
# **判定は本文の綴りではなく、GitHub の GraphQL `closingIssuesReferences` に聞く。**
# 自前の正規表現で本文を見ると、`Closes: #1` のように GitHub が実際にはリンクしない
# 綴りでも緑になり、閉じ忘れがそこで素通りする。規約が求めるのは本文へ
# `Closes #<番号>` と書くことだが(AGENTS.md「着手した Issue は、その回で閉じる」)、
# この検査が見るのは綴りではなく閉じる Issue の有無なので、GitHub の UI から
# リンクした PR も通る。
#
# 閉じ忘れは push の時点でリポジトリに痕跡が残らない(PR がまだ無い)ので、git hooks には
# 置けない。CI だけが層として使える。
#
# 記録 PR は対象外。`harness-record` が出す記録は判断を持たず、対応する Issue も立てないので
# 閉じ忘れる Issue が存在しない。判定は「`harness/records/pr-<番号>.md` の新規 1 ファイルだけ」で、
# これが記録 PR の形であることは `.claude/skills/harness-record/SKILL.md`「Step 3」が持つ。
# **Step 3 の「差分は 1 ファイルだけ」を変えるときは、この条件も一緒に直す。**
#
# 使い方:
#   bash .github/scripts/check-pr-closing-issue.sh              # GitHub へ問い合わせる(CI)
#   bash .github/scripts/check-pr-closing-issue.sh <file.json>  # 問い合わせ結果を差し替える(動作確認)
#
# **問い合わせの側は CI でしか動かせない。** `gh` はローカルの検証環境に無く、判定表
# (`check-pr-closing-issue-cases.sh`)が覆うのは「問い合わせ結果 → 終了コード」だけなので、
# クエリのフィールド名・`permissions` の過不足が最初に分かるのは CI の 1 回目になる。
set -euo pipefail

# PR が閉じる Issue と、変更したファイルを 1 度の問い合わせで取る。
# ファイルの件数は `totalCount` が正確に返すので、`nodes` は 1 件目の中身を見るためだけに取る
fetch_pull_request() {
  gh api graphql \
    -F owner="${GITHUB_REPOSITORY%%/*}" \
    -F repo="${GITHUB_REPOSITORY##*/}" \
    -F number="${PR_NUMBER}" \
    -f query='
      query($owner: String!, $repo: String!, $number: Int!) {
        repository(owner: $owner, name: $repo) {
          pullRequest(number: $number) {
            closingIssuesReferences(first: 10) { nodes { number } }
            files(first: 1) { totalCount nodes { path changeType } }
          }
        }
      }'
}

result_file="${1:-}"
if [ -n "$result_file" ]; then
  result="$(cat "$result_file")"
else
  : "${GITHUB_REPOSITORY:?owner/repo が要る}"
  : "${PR_NUMBER:?PR 番号が要る}"
  result="$(fetch_pull_request)"
fi

closing_issues="$(
  jq -r '.data.repository.pullRequest.closingIssuesReferences.nodes
         | map("#\(.number)") | join(" ")' <<<"$result"
)"

if [ -n "$closing_issues" ]; then
  echo "マージ時に閉じる Issue: ${closing_issues}"
  exit 0
fi

# 記録 PR かどうか。`harness/records/pr-<番号>.md` の新規 1 ファイルだけがその形
is_record_pull_request="$(
  jq -r '.data.repository.pullRequest.files
         | .totalCount == 1
           and .nodes[0].changeType == "ADDED"
           and (.nodes[0].path | test("^harness/records/pr-[0-9]+\\.md$"))' <<<"$result"
)"

if [ "$is_record_pull_request" = "true" ]; then
  record="$(jq -r '.data.repository.pullRequest.files.nodes[0].path' <<<"$result")"
  echo "記録 PR のため対象外: ${record}"
  exit 0
fi

cat <<'MESSAGE'
この PR がマージ時に閉じる Issue がありません。

PR 本文に `Closes #<Issue 番号>` を書いてください
(AGENTS.md「着手した Issue は、その回で閉じる」)。
対応する Issue がまだ無いなら、先に立てます(implementation-flow フェーズ 1)。

対象外になるのは、`harness/records/pr-<番号>.md` の新規 1 ファイルだけを持つ記録 PR です。
MESSAGE
exit 1
