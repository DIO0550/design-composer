#!/usr/bin/env bash
#
# `block-git-add-all.sh` の判定表。Bash の PreToolUse の入力をフックへ流し、一括ステージングの拒否と
# 素通りが期待どおりかを 1 コマンドで確かめる。
#
# 使い方: bash .claude/hooks/lib/git-add-all-cases.sh
# 出力が `ok` だけなら期待どおり。`NG` が 1 行でも出たら判定が変わっている。
#
# 期待は 3 種。deny は止める(止めすぎている形も deny で固定する)、pass は通す、miss は止めない取りこぼし
# (通ることを固定する。フックが止めるようになったら NG になり、見る範囲が変わったことが表に出る)。
#
# ケースをファイルに置くのは、Bash で打って確かめると、deny の行は配線したあとのフック自身に止められるから。
#
# 表の 1 行は `期待|ケース名|コマンド`(コマンドは最後の列なので `|` を含んでよい)。コマンドの `@@` は改行に、
# `⇥` はタブに戻してから渡す。判定は `cases-report.sh` の `hook_verdict_by_permission`。
#
# 入力を組むのに jq を使う(`cases-fixtures.sh` の `bash_call_input`)ので、jq が無いと deny の行が NG になる。
# `harness/githooks/pre-push` は jq がある環境でだけ走らせる。
set -uo pipefail

lib_dir="$(cd "$(dirname "$0")" && pwd)"
. "$lib_dir/cases-report.sh"
. "$lib_dir/cases-fixtures.sh"

hook="$lib_dir/../block-git-add-all.sh"

cases_before=$cases_reported
while IFS='|' read -r expected label command; do
  command="${command//@@/$'\n'}"
  command="${command//⇥/$'\t'}"
  verdict="$(hook_verdict_by_permission "$hook" <<<"$(bash_call_input "$command")")"
  report "$expected" "$(normalize_miss "$expected" "$verdict")" "$label"
done <<'CASES'
deny|git add -A を止める|git add -A
deny|git add --all を止める|git add --all
deny|git add . を止める|git add .
deny|git add -a を止める（取り込み元のまま）|git add -a
deny|git add -- . を止める|git add -- .
deny|-A が最初の引数でない git add -v -A を止める|git add -v -A
deny|-A を束ねた git add -fA を止める|git add -fA
deny|パスの後ろに . を並べた git add src/a.ts . を止める|git add src/a.ts .
deny|パスを付けた git add -A src/ も止める（取り込み元のまま）|git add -A src/
deny|前置きの env を付けた git add -A を止める|env FOO=1 git add -A
deny|; の直前の git add . を止める|git add .; git status
deny|&& の後ろの git add -A を止める|git add src/a.ts && git add -A
deny|改行の後ろの git add -A を止める|git status@@git add -A
deny|"$(…)" の後ろに並べた git add -A を止める|git commit -m "$(date)" && git add -A && git commit -m "x"
deny|語の途中のアポストロフィの後ろの git add -A を止める|echo "don't" && git add -A
deny|"$(…)" の中の git add -A を止める|out="$(git add -A 2>&1)"
deny|"`…`" の中の git add -A を止める|out="`git add -A 2>&1`"
deny|<<-EOF のタブで字下げした閉じの後ろの git add -A を止める|git commit -F - <<-EOF@@⇥subject@@⇥EOF@@git add -A
pass|個別のパスの git add は通す|git add src/a.ts
pass|git add -u は通す|git add -u
pass|git add -p は通す|git add -p src/a.ts
pass|git add -N は通す|git add -N src/app/probe.ts
pass|-- の後ろが個別のパスなら通す|git add -- src/a.ts
pass|./ で始まるパスは通す|git add ./src
pass|ドットで始まるパスは通す|git add .claude/hooks/x.sh
pass|git commit -am は通す（追跡済みだけを載せる git add -u と同じ）|git commit -am "x"
pass|&& の後ろの ls -A は通す|git add src/a.ts && ls -A
pass|ダブルクォートの中の git add -A は通す|git commit -m "git add -A は使わない"
pass|シングルクォートの中の git add -A は通す|git commit -m 'git add -A は使わない'
pass|grep の引数の git add -A は通す|grep -rn "git add -A" .
pass|README の動作確認の JSON の中の git add -A は通す|echo '{"session_id":"probe","tool_input":{"command":"git add -A"}}' | bash .claude/hooks/block-git-during-verification-agent.sh
pass|<<'EOF' のヒアドキュメントの本文は通す|git commit -m "$(cat <<'EOF'@@subject@@@@git add -A は使わない@@EOF@@)"
pass|<<EOF のヒアドキュメントの本文は通す|git commit -F - <<EOF@@subject@@@@git add -A は使わない@@EOF
pass|<<"EOF" のヒアドキュメントの本文は通す|git commit -F - <<"EOF"@@subject@@@@git add -A は使わない@@EOF
pass|<< 'EOF'（空白あり）のヒアドキュメントの本文は通す|git commit -F - << 'EOF'@@subject@@@@git add -A は使わない@@EOF
pass|<<-EOF のヒアドキュメントの本文は通す|git commit -F - <<-EOF@@⇥subject@@@@⇥git add -A は使わない@@⇥EOF
pass|<<\EOF のヒアドキュメントの本文は通す|git commit -F - <<\EOF@@subject@@@@git add -A は使わない@@EOF
pass|= の直後のダブルクォートの中の git add -A は通す|gh api repos/o/r/issues/1/comments -f body="git add -A は使わない"
pass|行の継続の後ろの行頭のダブルクォートの中の git add -A は通す|grep -rn \@@"git add -A" .
pass|複数行にまたがる -m の中の git add -A は通す|git commit -m "subject@@@@git add -A は使わない"
pass|改行の後ろの ls -A は通す|git add src/a.ts@@ls -A
pass|空白で字下げした EOF ではヒアドキュメントを閉じない|git commit -F - <<'EOF'@@subject@@  EOF@@git add -A は使わない@@EOF
miss|git -C <パス> add -A は見ない|git -C src add -A
miss|git -c <設定> add -A は見ない|git -c core.autocrlf=false add -A
miss|git add ./ は見ない|git add ./
miss|git add :/ は見ない|git add :/
miss|git add * は見ない|git add *
miss|引用符で囲んだ git add "." は見ない|git add "."
miss|git stage -A は見ない|git stage -A
miss|bash -c の中の git add -A は見ない|bash -c "git add -A"
CASES
report_cases_ran CASES "$cases_before"
exit "$cases_failed"
