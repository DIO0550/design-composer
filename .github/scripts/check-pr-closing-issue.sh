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
# **クエリ本体は CI でしか動かせない。** 判定表(`check-pr-closing-issue-cases.sh`)は
# `gh` を差し替えて振る舞いを覆う(覆う範囲は判定表の冒頭)が、クエリのフィールド名・
# `permissions` の過不足が分かるのは CI で実際に叩いたときだけ。
set -euo pipefail

# PR が閉じる Issue と、変更したファイルを 1 度の問い合わせで取る。
# ファイルの件数は `totalCount` が正確に返すので、`nodes` は 1 件目の中身を見るためだけに取る。
#
# **間を空けて 3 回まで試す。** GitHub の API は一時的に 5xx を返す(この検査を入れた回に、
# PR の作成・更新が 500 / 502 で 5 回落ち、この検査自身も 502 で 1 度赤くなった)。
# 問い合わせが通らなかっただけで赤くすると、**閉じ忘れと区別が付かない赤**になり、
# 検査そのものが信用されなくなる。3 回とも駄目なら赤にする(握りつぶさない)。
# 失敗の種類では分けない。権限エラーのように再試行で変わらないものも結局赤になるので、
# 分けても結果が変わらず、`gh` のエラーは毎回ログに出る。
fetch_pull_request() {
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
              files(first: 1) { totalCount nodes { path changeType } }
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

# 問い合わせ結果が閉じる Issue を「#1 #2」の形で返す。無ければ空
closing_issues_of() {
  jq -r '.data.repository.pullRequest.closingIssuesReferences.nodes
         | map("#\(.number)") | join(" ")' <<<"$1"
}

# 記録 PR かどうか。`harness/records/pr-<番号>.md` の新規 1 ファイルだけがその形
is_record_pull_request() {
  local verdict
  verdict="$(
    jq -r '.data.repository.pullRequest.files
           | .totalCount == 1
             and .nodes[0].changeType == "ADDED"
             and (.nodes[0].path | test("^harness/records/pr-[0-9]+\\.md$"))' <<<"$1"
  )"
  [ "$verdict" = "true" ]
}

# 閉じる Issue が空なのが、GitHub 側の反映待ちでありうるか。
# PR を作った直後(`opened`)は、本文に `Closes #<番号>` があっても `closingIssuesReferences` が
# 数秒は空で返る(`harness/records/pr-757.md` 指摘 12)。記録 PR は閉じる Issue が無くても通るので待たない。
# `edited` は含めない。本文の手直しのたびに走るので、本来の赤(閉じ忘れ)に毎回待ちが乗る。
# 本文へ `Closes` を足した `edited` も反映待ちで赤になりうるが、次の編集・push か再実行で揃う。
awaits_closing_issue_link() {
  [ "$PR_ACTION" = "opened" ] || return 1
  [ -z "$(closing_issues_of "$1")" ] || return 1
  ! is_record_pull_request "$1"
}

# 反映待ちでありうる間だけ、間を空けて 2 回まで問い合わせ直し、最後の結果を返す。
# 待ちは 5xx の再試行と同じ形に揃えた。3 回とも空なら、そのまま閉じ忘れとして赤にする。
refetch_until_linked() {
  local result="$1" attempt
  for attempt in 1 2; do
    awaits_closing_issue_link "$result" || break
    printf '閉じる Issue がまだ反映されていない(%s 回目)。待って問い合わせ直す\n' "$attempt" >&2
    sleep $((attempt * 5))
    result="$(fetch_pull_request)" || return 1
  done
  printf '%s' "$result"
}

result_file="${1:-}"
if [ -n "$result_file" ]; then
  result="$(cat "$result_file")"
else
  : "${GITHUB_REPOSITORY:?owner/repo が要る}"
  : "${PR_NUMBER:?PR 番号が要る}"
  : "${PR_ACTION:?PR のイベント種別(opened 等)が要る}"
  result="$(fetch_pull_request)"
  result="$(refetch_until_linked "$result")"
fi

closing_issues="$(closing_issues_of "$result")"

if [ -n "$closing_issues" ]; then
  echo "マージ時に閉じる Issue: ${closing_issues}"
  exit 0
fi

if is_record_pull_request "$result"; then
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
